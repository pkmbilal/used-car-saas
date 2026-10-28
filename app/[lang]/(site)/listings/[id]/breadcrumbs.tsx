import { Fragment } from "react";
import { ChevronRight } from "lucide-react";
import Link from "@/components/locale-link";

export type Crumb = { name: string; href: string };

// Listings › Make › Model trail in the hero.
export function Breadcrumbs({ crumbs, label }: { crumbs: Crumb[]; label: string }) {
  return (
    <nav aria-label={label}>
      <ol className="flex flex-wrap items-center gap-1.5 text-xs text-white/70">
        {crumbs.map((crumb, i) => (
          <Fragment key={crumb.href}>
            {i > 0 && (
              <li aria-hidden className="flex">
                <ChevronRight className="size-3 rtl:rotate-180" />
              </li>
            )}
            <li>
              <Link href={crumb.href} className="hover:text-lime">
                {crumb.name}
              </Link>
            </li>
          </Fragment>
        ))}
      </ol>
    </nav>
  );
}
