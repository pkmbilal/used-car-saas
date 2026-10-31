// Arabic display names for makes and models. Stored values stay English
// (lib/makes.ts); these are only for showing them on Arabic pages. Models that
// are codes (X5, CS35, RS7, F-150) have no entry and show as stored, as on
// Saudi car sites; so do models sellers typed themselves. Safe to import from
// client components.
import type { Locale } from "@/lib/i18n";
import { EQUIPMENT_AR_TO_EN, equipmentBrandName, equipmentTypeName } from "@/lib/equipment";
import { isMake, type Make } from "@/lib/makes";

const AR_MAKES: Record<Make, string> = {
  Audi: "أودي",
  BMW: "بي إم دبليو",
  Changan: "شانجان",
  Chevrolet: "شيفروليه",
  Chrysler: "كرايسلر",
  Dodge: "دودج",
  Ford: "فورد",
  Geely: "جيلي",
  GMC: "جي إم سي",
  Honda: "هوندا",
  Hyundai: "هيونداي",
  Infiniti: "إنفينيتي",
  Isuzu: "إيسوزو",
  Jeep: "جيب",
  Kia: "كيا",
  "Land Rover": "لاند روفر",
  Lexus: "لكزس",
  Mazda: "مازدا",
  "Mercedes-Benz": "مرسيدس-بنز",
  MG: "إم جي",
  Mitsubishi: "ميتسوبيشي",
  Nissan: "نيسان",
  Porsche: "بورشه",
  Suzuki: "سوزوكي",
  Tesla: "تسلا",
  Toyota: "تويوتا",
  Volkswagen: "فولكس فاجن",
  Other: "أخرى",
};

