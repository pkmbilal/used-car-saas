import { jsonLdScript } from "@/lib/seo";

// schema.org structured data for search engines.
export function JsonLd({ data }: { data: object }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(data) }} />;
}
