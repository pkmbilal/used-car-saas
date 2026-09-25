const sarFormatter = new Intl.NumberFormat("ar-SA", {
  style: "currency",
  currency: "SAR",
});

export function formatSAR(amount: number): string {
  return sarFormatter.format(amount);
}
