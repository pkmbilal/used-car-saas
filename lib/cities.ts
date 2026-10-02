// The major cities come first: they lead the dropdowns and fill the home page's
// "Cars Near You" picker when few cities have listings. Their spellings are
// stored on existing listings and profiles, so don't rename them.
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
  // Smaller cities and governorates, alphabetical.
  "Abqaiq",
  "Abu Arish",
  "Afif",
  "Al Bahah",
  "Al-Aqiq",
  "Al-Bukayriyah",
  "Al-Ghazalah",
  "Al-Hofuf",
  "Al-Jumum",
  "Al-Kharj",
  "Al-Lith",
  "Al-Majma'ah",
  "Al-Mikhwah",
  "Al-Mithnab",
  "Al-Mubarraz",
  "Al-Namas",
  "Al-Qunfudhah",
  "Al-Sulayyil",
  "Al-Ula",
  "Al-Wajh",
  "Al-Zulfi",
  "Arar",
  "Ar-Rass",
  "As-Sulaymi",
  "Badr",
  "Baish",
  "Baljurashi",
  "Baqa'a",
  "Bisha",
  "Dawadmi",
  "Dhahran Al-Janub",
  "Diriyah",
  "Duba",
  "Dumat Al-Jandal",
  "Farasan",
  "Hafr Al-Batin",
  "Haql",
  "Hotat Bani Tamim",
  "Hubuna",
  "Khafji",
  "Khaybar",
  "Khulais",
  "Mahd ad-Dhahab",
  "Muhayil Asir",
  "Qatif",
  "Qurayyat",
  "Rabigh",
  "Rafha",
  "Ranyah",
  "Ras Tanura",
  "Sabya",
  "Sakaka",
  "Samtah",
  "Sarat Abidah",
  "Shaqra",
  "Sharurah",
  "Taima",
  "Tanomah",
  "Turaif",
  "Turubah",
  "Umluj",
  "Unaizah",
  "Uyun Al-Jawa",
  "Wadi ad-Dawasir",
] as const;

export type City = (typeof CITIES)[number];

export function isCity(value: unknown): value is City {
  return typeof value === "string" && (CITIES as readonly string[]).includes(value);
}

// URL slug for a city's locations page, e.g. "Khamis Mushait" -> "khamis-mushait"
// and "Al-Majma'ah" -> "al-majmaah".
export function citySlug(city: City): string {
  return city
    .toLowerCase()
    .replaceAll("'", "")
    .replace(/[^a-z0-9]+/g, "-");
}

export function cityFromSlug(slug: string): City | undefined {
  return CITIES.find((city) => citySlug(city) === slug);
}

export function cityHref(city: City): string {
  return `/locations/${citySlug(city)}`;
}

// Every city, most active listings first; ties keep the CITIES order.
export function citiesByCount(counts: Map<string, number>): City[] {
  return [...CITIES].sort((a, b) => (counts.get(b) ?? 0) - (counts.get(a) ?? 0));
}

export const CITY_SORTS = {
  most: "Most Cars",
  fewest: "Fewest Cars",
  name_asc: "Name: A to Z",
  name_desc: "Name: Z to A",
} as const;

export type CitySort = keyof typeof CITY_SORTS;

export function isCitySort(value: unknown): value is CitySort {
  return typeof value === "string" && Object.hasOwn(CITY_SORTS, value);
}

// Every city in the given order; count ties keep the CITIES order.
export function sortCities(counts: Map<string, number>, sort: CitySort): City[] {
  const count = (city: City) => counts.get(city) ?? 0;
  switch (sort) {
    case "most":
      return citiesByCount(counts);
    case "fewest":
      return [...CITIES].sort((a, b) => count(a) - count(b));
    case "name_asc":
      return [...CITIES].sort((a, b) => a.localeCompare(b, "en"));
    case "name_desc":
      return [...CITIES].sort((a, b) => b.localeCompare(a, "en"));
  }
}
