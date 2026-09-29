"use client";

import Link from "next/link";
import { useActionState } from "react";
import { importListings, type ImportFormState } from "./actions";

export function ImportForm() {
  const [state, formAction, pending] = useActionState<ImportFormState, FormData>(
    importListings,
    {},
  );

  return (
    <div>
      <form action={formAction} className="flex flex-wrap items-center gap-4">
        <input
          type="file"
          name="file"
          accept=".csv,text/csv"
          required
          className="text-sm file:mr-3 file:rounded-md file:border-0 file:bg-zinc-100 file:px-3 file:py-2 dark:file:bg-zinc-800 dark:file:text-zinc-100"
        />
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
        >
          {pending ? "Importing…" : "Import listings"}
        </button>
      </form>

      {state.imported !== undefined && (
        <p className="mt-4 rounded-md bg-green-50 px-4 py-3 text-sm text-green-900 dark:bg-green-950 dark:text-green-200">
          Imported {state.imported} draft {state.imported === 1 ? "listing" : "listings"}. Add
          photos and publish each one from{" "}
          <Link href="/dashboard" className="font-medium underline">
            your listings
          </Link>
          .
        </p>
      )}
      {state.error && <p className="mt-4 text-sm text-red-600">{state.error}</p>}
      {state.rowErrors && (
        <table className="mt-4 w-full text-left text-sm">
          <thead className="text-zinc-600 dark:text-zinc-400">
            <tr>
              <th className="py-2 pr-4 font-medium">Row</th>
              <th className="py-2 font-medium">Problem</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {state.rowErrors.map(({ row, message }) => (
              <tr key={row}>
                <td className="py-2 pr-4 align-top tabular-nums">{row}</td>
                <td className="py-2">{message}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
