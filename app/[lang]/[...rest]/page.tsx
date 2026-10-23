import { notFound } from "next/navigation";

// Unmatched URLs render this locale's not-found page inside the site chrome.
export default function CatchAll() {
  notFound();
}
