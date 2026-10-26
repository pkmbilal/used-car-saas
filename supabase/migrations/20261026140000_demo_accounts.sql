-- Demo accounts: test sellers that stay on production for trying features
-- but are invisible to the public. Demo profiles and their listings are
-- readable only by demo accounts (and the service role, i.e. the admin panel).

alter table public.profiles add column is_demo boolean not null default false;
-- Profiles use column-level grants; this column is granted to nobody, so only
-- the service role (admin panel) reads or flips it.

-- Security definer so the listings policy can see demo profiles that the
-- profiles policy hides, and so the profiles policy doesn't recurse.
create function public.is_demo_user(p_user uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce((select is_demo from public.profiles where id = p_user), false);
$$;

revoke execute on function public.is_demo_user(uuid) from public;
grant execute on function public.is_demo_user(uuid) to anon, authenticated;

drop policy "Profiles are publicly readable" on public.profiles;
create policy "Profiles are publicly readable"
  on public.profiles for select
  to anon, authenticated
  using (
    not public.is_demo_user(id)
    or id = (select auth.uid())
    or public.is_demo_user((select auth.uid()))
  );

drop policy "Active listings are public; sellers see their own" on public.listings;
create policy "Active listings are public; sellers see their own"
  on public.listings for select
  to anon, authenticated
  using (
    (
      status = 'active'
      and (not public.is_demo_user(seller_id) or public.is_demo_user((select auth.uid())))
    )
    or seller_id = (select auth.uid())
  );
