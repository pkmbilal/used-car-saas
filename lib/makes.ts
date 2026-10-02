// Common makes in the Saudi market, with known models per make. Model stays
// free text: sellers can type one that isn't listed.
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

// Current and recent-past models sold in KSA/GCC, alphabetical per make.
export const MODELS_BY_MAKE: Record<Make, readonly string[]> = {
  Audi: [
    "A3", "A4", "A5", "A6", "A7", "A8", "e-tron", "e-tron GT", "Q2", "Q3", "Q4 e-tron", "Q5",
    "Q7", "Q8", "Q8 e-tron", "R8", "RS3", "RS4", "RS5", "RS6", "RS7", "RS Q8", "S3", "S4", "S5",
    "S6", "S7", "S8", "SQ5", "SQ7", "SQ8", "TT",
  ],
  BMW: [
    "1 Series", "2 Series", "3 Series", "4 Series", "5 Series", "6 Series", "7 Series",
    "8 Series", "i3", "i4", "i5", "i7", "i8", "iX", "iX1", "iX3", "M2", "M3", "M4", "M5", "M8",
    "X1", "X2", "X3", "X3 M", "X4", "X4 M", "X5", "X5 M", "X6", "X6 M", "X7", "XM", "Z4",
  ],
  Changan: [
    "Alsvin", "CS15", "CS35", "CS35 Plus", "CS55", "CS75", "CS75 Plus", "CS85", "CS95", "Eado",
    "Hunter", "Raeton", "UNI-K", "UNI-T", "UNI-V",
  ],
  Chevrolet: [
    "Aveo", "Blazer", "Camaro", "Captiva", "Caprice", "Colorado", "Corvette", "Cruze",
    "Equinox", "Groove", "Impala", "Lumina", "Malibu", "Menlo", "Silverado", "Sonic", "Spark",
    "Suburban", "Tahoe", "Trailblazer", "Traverse", "Trax",
  ],
  Chrysler: ["200", "300", "300C", "Pacifica", "Town & Country", "Voyager"],
  Dodge: [
    "Avenger", "Challenger", "Charger", "Dart", "Durango", "Grand Caravan", "Journey", "Nitro",
    "Ram",
  ],
  Ford: [
    "Bronco", "Bronco Sport", "EcoSport", "Edge", "Escape", "Expedition", "Explorer", "F-150",
    "F-250", "Figo", "Fiesta", "Flex", "Focus", "Fusion", "Mustang", "Mustang Mach-E",
    "Ranger", "Taurus", "Territory", "Transit",
  ],
  Geely: [
    "Azkarra", "Coolray", "Emgrand", "Geometry C", "Monjaro", "Okavango", "Preface", "Starray",
    "Tugella",
  ],
  GMC: [
    "Acadia", "Canyon", "Hummer EV", "Savana", "Sierra", "Terrain", "Yukon", "Yukon XL",
  ],
  Honda: [
    "Accord", "City", "Civic", "CR-V", "HR-V", "Odyssey", "Passport", "Pilot", "ZR-V",
  ],
  Hyundai: [
    "Accent", "Azera", "Centennial", "Creta", "Elantra", "Genesis", "Grand i10", "Grand Santa Fe",
    "H-1", "i10", "i20", "i30", "Ioniq", "Ioniq 5", "Ioniq 6", "Kona", "Palisade", "Santa Cruz",
    "Santa Fe", "Sonata", "Staria", "Tucson", "Veloster", "Venue",
  ],
  Infiniti: [
    "FX35", "FX50", "G25", "G37", "JX35", "M37", "Q30", "Q50", "Q60", "Q70", "QX30", "QX50",
    "QX55", "QX56", "QX60", "QX70", "QX80",
  ],
  Isuzu: ["D-Max", "MU-X", "NPR", "NQR"],
  Jeep: [
    "Cherokee", "Commander", "Compass", "Gladiator", "Grand Cherokee", "Grand Cherokee L",
    "Grand Wagoneer", "Renegade", "Wagoneer", "Wrangler",
  ],
  Kia: [
    "Cadenza", "Carens", "Carnival", "Cerato", "EV5", "EV6", "EV9", "K3", "K5", "K8", "K900",
    "Mohave", "Niro", "Optima", "Pegas", "Picanto", "Quoris", "Rio", "Seltos", "Sonet",
    "Sorento", "Soul", "Sportage", "Stinger", "Telluride",
  ],
  "Land Rover": [
    "Defender", "Discovery", "Discovery Sport", "Freelander", "LR2", "LR4", "Range Rover",
    "Range Rover Evoque", "Range Rover Sport", "Range Rover Velar",
  ],
  Lexus: [
    "CT", "ES", "GS", "GX", "IS", "LC", "LM", "LS", "LX", "NX", "RC", "RX", "RZ", "TX", "UX",
  ],
  Mazda: [
    "BT-50", "CX-3", "CX-30", "CX-5", "CX-60", "CX-9", "CX-90", "Mazda2", "Mazda3", "Mazda6",
    "MX-5",
  ],
  "Mercedes-Benz": [
    "A-Class", "AMG GT", "B-Class", "C-Class", "CLA", "CLS", "E-Class", "EQA", "EQB", "EQC",
    "EQE", "EQS", "G-Class", "GLA", "GLB", "GLC", "GLE", "GLS", "Maybach S-Class", "S-Class",
    "SL", "SLK", "Sprinter", "V-Class",
  ],
  MG: [
    "3", "5", "6", "7", "GT", "HS", "MG4", "One", "RX5", "RX8", "Whale", "ZS", "ZS EV",
  ],
  Mitsubishi: [
    "ASX", "Attrage", "Eclipse Cross", "L200", "Lancer", "Mirage", "Montero", "Outlander",
    "Pajero", "Pajero Sport", "Xpander",
  ],
  Nissan: [
    "370Z", "Altima", "Armada", "GT-R", "Juke", "Kicks", "Leaf", "Magnite", "Maxima", "Micra",
    "Murano", "Navara", "Pathfinder", "Patrol", "Patrol Pickup", "Patrol Safari", "Qashqai",
    "Sentra", "Sunny", "Tiida", "Urvan", "X-Terra", "X-Trail", "Z",
  ],
  Porsche: [
    "718 Boxster", "718 Cayman", "911", "Cayenne", "Cayenne Coupe", "Macan", "Panamera",
    "Taycan",
  ],
  Suzuki: [
    "Alto", "APV", "Baleno", "Celerio", "Ciaz", "Dzire", "Ertiga", "Fronx", "Grand Vitara",
    "Jimny", "S-Presso", "Swift", "Vitara",
  ],
  Tesla: ["Cybertruck", "Model 3", "Model S", "Model X", "Model Y"],
  Toyota: [
    "86", "Avalon", "bZ4X", "C-HR", "Camry", "Coaster", "Corolla", "Corolla Cross", "Crown",
    "FJ Cruiser", "Fortuner", "Granvia", "Hiace", "Highlander", "Hilux", "Innova",
    "Land Cruiser", "Land Cruiser 70", "Land Cruiser Pickup", "Prado", "Previa", "Raize",
    "RAV4", "Rush", "Sequoia", "Sienna", "Supra", "Tundra", "Urban Cruiser", "Veloz", "Yaris",
    "Yaris Cross",
  ],
  Volkswagen: [
    "Arteon", "Atlas", "Golf", "Golf GTI", "Golf R", "ID.4", "Jetta", "Passat", "Polo",
    "T-Cross", "T-Roc", "Teramont", "Tiguan", "Touareg",
  ],
  Other: [],
};

export function modelsFor(make: string): readonly string[] {
  return isMake(make) ? MODELS_BY_MAKE[make] : [];
}
