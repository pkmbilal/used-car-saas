// Client-safe checks shared by the sign-in, sign-up and reset forms.
export const MIN_PASSWORD_LENGTH = 8;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizeEmail(value: FormDataEntryValue | null): string {
  return String(value ?? "").trim().toLowerCase();
}

export function isValidEmail(email: string): boolean {
  return EMAIL_RE.test(email);
}

export function isValidPassword(password: string): boolean {
  return password.length >= MIN_PASSWORD_LENGTH;
}

// Returns the 6-digit code with spaces stripped, or null if malformed.
export function parseCode(value: FormDataEntryValue | null): string | null {
  const code = String(value ?? "").replace(/\s/g, "");
  return /^\d{6}$/.test(code) ? code : null;
}
