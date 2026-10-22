import { BrandLoader } from "@/components/brand-loader";

export default function Loading() {
  return (
    <main className="light flex flex-1 flex-col bg-canvas text-ink" aria-busy="true">
      <BrandLoader label="Loading car" />
    </main>
  );
}