const AR_MODELS: Partial<Record<Make, Record<string, string>>> = {
  Changan: { Alsvin: "السفن", Eado: "إيدو", Hunter: "هنتر", Raeton: "رايتون" },
  Chevrolet: {
    Aveo: "أفيو",
    Blazer: "بليزر",
    Camaro: "كامارو",
    Captiva: "كابتيفا",
    Caprice: "كابرس",
    Colorado: "كولورادو",
    Corvette: "كورفيت",
    Cruze: "كروز",
    Equinox: "إكوينوكس",
    Groove: "جروف",
    Impala: "إمبالا",
    Lumina: "لومينا",
    Malibu: "ماليبو",
    Menlo: "منلو",
    Silverado: "سلفرادو",
    Sonic: "سونيك",
    Spark: "سبارك",
    Suburban: "سوبربان",
    Tahoe: "تاهو",
    Trailblazer: "تريل بليزر",
    Traverse: "ترافرس",
    Trax: "تراكس",
  },
  Chrysler: { Pacifica: "باسيفيكا", "Town & Country": "تاون آند كنتري", Voyager: "فوياجر" },
  Dodge: {
    Avenger: "أفنجر",
    Challenger: "تشالنجر",
    Charger: "تشارجر",
    Dart: "دارت",
    Durango: "دورانجو",
    "Grand Caravan": "جراند كارافان",
    Journey: "جيرني",
    Nitro: "نيترو",
    Ram: "رام",
  },
  Ford: {
    Bronco: "برونكو",
    "Bronco Sport": "برونكو سبورت",
    EcoSport: "إيكوسبورت",
    Edge: "إيدج",
    Escape: "إسكيب",
    Expedition: "إكسبديشن",
    Explorer: "إكسبلورر",
    Figo: "فيجو",
    Fiesta: "فييستا",
    Flex: "فلكس",
    Focus: "فوكس",
    Fusion: "فيوجن",
    Mustang: "موستنج",
    Ranger: "رينجر",
    Taurus: "توروس",
    Territory: "تيريتوري",
    Transit: "ترانزيت",
  },
  Geely: {
    Azkarra: "أزكارا",
    Coolray: "كولراي",
    Emgrand: "إمجراند",
    Monjaro: "مونجارو",
    Okavango: "أوكافانجو",
    Preface: "بريفيس",
    Starray: "ستاراي",
    Tugella: "توجيلا",
  },
  GMC: {
    Acadia: "أكاديا",
    Canyon: "كانيون",
    Savana: "سافانا",
    Sierra: "سييرا",
    Terrain: "تيرين",
    Yukon: "يوكن",
    "Yukon XL": "يوكن XL",
  },
  Honda: {
    Accord: "أكورد",
    City: "سيتي",
    Civic: "سيفيك",
    Odyssey: "أوديسي",
    Passport: "باسبورت",
    Pilot: "بايلوت",
  },
  Hyundai: {
    Accent: "أكسنت",
    Azera: "أزيرا",
    Centennial: "سنتينيال",
    Creta: "كريتا",
    Elantra: "إلنترا",
    Genesis: "جينيسيس",
    "Grand Santa Fe": "جراند سنتافي",
    Ioniq: "أيونيك",
    "Ioniq 5": "أيونيك 5",
    "Ioniq 6": "أيونيك 6",
    Kona: "كونا",
    Palisade: "باليسيد",
    "Santa Cruz": "سانتا كروز",
    "Santa Fe": "سنتافي",
    Sonata: "سوناتا",
    Staria: "ستاريا",
    Tucson: "توسان",
    Veloster: "فيلوستر",
    Venue: "فينيو",
  },
  Jeep: {
    Cherokee: "شيروكي",
    Commander: "كوماندر",
    Compass: "كومباس",
    Gladiator: "جلادياتور",
    "Grand Cherokee": "جراند شيروكي",
    "Grand Cherokee L": "جراند شيروكي L",
    "Grand Wagoneer": "جراند واجونير",
    Renegade: "رينيجيد",
    Wagoneer: "واجونير",
    Wrangler: "رانجلر",
  },
  Kia: {
    Cadenza: "كادينزا",
    Carens: "كارينز",
    Carnival: "كرنفال",
    Cerato: "سيراتو",
    Mohave: "موهافي",
    Niro: "نيرو",
    Optima: "أوبتيما",
    Pegas: "بيجاس",
    Picanto: "بيكانتو",
    Quoris: "كوريس",
    Rio: "ريو",
    Seltos: "سيلتوس",
    Sonet: "سونيت",
    Sorento: "سورينتو",
    Soul: "سول",
    Sportage: "سبورتاج",
    Stinger: "ستينجر",
    Telluride: "تيلورايد",
  },
  "Land Rover": {
    Defender: "ديفندر",
    Discovery: "ديسكفري",
    "Discovery Sport": "ديسكفري سبورت",
    Freelander: "فريلاندر",
    "Range Rover": "رنج روفر",
    "Range Rover Evoque": "رنج روفر إيفوك",
    "Range Rover Sport": "رنج روفر سبورت",
    "Range Rover Velar": "رنج روفر فيلار",
  },
  Mitsubishi: {
    Attrage: "أتراج",
    "Eclipse Cross": "إكليبس كروس",
    Lancer: "لانسر",
    Mirage: "ميراج",
    Montero: "مونتيرو",
    Outlander: "أوتلاندر",
    Pajero: "باجيرو",
    "Pajero Sport": "باجيرو سبورت",
    Xpander: "إكسباندر",
  },
  Nissan: {
    Altima: "ألتيما",
    Armada: "أرمادا",
    Juke: "جوك",
    Kicks: "كيكس",
    Leaf: "ليف",
    Magnite: "ماجنايت",
    Maxima: "ماكسيما",
    Micra: "ميكرا",
    Murano: "مورانو",
    Navara: "نافارا",
    Pathfinder: "باثفايندر",
    Patrol: "باترول",
    "Patrol Pickup": "باترول بيك أب",
    "Patrol Safari": "باترول سفاري",
    Qashqai: "قشقاي",
    Sentra: "سنترا",
    Sunny: "صني",
    Tiida: "تيدا",
    Urvan: "أورفان",
    "X-Terra": "إكستيرا",
    "X-Trail": "إكس تريل",
  },
  Porsche: {
    "718 Boxster": "718 بوكستر",
    "718 Cayman": "718 كايمان",
    Cayenne: "كايين",
    "Cayenne Coupe": "كايين كوبيه",
    Macan: "ماكان",
    Panamera: "باناميرا",
    Taycan: "تايكان",
  },
  Suzuki: {
    Alto: "ألتو",
    Baleno: "بالينو",
    Celerio: "سيليريو",
    Ciaz: "سياز",
    Dzire: "ديزاير",
    Ertiga: "إرتيجا",
    Fronx: "فرونكس",
    "Grand Vitara": "جراند فيتارا",
    Jimny: "جيمني",
    Swift: "سويفت",
    Vitara: "فيتارا",
  },
  Tesla: { Cybertruck: "سايبرتراك" },
  Toyota: {
    Avalon: "أفالون",
    Camry: "كامري",
    Coaster: "كوستر",
    Corolla: "كورولا",
    "Corolla Cross": "كورولا كروس",
    Crown: "كراون",
    "FJ Cruiser": "إف جي كروزر",
    Fortuner: "فورتشنر",
    Granvia: "جرانفيا",
    Hiace: "هايس",
    Highlander: "هايلاندر",
    Hilux: "هايلكس",
    Innova: "إنوفا",
    "Land Cruiser": "لاندكروزر",
    "Land Cruiser 70": "لاندكروزر 70",
    "Land Cruiser Pickup": "لاندكروزر بيك أب",
    Prado: "برادو",
    Previa: "بريفيا",
    Raize: "رايز",
    Rush: "راش",
    Sequoia: "سيكويا",
    Sienna: "سيينا",
    Supra: "سوبرا",
    Tundra: "تندرا",
    "Urban Cruiser": "أوربان كروزر",
    Veloz: "فيلوز",
    Yaris: "يارس",
    "Yaris Cross": "يارس كروس",
  },
  Volkswagen: {
    Arteon: "أرتيون",
    Atlas: "أطلس",
    Golf: "جولف",
    "Golf GTI": "جولف GTI",
    "Golf R": "جولف R",
    Jetta: "جيتا",
    Passat: "باسات",
    Polo: "بولو",
    Teramont: "تيرامونت",
    Tiguan: "تيجوان",
    Touareg: "طوارق",
  },
};

