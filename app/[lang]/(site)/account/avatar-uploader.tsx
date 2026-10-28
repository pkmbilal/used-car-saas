"use client";

import { useRef, useState, useTransition } from "react";
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

  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-medium">{a.label}</span>
      <div className="flex items-center gap-4">
        <div className={pending ? "opacity-50" : ""}>
          <Avatar name={name} src={avatarUrl} size="xl" />
        </div>
        <label
          className={`cursor-pointer rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium dark:border-zinc-700 ${
            pending ? "pointer-events-none opacity-50" : ""
          }`}
        >
          {pending ? a.uploading : avatarUrl ? a.replace : a.upload}
          <input
            ref={inputRef}
            type="file"
            accept={Object.keys(IMAGE_TYPES).join(",")}
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
            className="text-sm text-red-600 disabled:opacity-50"
          >
            {a.remove}
          </button>
        )}
      </div>
      <p className="text-xs text-zinc-500">{a.hint}</p>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
