// ID verification upload limits, shared by the upload form and server actions.

export const MAX_ID_DOCS = 2; // front and back
export const MAX_ID_DOC_BYTES = 10 * 1024 * 1024;
export const ID_DOC_TYPES = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "application/pdf": "pdf",
} as const;

export const MAX_REJECT_REASON = 300;

export function isIdDocType(value: string): value is keyof typeof ID_DOC_TYPES {
  return Object.hasOwn(ID_DOC_TYPES, value);
}
