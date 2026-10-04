import { whatsappUrl } from "@/lib/format";

// Sales WhatsApp number in +9665XXXXXXXX format. Sales links are hidden until
// it's set.
export const SALES_WHATSAPP: string | null = null;

export function salesWhatsappUrl(text: string): string | null {
  return SALES_WHATSAPP ? whatsappUrl(SALES_WHATSAPP, text) : null;
}
