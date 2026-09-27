const sarFormatter = new Intl.NumberFormat("ar-SA", {
  style: "currency",
  currency: "SAR",
});

export function formatSAR(amount: number): string {
  return sarFormatter.format(amount);
}

const numberFormatter = new Intl.NumberFormat("en-US");

export function formatKm(km: number): string {
  return `${numberFormatter.format(km)} km`;
}

const monthYearFormatter = new Intl.DateTimeFormat("en-GB", {
  month: "long",
  year: "numeric",
});

export function formatMonthYear(date: string): string {
  return monthYearFormatter.format(new Date(date));
}
