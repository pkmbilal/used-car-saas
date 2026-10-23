"use client";

import { useState, useTransition } from "react";
import type { Profile } from "@/lib/auth";
import { CITIES } from "@/lib/cities";
import {
  DEALER_DOC_TYPES,
  DEALER_DOCS,
  REGISTRATION_NUMBER_MAX,
  type DealerDoc,
  type DealerPlan,
} from "@/lib/dealer-application-options";
import { BUSINESS_NAME_MAX, SHOWROOM_ADDRESS_MAX } from "@/lib/storefront-options";
import { ID_DOC_TYPES, isIdDocType, MAX_ID_DOC_BYTES } from "@/lib/verification-options";
import { requestDealerDocUploadAction, submitDealerApplicationAction } from "../actions";

type Props = {
  profile: Pick<Profile, "full_name" | "phone" | "city" | "business_name" | "showroom_address">;
  defaultPlan?: DealerPlan;
};

const inputClass =
  "rounded-md border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900";

const optional = <span className="font-normal text-zinc-500">(optional)</span>;

const NUMBER_FIELDS: { name: string; label: string; doc: DealerDoc }[] = [
  { name: "cr_number", label: "CR number", doc: "cr" },
  { name: "vat_number", label: "VAT number", doc: "vat" },
  { name: "muroor_number", label: "Muroor certificate number", doc: "muroor" },
];

const PLAN_CHOICES = [
  { value: "dealer", label: "Dealer", note: "30 listings a month, storefront, CSV import" },
  { value: "dealer_pro", label: "Pro", note: "100 listings a month, storefront, CSV import, featured listings" },
  { value: "showroom", label: "Showroom", note: "Unlimited listings, storefront, CSV import, featured listings" },
] as const;

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

export function DealerApplicationForm({ profile, defaultPlan = "dealer" }: Props) {
  const [files, setFiles] = useState<Partial<Record<DealerDoc, File>>>({});
  const [pending, startTransition] = useTransition();
  const [progress, setProgress] = useState<string>();
  const [error, setError] = useState<string>();

  function handleSelect(doc: DealerDoc, file: File | undefined) {
    setError(undefined);
    if (file && !isIdDocType(file.type)) {
      return setError(`${file.name}: use a JPEG, PNG, WebP or PDF file.`);
    }
    if (file && file.size > MAX_ID_DOC_BYTES) {
      return setError(`${file.name}: files must be under 10 MB.`);
    }
    setFiles((current) => ({ ...current, [doc]: file }));
  }

  // Uploads one document: presign → PUT straight to the private bucket.
  async function uploadFile(file: File): Promise<{ key: string } | { error: string }> {
    const presigned = await requestDealerDocUploadAction(file.type, file.size);
    if ("error" in presigned) return { error: presigned.error };

    const response = await fetch(presigned.url, {
      method: "PUT",
      headers: { "Content-Type": file.type },
      body: file,
    });
    if (!response.ok) return { error: `${file.name}: upload failed.` };
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
        setProgress(`Uploading ${index + 1} of ${chosen.length}…`);
        const uploaded = await uploadFile(file).catch(() => ({
          error: `${file.name}: upload failed.`,
        }));
        if ("error" in uploaded) {
          setProgress(undefined);
          setError(uploaded.error);
          return;
        }
        keys[doc] = uploaded.key;
      }

      setProgress("Submitting…");
      const result = await submitDealerApplicationAction(formData, keys);
      setProgress(undefined);
      if (result?.error) setError(result.error);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-8">
      <fieldset className="flex flex-col gap-4" disabled={pending}>
        <legend className="mb-4 text-lg font-medium">Contact person</legend>
        <Field id="full_name" label="Full name">
          <input
            id="full_name"
            name="full_name"
            required
            autoComplete="name"
            defaultValue={profile.full_name ?? ""}
            className={inputClass}
          />
        </Field>
        <Field id="phone" label="Mobile number">
          <input
            id="phone"
            name="phone"
            type="tel"
            required
            autoComplete="tel"
            placeholder="05XXXXXXXX"
            defaultValue={profile.phone ?? ""}
            className={inputClass}
          />
        </Field>
        <Field id="city" label="City">
          <select
            id="city"
            name="city"
            required
            defaultValue={profile.city ?? ""}
            className={inputClass}
          >
            <option value="" disabled>
              Choose a city
            </option>
            {CITIES.map((city) => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
          </select>
        </Field>
      </fieldset>

      <fieldset className="flex flex-col gap-4" disabled={pending}>
        <legend className="mb-4 text-lg font-medium">Business</legend>
        <Field id="business_name" label="Business name">
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
        <Field id="showroom_address" label={<>Showroom address {optional}</>}>
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
        <legend className="mb-1 text-lg font-medium">Registration {optional}</legend>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Documents help us approve you faster. JPEG, PNG, WebP or PDF, up to 10 MB each. Only our
          team can see them.
        </p>
        {NUMBER_FIELDS.map(({ name, label, doc }) => (
          <div key={name} className="flex flex-col gap-3 rounded-md border border-zinc-200 p-4 dark:border-zinc-800">
            <Field id={name} label={label}>
              <input
                id={name}
                name={name}
                maxLength={REGISTRATION_NUMBER_MAX}
                className={inputClass}
              />
            </Field>
            <Field id={`${doc}_doc`} label={DEALER_DOCS[doc]}>
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

      <fieldset className="flex flex-col gap-3" disabled={pending}>
        <legend className="mb-4 text-lg font-medium">Plan</legend>
        {PLAN_CHOICES.map((plan) => (
          <label
            key={plan.value}
            className="flex cursor-pointer items-start gap-3 rounded-md border border-zinc-200 p-4 has-[:checked]:border-zinc-900 dark:border-zinc-800 dark:has-[:checked]:border-zinc-100"
          >
            <input
              type="radio"
              name="requested_plan"
              value={plan.value}
              defaultChecked={plan.value === defaultPlan}
              className="mt-1"
            />
            <span>
              <span className="block text-sm font-medium">{plan.label}</span>
              <span className="block text-sm text-zinc-600 dark:text-zinc-400">{plan.note}</span>
            </span>
          </label>
        ))}
        <p className="text-xs text-zinc-600 dark:text-zinc-400">
          Our team reviews your application and contacts you about payment. You can list cars on
          the free plan in the meantime.
        </p>
      </fieldset>

      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-zinc-900 px-4 py-2 text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
      >
        {progress ?? "Submit dealer application"}
      </button>
    </form>
  );
}
