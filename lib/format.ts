const amountFormatter = new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 });

// "165,000". On the page, prices render through <RiyalPrice>, which adds the
// riyal symbol.
export function formatAmount(amount: number): string {
  return amountFormatter.format(amount);
}

// Plain-text prices (page titles, WhatsApp messages, select labels) where the
// riyal symbol image can't go.
export function formatSAR(amount: number): string {
  return `SAR ${formatAmount(amount)}`;
}

const numberFormatter = new Intl.NumberFormat("en-US");

export function formatKm(km: number): string {
  return `${numberFormatter.format(km)} km`;
}

// Phones are stored as +9665XXXXXXXX; wa.me wants digits only.
export function whatsappUrl(phone: string, text: string): string {
  return `https://wa.me/${phone.replace(/\D/g, "")}?text=${encodeURIComponent(text)}`;
}

const monthYearFormatter = new Intl.DateTimeFormat("en-GB", {
  month: "long",
  year: "numeric",
});

export function formatMonthYear(date: string): string {
  return monthYearFormatter.format(new Date(date));
}

const dayFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "Asia/Riyadh",
});

export function formatDay(date: string): string {
  return dayFormatter.format(new Date(date));
}

export function formatViews(views: number): string {
  return `${numberFormatter.format(views)} ${views === 1 ? "view" : "views"}`;
}
