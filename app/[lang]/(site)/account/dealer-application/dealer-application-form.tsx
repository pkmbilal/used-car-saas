"use client";

import { useRef, useState, useTransition } from "react";
import { MapPin } from "lucide-react";
import { useDictionary } from "@/components/i18n-provider";
import { SearchableSelect } from "@/components/searchable-select";
import type { Profile } from "@/lib/auth";
import { CITIES } from "@/lib/cities";
import { cityName, fmt, translateMessage } from "@/lib/dictionary";
import { REGISTRATION_NUMBER_MAX } from "@/lib/dealer-application-options";
import { BUSINESS_NAME_MAX, SHOWROOM_ADDRESS_MAX } from "@/lib/storefront-options";
import { ID_DOC_TYPES, isIdDocType, MAX_ID_DOC_BYTES } from "@/lib/verification-options";
import { requestDealerDocUploadAction, submitDealerApplicationAction } from "../actions";

type Props = {
  profile: Pick<Profile, "full_name" | "phone" | "city" | "business_name" | "showroom_address">;
  freeUntil: string; // formatted end of the free launch
};

const inputClass =
  "rounded-md border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900";

const triggerClass =
  "w-full rounded-md border border-zinc-300 bg-transparent px-3 py-2 text-start outline-none focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-brand/20 data-[state=open]:border-brand dark:border-zinc-700 dark:bg-zinc-900 dark:focus-visible:border-lime";

// Sign-up only asks for the CR, which is what an admin checks to verify a
// dealer. VAT and Muroor are added later from the dashboard storefront page.

function Field({
  id,
  label,
  children,
}: {
  id: string;
  label: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      {children}
    </div>
  );
}

