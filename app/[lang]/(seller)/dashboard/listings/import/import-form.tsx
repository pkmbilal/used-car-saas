"use client";

import { ArrowUpRight, FileDown, FileSpreadsheet, Loader2, Upload } from "lucide-react";
import { useActionState, useRef, useState } from "react";
import { useDictionary } from "@/components/i18n-provider";
import Link from "@/components/locale-link";
import { rich } from "@/components/rich-text";
import { count, fmt, translateMessage } from "@/lib/dictionary";
import { Notice } from "../../notice";
import { importListings, type ImportFormState } from "./actions";

const ctaClass =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-gradient-to-b from-brand to-forest px-5 text-sm font-semibold text-white shadow-md shadow-forest/25 transition-all hover:text-white hover:shadow-lg hover:shadow-forest/30 hover:brightness-110 focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:ring-offset-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-60 motion-safe:hover:-translate-y-px dark:focus-visible:ring-offset-zinc-950";
const secondaryClass =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-line bg-white px-4 text-sm font-semibold text-zinc-800 shadow-sm transition-colors hover:border-forest/30 hover:bg-forest/5 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800";

function formatSize(bytes: number, locale: string): string {
  return new Intl.NumberFormat(locale === "ar" ? "ar-SA-u-nu-latn" : "en-US", {
    style: "unit",
    unit: "kilobyte",
    maximumFractionDigits: 0,
  }).format(Math.max(1, Math.round(bytes / 1024)));
}

export function ImportForm({ templateHref, maxBytes }: { templateHref: string; maxBytes: number }) {
  const [state, formAction, pending] = useActionState<ImportFormState, FormData>(
    importListings,
    {},
  );
  const { t, locale } = useDictionary();
  const p = t.dashboard.import;
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);

  function onDrop(event: React.DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    setDragging(false);
    const dropped = event.dataTransfer.files[0];
    const input = inputRef.current;
    if (!dropped || !input) return;
    // Put the dropped file on the real input so the form submits it.
    const transfer = new DataTransfer();
    transfer.items.add(dropped);
    input.files = transfer.files;
    setFile(dropped);
  }

  return (
    <div>
      {/* React resets the form after each submit; clear the picked file with it. */}
      <form action={formAction} onReset={() => setFile(null)}>
        <label
          onDragOver={(event) => {
            event.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          className={`flex cursor-pointer flex-col items-center rounded-2xl border-2 border-dashed px-6 py-10 text-center transition-colors focus-within:ring-2 focus-within:ring-brand/40 ${
            dragging
              ? "border-brand bg-mint dark:border-lime dark:bg-lime/10"
              : file
                ? "border-brand/40 bg-mint/50 dark:border-lime/40 dark:bg-lime/5"
                : "border-line bg-canvas hover:border-brand/40 hover:bg-mint/40 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:border-lime/40"
          }`}
        >
          <input
            ref={inputRef}
            type="file"
            name="file"
            accept=".csv,text/csv"
            required
            onChange={(event) => setFile(event.currentTarget.files?.[0] ?? null)}
            className="sr-only"
          />
          <span className="grid size-14 place-items-center rounded-2xl bg-white text-brand shadow-sm ring-1 ring-line dark:bg-zinc-800 dark:text-lime dark:ring-zinc-700">
            {file ? <FileSpreadsheet className="size-7" aria-hidden /> : <Upload className="size-7" aria-hidden />}
          </span>
          {file ? (
            <>
              <span dir="ltr" className="mt-4 max-w-full truncate text-base font-semibold">
                {file.name}
              </span>
              <span className="mt-0.5 text-sm text-zinc-600 dark:text-zinc-400">{formatSize(file.size, locale)}</span>
              <span className="mt-2 text-sm font-semibold text-brand underline-offset-2 hover:underline dark:text-lime">
                {p.dropzone.replace}
              </span>
            </>
          ) : (
            <>
              <span className="mt-4 text-base font-semibold">{p.dropzone.title}</span>
              <span className="mt-0.5 text-sm text-zinc-600 dark:text-zinc-400">{p.dropzone.browse}</span>
              <span className="mt-3 text-xs text-zinc-500 dark:text-zinc-400">
                {fmt(p.dropzone.hint, { size: formatSize(maxBytes, locale) })}
              </span>
            </>
          )}
        </label>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <button type="submit" disabled={pending || !file} className={ctaClass}>
            {pending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Upload className="size-4" aria-hidden />}
            {pending ? p.importing : p.submit}
          </button>
          <a href={templateHref} download className={secondaryClass}>
            <FileDown className="size-4" aria-hidden />
            {p.downloadTemplate}
          </a>
        </div>
      </form>

      {state.imported !== undefined && (
        <div className="mt-5 rounded-2xl bg-mint p-4 ring-1 ring-brand/20 dark:bg-lime/10 dark:ring-lime/25">
          <Notice tone="success" title={p.successTitle} className="bg-transparent p-0 ring-0 dark:bg-transparent">
            {rich(count(locale, state.imported, p.imported), {
              link: (
                <Link href="/dashboard/listings" className="font-semibold underline">
                  {p.yourListings}
                </Link>
              ),
            })}
          </Notice>
          <Link href="/dashboard/listings" className={`${ctaClass} mt-4`}>
            {p.goToListings}
            <ArrowUpRight className="size-4 rtl:-scale-x-100" aria-hidden />
          </Link>
        </div>
      )}
      {state.error && (
        <Notice tone="danger" className="mt-5">
          {translateMessage(t, state.error)}
        </Notice>
      )}
      {state.rowErrors && (
        <div className="mt-4 overflow-hidden rounded-2xl ring-1 ring-red-200 dark:ring-red-900">
          <p className="bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-900 dark:bg-red-950/60 dark:text-red-100">
            {p.errorsTitle}
          </p>
          <table className="w-full text-start text-sm">
            <thead className="bg-canvas text-xs text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400">
              <tr>
                <th scope="col" className="w-20 px-4 py-2 text-start font-medium">
                  {p.row}
                </th>
                <th scope="col" className="px-4 py-2 text-start font-medium">
                  {p.problem}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 bg-card dark:divide-zinc-800">
              {state.rowErrors.map(({ row, message }) => (
                <tr key={row}>
                  <td className="px-4 py-2.5 align-top">
                    <span className="inline-block min-w-8 rounded-md bg-red-50 px-1.5 py-0.5 text-center font-mono text-xs font-semibold text-red-700 tabular-nums dark:bg-red-950 dark:text-red-300">
                      {row}
                    </span>
                  </td>
                  <td className="px-4 py-2.5">{translateMessage(t, message)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
