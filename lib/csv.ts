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
