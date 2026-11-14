"use client";

import { useRef, useState, useTransition } from "react";
import { Camera, Loader2, Trash2, Upload } from "lucide-react";
import { Avatar } from "@/components/avatar";
import { useDictionary } from "@/components/i18n-provider";
import { MAX_AVATAR_BYTES } from "@/lib/avatar";
import { compressImage } from "@/lib/compress-image";
import { translateMessage } from "@/lib/dictionary";
import { IMAGE_TYPES } from "@/lib/listing-options";
import { confirmAvatarUpload, removeAvatar, requestAvatarUpload } from "./actions";

type Props = {
  name: string | null;
  avatarUrl: string | null;
};

export function AvatarUploader({ name, avatarUrl }: Props) {
  const { t } = useDictionary();
  const a = t.account.avatar;
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string>();

  // compress → presign → PUT straight to R2 → confirm.
  async function uploadFile(original: File): Promise<string | undefined> {
    if (!(original.type in IMAGE_TYPES)) return "Use a JPEG, PNG or WebP image.";
    const file = await compressImage(original, { maxEdge: 512, quality: 0.85 });
    if (file.size > MAX_AVATAR_BYTES) return "Profile photos must be under 2 MB.";

    const presigned = await requestAvatarUpload(file.type, file.size);
    if ("error" in presigned) return presigned.error;

    const response = await fetch(presigned.url, {
      method: "PUT",
      headers: { "Content-Type": file.type },
      body: file,
    });
    if (!response.ok) return "Upload failed.";

    const confirmed = await confirmAvatarUpload(presigned.key);
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
      const result = await removeAvatar();
      if (result.error) setError(translateMessage(t, result.error));
    });
  }

  const accept = Object.keys(IMAGE_TYPES).join(",");

  return (
    <div className="flex flex-col gap-3">
      <span className="text-sm font-medium">{a.label}</span>
      <div className="flex flex-wrap items-center gap-4">
        <label
          className={`group relative cursor-pointer rounded-full ring-2 ring-zinc-100 ring-offset-2 transition-shadow hover:ring-brand/50 dark:ring-zinc-800 dark:ring-offset-zinc-900 ${
            pending ? "pointer-events-none" : ""
          }`}
        >
          <span className="sr-only">{avatarUrl ? a.replace : a.upload}</span>
          <span className={pending ? "opacity-50" : ""}>
            <Avatar name={name} src={avatarUrl} size="xl" />
          </span>
          <span
            aria-hidden
            className="absolute inset-0 grid place-items-center rounded-full bg-black/45 text-white opacity-0 transition-opacity group-hover:opacity-100"
          >
            <Camera className="size-6" />
          </span>
          {pending && (
            <span aria-hidden className="absolute inset-0 grid place-items-center text-brand">
              <Loader2 className="size-6 animate-spin" />
            </span>
          )}
          <input
            type="file"
            accept={accept}
            className="sr-only"
            disabled={pending}
            tabIndex={-1}
            onClick={(event) => {
              event.currentTarget.value = "";
            }}
            onChange={(event) => handleFile(event.target.files?.[0])}
          />
        </label>
        <div className="flex flex-wrap items-center gap-2">
          <label
            className={`inline-flex min-h-9 cursor-pointer items-center gap-1.5 rounded-full bg-white px-4 text-sm font-semibold text-zinc-700 shadow-sm ring-1 ring-zinc-200 transition-colors hover:bg-zinc-50 hover:text-zinc-900 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-brand/50 dark:bg-zinc-900 dark:text-zinc-200 dark:ring-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-white ${
              pending ? "pointer-events-none opacity-50" : ""
            }`}
          >
            <Upload className="size-4" aria-hidden />
            {pending ? a.uploading : avatarUrl ? a.replace : a.upload}
            <input
              ref={inputRef}
              type="file"
              accept={accept}
              className="sr-only"
              disabled={pending}
              onChange={(event) => handleFile(event.target.files?.[0])}
            />
          </label>
          {avatarUrl && (
            <button
              type="button"
              disabled={pending}
              onClick={handleRemove}
              className="inline-flex min-h-9 items-center gap-1.5 rounded-full px-3 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50 dark:text-red-400 dark:hover:bg-red-950/40"
            >
              <Trash2 className="size-4" aria-hidden />
              {a.remove}
            </button>
          )}
        </div>
      </div>
      <p className="text-xs text-zinc-500 dark:text-zinc-400">{a.hint}</p>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
