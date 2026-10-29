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

// Every city in the given order; count ties keep the CITIES order. Name sorts
// use the displayed (possibly translated) names.
export function sortCities(
  counts: Map<string, number>,
  sort: CitySort,
  name: (city: City) => string = (city) => city,
  locale = "en",
): City[] {
  const count = (city: City) => counts.get(city) ?? 0;
  switch (sort) {
    case "most":
      return citiesByCount(counts);
    case "fewest":
      return [...CITIES].sort((a, b) => count(a) - count(b));
    case "name_asc":
      return [...CITIES].sort((a, b) => name(a).localeCompare(name(b), locale));
    case "name_desc":
      return [...CITIES].sort((a, b) => name(b).localeCompare(name(a), locale));
  }
}

// ---------------------------------------------------------------------------
// "Near me". Listings only store a city, so distances are between city centres.
// ---------------------------------------------------------------------------

export type GeoPoint = { lat: number; lng: number };

// Approximate city centres, [lat, lng]. Every city needs one (typecheck fails otherwise).
export const CITY_COORDS: Record<City, readonly [number, number]> = {
  Riyadh: [24.71, 46.68],
  Jeddah: [21.49, 39.19],
  Mecca: [21.42, 39.83],
  Medina: [24.47, 39.61],
  Dammam: [26.43, 50.1],
  Khobar: [26.28, 50.21],
  Dhahran: [26.29, 50.11],
  Taif: [21.27, 40.42],
  Tabuk: [28.38, 36.57],
  Buraidah: [26.33, 43.97],
  Abha: [18.22, 42.51],
  "Khamis Mushait": [18.31, 42.73],
  Hail: [27.52, 41.69],
  Jazan: [16.89, 42.57],
  Najran: [17.49, 44.13],
  "Al Ahsa": [25.4, 49.59],
  Jubail: [27.01, 49.66],
  Yanbu: [24.09, 38.06],
  Abqaiq: [25.94, 49.67],
  "Abu Arish": [16.97, 42.83],
  Afif: [23.91, 42.92],
  "Al Bahah": [20.01, 41.47],
  "Al-Aqiq": [20.27, 41.65],
  "Al-Bukayriyah": [26.14, 43.66],
  "Al-Ghazalah": [26.78, 41.31],
  "Al-Hofuf": [25.38, 49.59],
  "Al-Jumum": [21.62, 39.7],
  "Al-Kharj": [24.16, 47.31],
  "Al-Lith": [20.15, 40.27],
  "Al-Majma'ah": [25.9, 45.35],
  "Al-Mikhwah": [19.78, 41.44],
  "Al-Mithnab": [25.86, 44.22],
  "Al-Mubarraz": [25.43, 49.58],
  "Al-Namas": [19.12, 42.13],
  "Al-Qunfudhah": [19.13, 41.08],
  "Al-Sulayyil": [20.46, 45.58],
  "Al-Ula": [26.62, 37.92],
  "Al-Wajh": [26.23, 36.47],
  "Al-Zulfi": [26.3, 44.8],
  Arar: [30.98, 41.04],
  "Ar-Rass": [25.87, 43.5],
  "As-Sulaymi": [26.27, 41.35],
  Badr: [23.78, 38.79],
  Baish: [17.37, 42.55],
  Baljurashi: [19.86, 41.56],
  "Baqa'a": [27.89, 42.4],
  Bisha: [20.0, 42.6],
  Dawadmi: [24.51, 44.39],
  "Dhahran Al-Janub": [17.67, 43.51],
  Diriyah: [24.74, 46.57],
  Duba: [27.35, 35.69],
  "Dumat Al-Jandal": [29.81, 39.87],
  Farasan: [16.7, 42.12],
  "Hafr Al-Batin": [28.43, 45.96],
  Haql: [29.29, 34.94],
  "Hotat Bani Tamim": [23.49, 46.84],
  Hubuna: [17.87, 44.27],
  Khafji: [28.44, 48.49],
  Khaybar: [25.7, 39.29],
  Khulais: [22.15, 39.32],
  "Mahd ad-Dhahab": [23.5, 40.86],
  "Muhayil Asir": [18.55, 42.05],
  Qatif: [26.56, 50.01],
  Qurayyat: [31.33, 37.34],
  Rabigh: [22.8, 39.03],
  Rafha: [29.63, 43.49],
  Ranyah: [21.26, 42.85],
  "Ras Tanura": [26.64, 50.16],
  Sabya: [17.15, 42.63],
  Sakaka: [29.97, 40.21],
  Samtah: [16.6, 42.94],
  "Sarat Abidah": [18.17, 43.1],
  Shaqra: [25.25, 45.25],
  Sharurah: [17.47, 47.11],
  Taima: [27.63, 38.55],
  Tanomah: [18.93, 42.17],
  Turaif: [31.67, 38.65],
  Turubah: [21.21, 41.63],
  Umluj: [25.02, 37.27],
  Unaizah: [26.08, 43.99],
  "Uyun Al-Jawa": [26.5, 43.67],
  "Wadi ad-Dawasir": [20.46, 44.8],
};

// Distances are between city centres, so 10 km in practice means "my city only".
export const NEAR_RADII = [10, 25, 50, 100, 200] as const;
export const DEFAULT_NEAR_RADIUS = 50;
// Under this, a car counts as "in your area" rather than showing a distance.
export const NEARBY_KM = 15;

// Great-circle distance in km (haversine).
export function distanceKm(a: GeoPoint, b: GeoPoint): number {
  const rad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(h));
}

export function cityDistanceKm(point: GeoPoint, city: string): number | undefined {
  if (!isCity(city)) return undefined;
  const [lat, lng] = CITY_COORDS[city];
  return distanceKm(point, { lat, lng });
}

// Cities whose centre is within the radius, nearest first.
export function citiesWithin(point: GeoPoint, radiusKm: number): { city: City; km: number }[] {
  return CITIES.map((city) => ({ city, km: cityDistanceKm(point, city) ?? Infinity }))
    .filter(({ km }) => km <= radiusKm)
    .sort((a, b) => a.km - b.km);
}

export function nearestCity(point: GeoPoint): City {
  return citiesWithin(point, Infinity)[0].city;
}

// Rounded to 2 decimals (about 1 km) so URLs never carry an exact position.
export function roundPoint(lat: number, lng: number): GeoPoint {
  return { lat: Math.round(lat * 100) / 100, lng: Math.round(lng * 100) / 100 };
}

// Roughly Saudi Arabia; anything outside can't be near a listing anyway.
export function isInSaudi(lat: number, lng: number): boolean {
  return lat >= 16 && lat <= 33 && lng >= 34 && lng <= 56;
}

// "24.71,46.68" from the URL; anything else is dropped.
export function parseNear(value: string | undefined): GeoPoint | undefined {
  const match = value?.match(/^(-?\d{1,3}(?:\.\d+)?),(-?\d{1,3}(?:\.\d+)?)$/);
  if (!match) return undefined;
  const lat = Number(match[1]);
  const lng = Number(match[2]);
  return isInSaudi(lat, lng) ? roundPoint(lat, lng) : undefined;
}

export function formatNear(point: GeoPoint): string {
  return `${point.lat},${point.lng}`;
}
