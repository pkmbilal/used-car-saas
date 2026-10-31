// Industrial equipment rentals: types and brands. Stored values stay English;
// the Arabic names are for display only. EQUIPMENT_TYPES must match the check
// constraint in supabase/migrations/*_equipment_rentals.sql. Safe to import
// from client components.
import type { Locale } from "@/lib/i18n";

export const EQUIPMENT_TYPES = [
  "excavator",
  "backhoe_loader",
  "wheel_loader",
  "bulldozer",
  "skid_steer",
  "forklift",
  "mobile_crane",
  "boom_lift",
  "scissor_lift",
  "dump_truck",
  "roller",
  "generator",
  "compressor",
  "water_tanker",
  "other",
] as const;

export type EquipmentType = (typeof EQUIPMENT_TYPES)[number];

const EQUIPMENT_TYPE_NAMES: Record<EquipmentType, { en: string; ar: string }> = {
  excavator: { en: "Excavator", ar: "حفار" },
  backhoe_loader: { en: "Backhoe loader", ar: "باكهو" },
  wheel_loader: { en: "Wheel loader", ar: "شيول" },
  bulldozer: { en: "Bulldozer", ar: "بلدوزر" },
  skid_steer: { en: "Skid steer", ar: "بوبكات" },
  forklift: { en: "Forklift", ar: "رافعة شوكية" },
  mobile_crane: { en: "Mobile crane", ar: "كرين" },
  boom_lift: { en: "Boom lift", ar: "رافعة سلة" },
  scissor_lift: { en: "Scissor lift", ar: "رافعة مقصية" },
  dump_truck: { en: "Dump truck", ar: "قلاب" },
  roller: { en: "Roller", ar: "مدحلة" },
  generator: { en: "Generator", ar: "مولد كهرباء" },
  compressor: { en: "Air compressor", ar: "كمبروسر هواء" },
  water_tanker: { en: "Water tanker", ar: "وايت ماء" },
  other: { en: "Other equipment", ar: "معدات أخرى" },
};

export const EQUIPMENT_BRANDS = [
  "Caterpillar",
  "Komatsu",
  "JCB",
  "Volvo",
  "Hitachi",
  "Doosan",
  "Hyundai",
  "Liebherr",
  "SANY",
  "XCMG",
  "Toyota",
  "Manitou",
  "Genie",
  "JLG",
  "Other",
] as const;

export type EquipmentBrand = (typeof EQUIPMENT_BRANDS)[number];

const AR_EQUIPMENT_BRANDS: Record<EquipmentBrand, string> = {
  Caterpillar: "كاتربيلر",
  Komatsu: "كوماتسو",
  JCB: "جي سي بي",
  Volvo: "فولفو",
  Hitachi: "هيتاشي",
  Doosan: "دوسان",
  Hyundai: "هيونداي",
  Liebherr: "ليبهير",
  SANY: "ساني",
  XCMG: "إكس سي إم جي",
  Toyota: "تويوتا",
  Manitou: "مانيتو",
  Genie: "جيني",
  JLG: "جيه إل جي",
  Other: "أخرى",
};

export function isEquipmentType(value: unknown): value is EquipmentType {
  return typeof value === "string" && (EQUIPMENT_TYPES as readonly string[]).includes(value);
}

export function isEquipmentBrand(value: unknown): value is EquipmentBrand {
  return typeof value === "string" && (EQUIPMENT_BRANDS as readonly string[]).includes(value);
}

export function equipmentTypeName(locale: Locale, type: string): string {
  return isEquipmentType(type) ? EQUIPMENT_TYPE_NAMES[type][locale] : type;
}

export function equipmentBrandName(locale: Locale, brand: string): string {
  return locale === "ar" && isEquipmentBrand(brand) ? AR_EQUIPMENT_BRANDS[brand] : brand;
}

// Arabic type/brand names -> stored English, for rewriting keyword searches.
export const EQUIPMENT_AR_TO_EN: [string, string][] = [
  ...EQUIPMENT_TYPES.map((type): [string, string] => [
    EQUIPMENT_TYPE_NAMES[type].ar,
    type.replace(/_/g, " "),
  ]),
  ...Object.entries(AR_EQUIPMENT_BRANDS).map(([en, ar]): [string, string] => [ar, en]),
].filter(([ar]) => ar !== "أخرى" && ar !== "معدات أخرى");
