// Minimal RFC 4180 parser: quoted fields, "" escapes, CRLF/LF line breaks and
// a leading UTF-8 BOM (Excel adds one). Returns the raw cell text per record.
export function parseCsv(text: string): string[][] {
  const records: string[][] = [];
  let record: string[] = [];
  let cell = "";
  let quoted = false;

  for (let i = text.charCodeAt(0) === 0xfeff ? 1 : 0; i < text.length; i++) {
    const char = text[i];
    if (quoted) {
      if (char !== '"') {
        cell += char;
      } else if (text[i + 1] === '"') {
        cell += '"';
        i++;
      } else {
        quoted = false;
      }
    } else if (char === '"') {
      quoted = true;
    } else if (char === ",") {
      record.push(cell);
      cell = "";
    } else if (char === "\n" || char === "\r") {
      if (char === "\r" && text[i + 1] === "\n") i++;
      record.push(cell);
      records.push(record);
      record = [];
      cell = "";
    } else {
      cell += char;
    }
  }

  if (cell !== "" || record.length > 0) {
    record.push(cell);
    records.push(record);
  }
  return records;
}

// The reverse: quotes cells that need it and starts with a BOM so Excel reads
// the file as UTF-8. Text starting with = + - @ gets a leading ' so Excel
// shows it rather than running it as a formula (user names end up here).
export function toCsv(records: (string | number)[][]): string {
  const escape = (cell: string | number) => {
    const text = typeof cell === "string" && /^[=+\-@\t\r]/.test(cell) ? `'${cell}` : String(cell);
    return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  };
  return "﻿" + records.map((record) => record.map(escape).join(",")).join("\r\n") + "\r\n";
}
