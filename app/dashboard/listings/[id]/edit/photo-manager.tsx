"use client";

import Image from "next/image";
import { useRef, useState, useTransition } from "react";
import {
  IMAGE_TYPES,
  MAX_IMAGE_BYTES,
  MAX_IMAGES_PER_LISTING,
} from "@/lib/listing-options";
import {
  confirmImageUpload,
  deleteImage,
  moveImage,
  requestImageUpload,
  type ActionResult,
} from "../../actions";

type Photo = { id: string; url: string };

type Props = {
  listingId: string;
  photos: Photo[];
};

const buttonClass =
  "rounded bg-white/90 px-2 py-0.5 text-xs font-medium text-zinc-900 disabled:opacity-40";

export function PhotoManager({ listingId, photos }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, startTransition] = useTransition();
  const [progress, setProgress] = useState<string>();
  const [error, setError] = useState<string>();
  const remaining = MAX_IMAGES_PER_LISTING - photos.length;

  // Uploads one file: presign → PUT straight to R2 → confirm.
  async function uploadFile(file: File): Promise<string | undefined> {
    if (!(file.type in IMAGE_TYPES)) return `${file.name}: use a JPEG, PNG or WebP photo.`;
    if (file.size > MAX_IMAGE_BYTES) return `${file.name}: photos must be under 10 MB.`;

    const presigned = await requestImageUpload(listingId, file.type, file.size);
    if ("error" in presigned) return presigned.error;

    const response = await fetch(presigned.url, {
      method: "PUT",
      headers: { "Content-Type": file.type },
      body: file,
    });
    if (!response.ok) return `${file.name}: upload failed.`;

    const confirmed = await confirmImageUpload(listingId, presigned.key);
    return confirmed.error;
  }

  function handleFiles(fileList: FileList | null) {
    const files = Array.from(fileList ?? []).slice(0, remaining);
    if (files.length === 0) return;
    setError(undefined);

    // Sequential so each confirm sees the previous photo's position.
    startTransition(async () => {
      const errors: string[] = [];
      for (const [index, file] of files.entries()) {
        setProgress(`Uploading ${index + 1} of ${files.length}…`);
        const uploadError = await uploadFile(file).catch(() => `${file.name}: upload failed.`);
        if (uploadError) errors.push(uploadError);
      }
      setProgress(undefined);
      if (errors.length > 0) setError(errors.join(" "));
      if (inputRef.current) inputRef.current.value = "";
    });
  }

  function run(action: () => Promise<ActionResult>) {
    setError(undefined);
    startTransition(async () => {
      const result = await action();
      if (result.error) setError(result.error);
    });
  }

  return (
    <div className="flex flex-col gap-4">
      {photos.length > 0 ? (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {photos.map((photo, index) => (
            <li
              key={photo.id}
              className="relative aspect-[4/3] overflow-hidden rounded-md bg-zinc-100 dark:bg-zinc-800"
            >
              <Image
                src={photo.url}
                alt={`Photo ${index + 1}`}
                fill
                sizes="(min-width: 640px) 33vw, 50vw"
                className="object-cover"
              />
              {index === 0 && (
                <span className="absolute left-2 top-2 rounded bg-zinc-900/80 px-2 py-0.5 text-xs text-white">
                  Cover
                </span>
              )}
              <div className="absolute inset-x-2 bottom-2 flex justify-between gap-1">
                <div className="flex gap-1">
                  <button
                    type="button"
                    aria-label="Move earlier"
                    disabled={pending || index === 0}
                    className={buttonClass}
                    onClick={() => run(() => moveImage(listingId, photo.id, "up"))}
                  >
                    ←
                  </button>
                  <button
                    type="button"
                    aria-label="Move later"
                    disabled={pending || index === photos.length - 1}
                    className={buttonClass}
                    onClick={() => run(() => moveImage(listingId, photo.id, "down"))}
                  >
                    →
                  </button>
                </div>
                <button
                  type="button"
                  disabled={pending}
                  className={`${buttonClass} text-red-600`}
                  onClick={() => run(() => deleteImage(listingId, photo.id))}
                >
                  Remove
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          No photos yet. Add at least one to publish. The first photo is the cover.
        </p>
      )}

      <div className="flex items-center gap-4">
        <label
          className={`cursor-pointer rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium dark:border-zinc-700 ${
            pending || remaining <= 0 ? "pointer-events-none opacity-50" : ""
          }`}
        >
          Add photos
          <input
            ref={inputRef}
            type="file"
            accept={Object.keys(IMAGE_TYPES).join(",")}
            multiple
            className="sr-only"
            disabled={pending || remaining <= 0}
            onChange={(event) => handleFiles(event.target.files)}
          />
        </label>
        <span className="text-sm text-zinc-600 dark:text-zinc-400">
          {progress ?? `${photos.length} / ${MAX_IMAGES_PER_LISTING} photos`}
        </span>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
