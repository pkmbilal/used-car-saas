"use client";

import { useState, useTransition } from "react";
import { useDictionary } from "@/components/i18n-provider";
import type { Profile } from "@/lib/auth";
import { CITIES } from "@/lib/cities";
import { cityName, fmt, translateMessage } from "@/lib/dictionary";
import {
  DEALER_DOC_TYPES,
  REGISTRATION_NUMBER_MAX,
  type DealerDoc,
} from "@/lib/dealer-application-options";
import { BUSINESS_NAME_MAX, SHOWROOM_ADDRESS_MAX } from "@/lib/storefront-options";
import { ID_DOC_TYPES, isIdDocType, MAX_ID_DOC_BYTES } from "@/lib/verification-options";
import { requestDealerDocUploadAction, submitDealerApplicationAction } from "../actions";

type Props = {
  profile: Pick<Profile, "full_name" | "phone" | "city" | "business_name" | "showroom_address">;
  freeUntil: string; // formatted end of the free launch
};

const inputClass =
  "rounded-md border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900";

// The CR number is required; it's what an admin checks to verify a dealer.
const NUMBER_FIELDS = [
  { name: "cr_number", doc: "cr", required: true },
  { name: "vat_number", doc: "vat", required: false },
  { name: "muroor_number", doc: "muroor", required: false },
] as const satisfies readonly { name: string; doc: DealerDoc; required: boolean }[];

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
  const [files, setFiles] = useState<Partial<Record<DealerDoc, File>>>({});
  const [pending, startTransition] = useTransition();
  const [progress, setProgress] = useState<string>();
  const [error, setError] = useState<string>();

  function handleSelect(doc: DealerDoc, file: File | undefined) {
    setError(undefined);
    if (file && !isIdDocType(file.type)) {
      return setError(fmt(d.fileType, { name: file.name }));
    }
    if (file && file.size > MAX_ID_DOC_BYTES) {
      return setError(fmt(d.fileSize, { name: file.name }));
    }
    setFiles((current) => ({ ...current, [doc]: file }));
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

    startTransition(async () => {
      const chosen = DEALER_DOC_TYPES.flatMap((doc) => {
        const file = files[doc];
        return file ? [{ doc, file }] : [];
      });

      const keys: Partial<Record<DealerDoc, string>> = {};
      for (const [index, { doc, file }] of chosen.entries()) {
        setProgress(fmt(d.uploading, { index: index + 1, count: chosen.length }));
        const uploaded = await uploadFile(file).catch(() => ({
          error: fmt(d.uploadFailed, { name: file.name }),
        }));
        if ("error" in uploaded) {
          setProgress(undefined);
          setError(uploaded.error);
          return;
        }
        keys[doc] = uploaded.key;
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
          <select
            id="city"
            name="city"
            required
            defaultValue={profile.city ?? ""}
            className={inputClass}
          >
            <option value="" disabled>
              {f.chooseCity}
            </option>
            {CITIES.map((city) => (
              <option key={city} value={city}>
                {cityName(t, city)}
              </option>
            ))}
          </select>
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
        {NUMBER_FIELDS.map(({ name, doc, required }) => (
          <div key={name} className="flex flex-col gap-3 rounded-md border border-zinc-200 p-4 dark:border-zinc-800">
            <Field id={name} label={required ? d.numbers[name] : <>{d.numbers[name]} {optional}</>}>
              <input
                id={name}
                name={name}
                required={required}
                maxLength={REGISTRATION_NUMBER_MAX}
                className={inputClass}
              />
            </Field>
            <Field id={`${doc}_doc`} label={<>{d.docs[doc]} {optional}</>}>
              <input
                id={`${doc}_doc`}
                type="file"
                accept={Object.keys(ID_DOC_TYPES).join(",")}
                onChange={(event) => handleSelect(doc, event.target.files?.[0])}
                className="text-sm"
              />
            </Field>
          </div>
        ))}
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
