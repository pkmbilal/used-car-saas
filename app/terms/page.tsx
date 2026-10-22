import type { Metadata } from "next";
import { LEGAL_CONTACT_EMAIL, LegalPage } from "@/components/legal-page";

export const metadata: Metadata = {
  title: "Terms of Use | KarSouq",
  description: "The rules for buying and selling cars on KarSouq.",
};

// TODO(legal): draft only. Have it reviewed by a lawyer before launch.
export default function TermsPage() {
  return (
    <LegalPage title="Terms of Use" updated="18 October 2026">
      <p>
        By creating an account or using KarSouq you agree to these terms. They are governed by the laws of the
        Kingdom of Saudi Arabia.
      </p>

      <h2>What KarSouq is</h2>
      <p>
        KarSouq is a listings platform. Buyers and sellers deal with each other directly. We are not a party to any
        sale, we do not inspect vehicles, and we do not guarantee any listing&apos;s accuracy. Inspect the car and its
        documents before you pay.
      </p>

      <h2>Your account</h2>
      <ul>
        <li>Give accurate information and keep your password safe.</li>
        <li>You are responsible for everything done through your account.</li>
      </ul>

      <h2>Listings</h2>
      <ul>
        <li>Only list vehicles you own or are authorised to sell.</li>
        <li>Descriptions, prices and photos must be accurate and must not mislead buyers.</li>
        <li>No stolen vehicles, prohibited items, spam, duplicate listings or offensive content.</li>
        <li>You keep ownership of your photos and grant KarSouq a licence to display them on the platform.</li>
      </ul>

      <h2>Plans and payments</h2>
      <p>
        Paid plans and featured placements are billed in Saudi riyals. A plan runs for the period shown when you buy
        it and moves back to the free plan when it ends. Fees are non-refundable once a plan is active, except where
        the law requires otherwise.
      </p>

      <h2>Moderation</h2>
      <p>
        We may remove listings or suspend accounts that break these terms or that we reasonably believe are fraudulent.
      </p>

      <h2>Liability</h2>
      <p>
        To the extent the law allows, KarSouq is not liable for losses arising from transactions between users or
        from the content of listings.
      </p>

      <h2>Contact</h2>
      <p>
        Questions about these terms:{" "}
        <a href={`mailto:${LEGAL_CONTACT_EMAIL}`} className="font-medium underline">
          {LEGAL_CONTACT_EMAIL}
        </a>
        .
      </p>
    </LegalPage>
  );
}
