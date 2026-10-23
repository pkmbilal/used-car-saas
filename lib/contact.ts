import { whatsappUrl } from "@/lib/format";

// KarSouq is a product of CodeSudio; support goes to the parent company's inbox.
export const COMPANY_NAME = "CodeSudio";
export const SUPPORT_EMAIL = "hello@codesudio.com";

// Sales WhatsApp number in +9665XXXXXXXX format. Sales links are hidden until
// it's set.
export const SALES_WHATSAPP: string | null = null;

export function salesWhatsappUrl(text: string): string | null {
  return SALES_WHATSAPP ? whatsappUrl(SALES_WHATSAPP, text) : null;
}
