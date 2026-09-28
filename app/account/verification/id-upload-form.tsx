"use client";

import { useState, useTransition } from "react";
import {
  ID_DOC_TYPES,
  isIdDocType,
  MAX_ID_DOC_BYTES,
  MAX_ID_DOCS,
} from "@/lib/verification-options";
import { requestIdDocUploadAction, submitIdVerificationAction } from "./actions";

export function IdUploadForm() {
  const [files, setFiles] = useState<File[]>([]);
  const [pending, startTransition] = useTransition();
  const [progress, setProgress] = useState<string>();
  const [error, setError] = useState<string>();

  // Uploads one file: presign → PUT straight to the private bucket.
  async function uploadFile(file: File): Promise<{ key: string } | { error: string }> {
    const presigned = await requestIdDocUploadAction(file.type, file.size);
    if ("error" in presigned) return { error: presigned.error };

    const response = await fetch(presigned.url, {
      method: "PUT",
      headers: { "Content-Type": file.type },
      body: file,
    });
    if (!response.ok) return { error: `${file.name}: upload failed.` };
    return { key: presigned.key };
  }

  function handleSelect(fileList: FileList | null) {
    setError(undefined);
    const selected = Array.from(fileList ?? []);
    if (selected.length > MAX_ID_DOCS) {
      setError(`Choose at most ${MAX_ID_DOCS} files (front and back).`);
      return;
    }
    const invalid = selected.find((file) => !isIdDocType(file.type));
    if (invalid) return setError(`${invalid.name}: use a JPEG, PNG, WebP or PDF file.`);
    const tooBig = selected.find((file) => file.size > MAX_ID_DOC_BYTES);
    if (tooBig) return setError(`${tooBig.name}: files must be under 10 MB.`);
    setFiles(selected);
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (files.length === 0) return setError("Choose your ID document first.");
    setError(undefined);

    startTransition(async () => {
      const keys: string[] = [];
      for (const [index, file] of files.entries()) {
        setProgress(`Uploading ${index + 1} of ${files.length}…`);
        const uploaded = await uploadFile(file).catch(() => ({
          error: `${file.name}: upload failed.`,
        }));
        if ("error" in uploaded) {
          setProgress(undefined);
          setError(uploaded.error);
          return;
        }
        keys.push(uploaded.key);
      }

      setProgress("Submitting…");
      const result = await submitIdVerificationAction(keys);
      setProgress(undefined);
      if (result.error) setError(result.error);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label htmlFor="id_docs" className="text-sm font-medium">
          National ID or Iqama (front and back)
        </label>
        <input
          id="id_docs"
          type="file"
          accept={Object.keys(ID_DOC_TYPES).join(",")}
          multiple
          disabled={pending}
          onChange={(event) => handleSelect(event.target.files)}
          className="text-sm"
        />
        <p className="text-xs text-zinc-600 dark:text-zinc-400">
          JPEG, PNG, WebP or PDF, up to 10 MB each.
        </p>
      </div>
      <button
        type="submit"
        disabled={pending || files.length === 0}
        className="self-start rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
      >
        {progress ?? "Submit for review"}
      </button>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </form>
  );
}
