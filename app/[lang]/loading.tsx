import { BrandLoader } from "@/components/brand-loader";
import { getDictionary } from "@/lib/i18n-server";

export default async function Loading() {
  const { t } = await getDictionary();
  return <BrandLoader label={t.common.loading} tagline={t.common.tagline} />;
}
