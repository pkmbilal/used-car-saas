-- Owners can give an optional reason when declining a rental request. Both
-- parties read it through the existing select policy; it is written only by
-- owner_respond_rental. Limit must match MAX_RENTAL_NOTE in lib/rental-quote.ts.

alter table public.rental_requests
  add column decline_reason text check (char_length(decline_reason) <= 500);

drop function public.owner_respond_rental(uuid, text);

create function public.owner_respond_rental(
  p_request_id uuid, p_action text, p_reason text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller uuid := (select auth.uid());
  request public.rental_requests;
begin
  select * into request
  from public.rental_requests r
  where r.id = p_request_id and r.owner_id = caller
  for update;

  if request.id is null or request.status <> 'pending' then
    raise exception 'request_not_open' using errcode = 'P0001';
  end if;

  if p_action = 'accept' then
    update public.rental_requests
    set status = 'accepted', responded_at = now()
    where id = request.id;
  elsif p_action = 'decline' then
    if char_length(p_reason) > 500 then
      raise exception 'note_too_long' using errcode = 'P0001';
    end if;
    update public.rental_requests
    set status = 'declined', responded_at = now(),
        decline_reason = nullif(btrim(p_reason), '')
    where id = request.id;
  else
    raise exception 'invalid_action' using errcode = 'P0001';
  end if;
exception
  -- Accepting dates that overlap another accepted booking.
  when exclusion_violation then
    raise exception 'dates_unavailable' using errcode = 'P0001';
end;
$$;

revoke execute on function public.owner_respond_rental(uuid, text, text) from public, anon;
grant execute on function public.owner_respond_rental(uuid, text, text) to authenticated;