// Also covers equipment brands (stored in the same `make` column).
export function makeName(locale: Locale, make: string): string {
  if (locale !== "ar") return make;
  return isMake(make) ? AR_MAKES[make] : equipmentBrandName(locale, make);
}

export function modelName(locale: Locale, make: string, model: string): string {
  if (locale !== "ar" || !isMake(make)) return model;
  return AR_MODELS[make]?.[model] ?? model;
}

// "2021 Toyota Camry" / "تويوتا كامري 2021": each language's usual order.
export function carName(locale: Locale, make: string, model: string, year?: number): string {
  const name = `${makeName(locale, make)} ${modelName(locale, make, model)}`;
  if (year === undefined) return name;
  return locale === "ar" ? `${name} ${year}` : `${year} ${name}`;
}

// A listing's display name: carName() for cars; for equipment the type comes
// first ("Excavator Caterpillar 320D" / "حفار كاتربيلر 320D").
export function listingName(
  locale: Locale,
  listing: { category: string; make: string; model: string; equipment_type: string | null },
  year?: number,
): string {
  if (listing.category !== "equipment" || !listing.equipment_type) {
    return carName(locale, listing.make, listing.model, year);
  }
  const name = `${equipmentTypeName(locale, listing.equipment_type)} ${makeName(locale, listing.make)} ${listing.model}`;
  if (year === undefined) return name;
  return locale === "ar" ? `${name} ${year}` : `${year} ${name}`;
}

// Arabic make/model names, longest first, for rewriting a keyword search.
const AR_TO_EN: [string, string][] = [
  ...EQUIPMENT_AR_TO_EN,
  ...Object.entries(AR_MAKES).map(([en, ar]): [string, string] => [ar, en]),
  ...Object.values(AR_MODELS).flatMap((models) =>
    Object.entries(models ?? {}).map(([en, ar]): [string, string] => [ar, en]),
  ),
]
  .filter(([ar]) => ar !== "أخرى")
  .sort((a, b) => b[0].length - a[0].length);

// "تويوتا كامري" -> "Toyota Camry", so Arabic keywords match the stored
// English names. Other text is left as typed.
export function arabicToStoredNames(query: string): string {
  if (!/[؀-ۿ]/.test(query)) return query;
  let result = query;
  for (const [ar, en] of AR_TO_EN) {
    if (result.includes(ar)) result = result.split(ar).join(en);
  }
  return result;
}