export function DealerApplicationForm({ profile, freeUntil }: Props) {
  const { t } = useDictionary();
  const d = t.account.dealer;
  const f = t.account.form;
  const optional = <span className="font-normal text-zinc-500">{t.account.optional}</span>;
  const [crFile, setCrFile] = useState<File>();
  const [city, setCity] = useState(profile.city ?? "");
  const [crMissing, setCrMissing] = useState(false);
  const crInput = useRef<HTMLInputElement>(null);
  const [pending, startTransition] = useTransition();
  const [progress, setProgress] = useState<string>();
  const [error, setError] = useState<string>();

  function handleSelect(file: File | undefined) {
    setError(undefined);
    if (file && !isIdDocType(file.type)) {
      return setError(fmt(d.fileType, { name: file.name }));
    }
    if (file && file.size > MAX_ID_DOC_BYTES) {
      return setError(fmt(d.fileSize, { name: file.name }));
    }
    setCrFile(file);
  }

  // Uploads one document: presign → PUT straight to the private bucket.
  async function uploadFile(file: File): Promise<{ key: string } | { error: string }> {
    const presigned = await requestDealerDocUploadAction(file.type, file.size);
    if ("error" in presigned) return { error: translateMessage(t, presigned.error) };

    const response = await fetch(presigned.url, {
      method: "PUT",
      headers: { "Content-Type": file.type },
      body: file,
    });
    if (!response.ok) return { error: fmt(d.uploadFailed, { name: file.name }) };
    return { key: presigned.key };
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setError(undefined);

    if (!String(formData.get("cr_number") ?? "").trim()) {
      setCrMissing(true);
      crInput.current?.focus();
      return;
    }

    startTransition(async () => {
      const keys: { cr?: string } = {};
      if (crFile) {
        setProgress(fmt(d.uploading, { index: 1, count: 1 }));
        const uploaded = await uploadFile(crFile).catch(() => ({
          error: fmt(d.uploadFailed, { name: crFile.name }),
        }));
        if ("error" in uploaded) {
          setProgress(undefined);
          setError(uploaded.error);
          return;
        }
        keys.cr = uploaded.key;
      }

      setProgress(d.submitting);
      const result = await submitDealerApplicationAction(formData, keys);
      setProgress(undefined);
      if (result?.error) setError(translateMessage(t, result.error));
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-8">
      <fieldset className="flex flex-col gap-4" disabled={pending}>
        <legend className="mb-4 text-lg font-medium">{d.contactPerson}</legend>
        <Field id="full_name" label={f.fullName}>
          <input
            id="full_name"
            name="full_name"
            required
            autoComplete="name"
            defaultValue={profile.full_name ?? ""}
            className={inputClass}
          />
        </Field>
        <Field id="phone" label={f.mobile}>
          <input
            id="phone"
            name="phone"
            type="tel"
            required
            autoComplete="tel"
            dir="ltr"
            placeholder="05XXXXXXXX"
            defaultValue={profile.phone ?? ""}
            className={inputClass}
          />
        </Field>
        <Field id="city" label={f.city}>
          <SearchableSelect
            id="city"
            name="city"
            required
            disabled={pending}
            value={city}
            onValueChange={setCity}
            placeholder={f.chooseCity}
            searchPlaceholder={t.select.searchCities}
            emptyText={t.select.noMatches}
            options={CITIES.map((value) => ({ value, label: cityName(t, value) }))}
            icon={<MapPin className="size-4 shrink-0 text-zinc-400" aria-hidden />}
            triggerClassName={triggerClass}
          />
        </Field>
      </fieldset>

      <fieldset className="flex flex-col gap-4" disabled={pending}>
        <legend className="mb-4 text-lg font-medium">{d.business}</legend>
        <Field id="business_name" label={d.businessName}>
          <input
            id="business_name"
            name="business_name"
            required
            minLength={2}
            maxLength={BUSINESS_NAME_MAX}
            autoComplete="organization"
            defaultValue={profile.business_name ?? ""}
            className={inputClass}
          />
        </Field>
        <Field id="showroom_address" label={<>{d.showroomAddress} {optional}</>}>
          <input
            id="showroom_address"
            name="showroom_address"
            maxLength={SHOWROOM_ADDRESS_MAX}
            autoComplete="street-address"
            defaultValue={profile.showroom_address ?? ""}
            className={inputClass}
          />
        </Field>
      </fieldset>

      <fieldset className="flex flex-col gap-4" disabled={pending}>
        <legend className="mb-1 text-lg font-medium">{d.registration}</legend>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          {d.registrationHint}
        </p>
        <div className="flex flex-col gap-3 rounded-md border border-zinc-200 p-4 dark:border-zinc-800">
          <Field
            id="cr_number"
            label={
              <>
                {d.numbers.cr_number}{" "}
                <span className="text-red-600" aria-hidden>
                  *
                </span>
                <span className="sr-only">({d.required})</span>
              </>
            }
          >
            {/* Checked in handleSubmit so the warning shows inline, not as a browser tooltip. */}
            <input
              ref={crInput}
              id="cr_number"
              name="cr_number"
              aria-required
              aria-invalid={crMissing || undefined}
              aria-describedby={crMissing ? "cr_number_error" : undefined}
              maxLength={REGISTRATION_NUMBER_MAX}
              onChange={() => setCrMissing(false)}
              className={`${inputClass} ${crMissing ? "border-red-500 ring-2 ring-red-500/25 focus:border-red-500 focus:ring-red-500/25 dark:border-red-500" : ""}`}
            />
            {crMissing && (
              <p id="cr_number_error" role="alert" className="text-sm text-red-600">
                {d.crRequired}
              </p>
            )}
          </Field>
          <Field id="cr_doc" label={<>{d.docs.cr} {optional}</>}>
            <input
              id="cr_doc"
              type="file"
              accept={Object.keys(ID_DOC_TYPES).join(",")}
              onChange={(event) => handleSelect(event.target.files?.[0])}
              className="text-sm"
            />
          </Field>
        </div>
      </fieldset>

      <div className="rounded-md border border-green-200 bg-green-50 p-4 text-sm text-green-900 dark:border-green-900 dark:bg-green-950 dark:text-green-200">
        <p className="font-medium">{d.freeTitle}</p>
        <p className="mt-1">{fmt(d.freeHint, { date: freeUntil })}</p>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-zinc-900 px-4 py-2 text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
      >
        {progress ?? d.submit}
      </button>
    </form>
  );
}
