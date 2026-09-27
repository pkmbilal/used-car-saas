// Common makes in the Saudi market. Model is free text.
export const MAKES = [
  "Audi",
  "BMW",
  "Changan",
  "Chevrolet",
  "Chrysler",
  "Dodge",
  "Ford",
  "Geely",
  "GMC",
  "Honda",
  "Hyundai",
  "Infiniti",
  "Isuzu",
  "Jeep",
  "Kia",
  "Land Rover",
  "Lexus",
  "Mazda",
  "Mercedes-Benz",
  "MG",
  "Mitsubishi",
  "Nissan",
  "Porsche",
  "Suzuki",
  "Tesla",
  "Toyota",
  "Volkswagen",
  "Other",
] as const;

export type Make = (typeof MAKES)[number];

export function isMake(value: unknown): value is Make {
  return typeof value === "string" && (MAKES as readonly string[]).includes(value);
}
