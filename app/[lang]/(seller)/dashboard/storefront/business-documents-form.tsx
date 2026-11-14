"use client";

import { useState, useTransition } from "react";
import { FileCheck2 } from "lucide-react";
import { useDictionary } from "@/components/i18n-provider";
import { fmt, translateMessage } from "@/lib/dictionary";
import { REGISTRATION_NUMBER_MAX } from "@/lib/dealer-application-options";
import { ID_DOC_TYPES, isIdDocType, MAX_ID_DOC_BYTES } from "@/lib/verification-options";
import { requestBusinessDocUpload, saveBusinessDocuments } from "./actions";

type Doc = "vat" | "muroor";

type Props = {
  vatNumber: string | null;
  muroorNumber: string | null;
  hasDoc: Record<Doc, boolean>;
};

const FIELDS = [
  { doc: "vat", name: "vat_number" },
  { doc: "muroor", name: "muroor_number" },
] as const;

const inputClass =
  "rounded-md border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900";

// VAT and Muroor details for an approved dealer. Files go browser → private R2
// bucket via presigned PUTs, then the numbers and keys are saved together.
export function BusinessDocumentsForm({ vatNumber, muroorNumber, hasDoc }: Props) {
  const { t } = useDictionary();
  const d = t.account.dealer;
  const s = t.account.storefront.documents;
  const optional = <span className="font-normal text-zinc-500">{t.account.optional}</span>;
  const numbers = { vat_number: vatNumber, muroor_number: muroorNumber };

  const [files, setFiles] = useState<Partial<Record<Doc, File>>>({});
  const [pending, startTransition] = useTransition();
  const [progress, setProgress] = useState<string>();
  const [error, setError] = useState<string>();
  const [saved, setSaved] = useState(false);

  function handleSelect(doc: Doc, file: File | undefined) {
    setError(undefined);
    setSaved(false);
    if (file && !isIdDocType(file.type)) return setError(fmt(d.fileType, { name: file.name }));
    if (file && file.size > MAX_ID_DOC_BYTES) return setError(fmt(d.fileSize, { name: file.name }));
    setFiles((current) => ({ ...current, [doc]: file }));
  }

  async function uploadFile(file: File): Promise<{ key: string } | { error: string }> {
    const presigned = await requestBusinessDocUpload(file.type, file.size);
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
    const form = event.currentTarget;
    const formData = new FormData(form);
    setError(undefined);
    setSaved(false);

    startTransition(async () => {
      const chosen = FIELDS.flatMap(({ doc }) => {
        const file = files[doc];
        return file ? [{ doc, file }] : [];
      });

      const keys: Partial<Record<Doc, string>> = {};
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

      setProgress(t.common.saving);
      const result = await saveBusinessDocuments(formData, keys);
      setProgress(undefined);
      if (result.error) return setError(translateMessage(t, result.error));

      setFiles({});
      form.querySelectorAll<HTMLInputElement>('input[type="file"]').forEach((input) => (input.value = ""));
      setSaved(true);
    });
  }

  return (
    <section className="flex flex-col gap-4 border-t border-zinc-200 pt-8 dark:border-zinc-800">
      <div>
        <h2 className="text-lg font-medium">
          {s.title} {optional}
        </h2>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{s.intro}</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <fieldset className="flex flex-col gap-4" disabled={pending}>
          {FIELDS.map(({ doc, name }) => (
            <div key={doc} className="flex flex-col gap-3 rounded-md border border-zinc-200 p-4 dark:border-zinc-800">
              <div className="flex flex-col gap-1">
                <label htmlFor={name} className="text-sm font-medium">
                  {d.numbers[name]}
                </label>
                <input
                  id={name}
                  name={name}
                  maxLength={REGISTRATION_NUMBER_MAX}
                  defaultValue={numbers[name] ?? ""}
                  dir="ltr"
                  className={inputClass}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label htmlFor={`${doc}_doc`} className="text-sm font-medium">
                  {d.docs[doc]}
                </label>
                {hasDoc[doc] && (
                  <p className="flex items-center gap-1.5 text-sm text-green-700 dark:text-green-400">
                    <FileCheck2 className="size-4 shrink-0" aria-hidden />
                    {s.uploaded}
                    <span className="text-zinc-500">· {s.replaceHint}</span>
                  </p>
                )}
                <input
                  id={`${doc}_doc`}
                  type="file"
                  accept={Object.keys(ID_DOC_TYPES).join(",")}
                  onChange={(event) => handleSelect(doc, event.target.files?.[0])}
                  className="text-sm"
                />
              </div>
            </div>
          ))}
        </fieldset>

        {error && <p className="text-sm text-red-600">{error}</p>}
        {saved && <p className="text-sm text-green-700">{s.saved}</p>}
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-zinc-900 px-4 py-2 text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
        >
          {progress ?? s.save}
        </button>
      </form>
    </section>
  );
}
