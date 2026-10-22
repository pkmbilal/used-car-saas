import { BrandLoader } from "@/components/brand-loader";

// Inside the admin shell, so the sidebar stays put while a page loads.
export default function Loading() {
  return <BrandLoader />;
}
