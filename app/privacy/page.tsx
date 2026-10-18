import type { Metadata } from "next";
import { LEGAL_CONTACT_EMAIL, LegalPage } from "@/components/legal-page";

export const metadata: Metadata = {
  title: "Privacy Policy | DriveLoop",
  description: "How DriveLoop collects, uses and protects your personal data.",
};

// TODO(legal): draft written to the Saudi PDPL's main requirements. Have it
// reviewed by a lawyer before launch.
export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy" updated="18 October 2026">
      <p>
        DriveLoop (&quot;we&quot;) runs a marketplace for used cars in the Kingdom of Saudi Arabia. This policy
        explains what personal data we collect, why, and the rights you have under the Personal Data Protection Law
        (PDPL).
      </p>

      <h2>Data we collect</h2>
      <ul>
        <li>Account details: email address, password (stored hashed), name, phone number and city.</li>
        <li>Seller and dealer details: business name, showroom address, logo, and dealer application documents.</li>
        <li>Identity verification: copies of the ID documents you upload to get a verified badge.</li>
        <li>Listings: vehicle details, photos and prices you publish.</li>
        <li>Plan payments: amount, method and reference for plans you buy.</li>
        <li>Usage: listing views and contact taps, saved searches and favorites.</li>
      </ul>

      <h2>How we use it</h2>
      <ul>
        <li>To run your account and show your listings to buyers.</li>
        <li>To let buyers contact sellers by phone or WhatsApp. Your phone number is shown on your active listings.</li>
        <li>To verify sellers and dealers and keep the marketplace free of fraud and spam.</li>
        <li>To manage plans, listing limits and featured placements.</li>
        <li>To send account emails such as sign-up codes and password resets.</li>
      </ul>

      <h2>Identity documents</h2>
      <p>
        ID documents are stored in private storage that is not publicly accessible. Only DriveLoop administrators can
        view them, and only to review your verification request. You give explicit consent when you upload them.
      </p>

      <h2>Who we share data with</h2>
      <p>
        We do not sell your data. We use service providers to host the site and store data and images (Vercel,
        Supabase and Cloudflare). Some of them may process data outside the Kingdom under the safeguards the PDPL
        requires. We disclose data to authorities when the law requires it.
      </p>

      <h2>How long we keep it</h2>
      <p>
        We keep your data while your account is open, and after that only as long as we need it for legal, accounting
        or fraud-prevention purposes.
      </p>

      <h2>Your rights</h2>
      <p>
        You can ask to access, correct or delete your personal data, or withdraw consent, by emailing{" "}
        <a href={`mailto:${LEGAL_CONTACT_EMAIL}`} className="font-medium underline">
          {LEGAL_CONTACT_EMAIL}
        </a>
        . You can also complain to the Saudi Data &amp; AI Authority (SDAIA).
      </p>

      <h2>Changes</h2>
      <p>We will post any changes to this policy on this page and update the date above.</p>
    </LegalPage>
  );
}
