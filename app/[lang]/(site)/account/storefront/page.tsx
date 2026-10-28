import { localeRedirect } from "@/lib/i18n-server";

// The storefront editor moved into the Seller Center.
export default async function StorefrontRedirect() {
  return localeRedirect("/dashboard/storefront");
}
