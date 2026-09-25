export const CITIES = [
  "Riyadh",
  "Jeddah",
  "Mecca",
  "Medina",
  "Dammam",
  "Khobar",
  "Dhahran",
  "Taif",
  "Tabuk",
  "Buraidah",
  "Abha",
  "Khamis Mushait",
  "Hail",
  "Jazan",
  "Najran",
  "Al Ahsa",
  "Jubail",
  "Yanbu",
] as const;

export type City = (typeof CITIES)[number];

export function isCity(value: unknown): value is City {
  return typeof value === "string" && (CITIES as readonly string[]).includes(value);
}
