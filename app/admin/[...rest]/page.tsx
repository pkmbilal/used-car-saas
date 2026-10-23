import { notFound } from "next/navigation";

// Unmatched admin URLs render app/admin/not-found.tsx.
export default function CatchAll() {
  notFound();
}
