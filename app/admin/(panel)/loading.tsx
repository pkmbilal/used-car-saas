import { BrandLoader } from "@/components/brand-loader";

// Without this, navigating between admin pages blocks with no loader.
export default function Loading() {
  return <BrandLoader />;
}
