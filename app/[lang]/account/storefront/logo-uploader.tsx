"use client";

import Image from "next/image";
import { useRef, useState, useTransition } from "react";
import { useDictionary } from "@/components/i18n-provider";
import { compressImage } from "@/lib/compress-image";
import { translateMessage } from "@/lib/dictionary";
import { IMAGE_TYPES } from "@/lib/listing-options";
import { MAX_LOGO_BYTES } from "@/lib/storefront-options";
import { confirmLogoUpload, removeLogo, requestLogoUpload } from "./actions";

type Props = {
  logoUrl: string | null;
};

export function LogoUploader({ logoUrl }: Props) {
  const { t } = useDictionary();
  const s = t.account.storefront;
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string>();

  // compress → presign → PUT straight to R2 → confirm.
  async function uploadFile(original: File): Promise<string | undefined> {
    if (!(original.type in IMAGE_TYPES)) return "Use a JPEG, PNG or WebP image.";
    const file = await compressImage(original, { maxEdge: 512, quality: 0.85 });
    if (file.size > MAX_LOGO_BYTES) return "Logos must be under 2 MB.";

    const presigned = await requestLogoUpload(file.type, file.size);
    if ("error" in presigned) return presigned.error;

    const response = await fetch(presigned.url, {
      method: "PUT",
      headers: { "Content-Type": file.type },
      body: file,
    });
    if (!response.ok) return "Upload failed.";

    const confirmed = await confirmLogoUpload(presigned.key);
    return confirmed.error;
  }

  function handleFile(file: File | undefined) {
    if (!file) return;
    setError(undefined);
    startTransition(async () => {
      const uploadError = await uploadFile(file).catch(() => "Upload failed.");
      if (uploadError) setError(translateMessage(t, uploadError));
      if (inputRef.current) inputRef.current.value = "";
    });
  }

  function handleRemove() {
    setError(undefined);
    startTransition(async () => {
      const result = await removeLogo();
      if (result.error) setError(translateMessage(t, result.error));
    });
  }

  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-medium">{s.logo}</span>
      <div className="flex items-center gap-4">
        <div className="relative size-20 overflow-hidden rounded-lg border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900">
          {logoUrl ? (
            <Image src={logoUrl} alt={s.logoAlt} fill sizes="80px" className="object-contain" />
          ) : (
            <span className="flex size-full items-center justify-center text-xs text-zinc-500">
              {s.noLogo}
            </span>
          )}
        </div>
        <label
          className={`cursor-pointer rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium dark:border-zinc-700 ${
            pending ? "pointer-events-none opacity-50" : ""
          }`}
        >
          {pending ? s.uploading : logoUrl ? s.replace : s.upload}
          <input
            ref={inputRef}
            type="file"
            accept={Object.keys(IMAGE_TYPES).join(",")}
            className="sr-only"
            disabled={pending}
            onChange={(event) => handleFile(event.target.files?.[0])}
          />
        </label>
        {logoUrl && (
          <button
            type="button"
            disabled={pending}
            onClick={handleRemove}
            className="text-sm text-red-600 disabled:opacity-50"
          >
            {s.remove}
          </button>
        )}
      </div>
      <p className="text-xs text-zinc-500">{s.logoHint}</p>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
