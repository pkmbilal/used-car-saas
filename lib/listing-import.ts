import "server-only";
import { parseCsv } from "@/lib/csv";
import { CONDITIONS, FUEL_TYPES } from "@/lib/listing-options";
import {
  LISTING_BOUNDS,
  maxListingYear,
  parseListingFields,
  type ListingInput,
} from "@/lib/listings";

// Dealer bulk upload: every row must be valid or nothing is imported, so a
// dealer never has to work out which rows already went in.

export const IMPORT_COLUMNS = [
  "make",
  "model",
  "year",
  "mileage",
  "price",
  "condition",
  "city",
  "fuel_type",
] as const satisfies readonly (keyof ListingInput)[];

export const MAX_IMPORT_ROWS = 200;
// Stays under the default 1MB Server Action body limit.
export const MAX_IMPORT_BYTES = 500 * 1024;

// `row` is the spreadsheet row number: the header is row 1.
export type ImportRowError = { row: number; message: string };

export type ParsedImport =
  | { rows: ListingInput[] }
  | { error: string }
  | { rowErrors: ImportRowError[] };

function rowErrorMessage(field: keyof ListingInput, value: string): string {
  const { minYear, maxModelLength, maxMileage, maxPrice } = LISTING_BOUNDS;
  const expected: Record<keyof ListingInput, string> = {
    make: "one of the supported makes",
    model: `up to ${maxModelLength} characters`,
    year: `a year from ${minYear} to ${maxListingYear()}`,
    mileage: `whole km, up to ${maxMileage.toLocaleString("en")}`,
    price: `whole SAR above 0, up to ${maxPrice.toLocaleString("en")}`,
    condition: CONDITIONS.join(", "),
    city: "one of the supported cities",
    fuel_type: FUEL_TYPES.join(", "),
  };

  const trimmed = value.trim();
  if (!trimmed) return `${field} is empty. Expected ${expected[field]}.`;
  const shown = trimmed.length > 40 ? `${trimmed.slice(0, 40)}…` : trimmed;
  return `${field} "${shown}" isn't valid. Expected ${expected[field]}.`;
}

export function parseListingCsv(text: string): ParsedImport {
  const [header, ...body] = parseCsv(text);
  if (!header) return { error: "The file is empty." };

  const columns = header.map((name) => name.trim().toLowerCase());
  const missing = IMPORT_COLUMNS.filter((column) => !columns.includes(column));
  if (missing.length) {
    return { error: `The header row is missing: ${missing.join(", ")}.` };
  }

  const records = body
    .map((cells, index) => ({ cells, row: index + 2 }))
    .filter(({ cells }) => cells.some((cell) => cell.trim() !== ""));
  if (records.length === 0) return { error: "The file has no listings below the header row." };
  if (records.length > MAX_IMPORT_ROWS) {
    return {
      error: `The file has ${records.length} listings. Import at most ${MAX_IMPORT_ROWS} at a time.`,
    };
  }

  const rows: ListingInput[] = [];
  const rowErrors: ImportRowError[] = [];
  for (const { cells, row } of records) {
    const get = (field: keyof ListingInput) => cells[columns.indexOf(field)] ?? "";
    const parsed = parseListingFields(get);
    if ("error" in parsed) {
      rowErrors.push({ row, message: rowErrorMessage(parsed.field, get(parsed.field)) });
    } else {
      rows.push(parsed.data);
    }
  }

  return rowErrors.length ? { rowErrors } : { rows };
}
