import { BrandLoader } from "@/components/brand-loader";
import { getDictionary } from "@/lib/i18n-server";

export default async function Loading() {
  const { t } = await getDictionary();
  return <BrandLoader className="light" label={t.loading.cars} tagline={t.common.tagline} />;
}
