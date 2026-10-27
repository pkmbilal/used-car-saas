import type { Metadata } from "next";
import { LEGAL_CONTACT_EMAIL, LegalPage } from "@/components/legal-page";
import { COMPANY_NAME } from "@/lib/contact";
import { getDictionary } from "@/lib/i18n-server";
import { pageMetadata } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const { locale } = await getDictionary();
  return pageMetadata({
    ...(locale === "ar"
      ? { title: "شروط الاستخدام | كارسوق", description: "قواعد بيع السيارات وشرائها على كارسوق." }
      : { title: "Terms of Use | KarSouq", description: "The rules for buying and selling cars on KarSouq." }),
    path: "/terms",
  });
}

const email = (
  <a href={`mailto:${LEGAL_CONTACT_EMAIL}`} className="font-medium underline">
    {LEGAL_CONTACT_EMAIL}
  </a>
);

// TODO(legal): draft only. Have both languages reviewed by a lawyer before
// launch, keep them saying the same thing, and add CodeSudio's CR number and
// registered address.
export default async function TermsPage() {
  const { locale } = await getDictionary();
  return locale === "ar" ? <TermsAr /> : <TermsEn />;
}

function TermsEn() {
  return (
    <LegalPage title="Terms of Use" updated="23 October 2026">
      <p>
        KarSouq is operated by {COMPANY_NAME} (&quot;we&quot;). By creating an account or using KarSouq you agree to
        these terms. They are governed by the laws of the
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
      <p>Questions about these terms: {email}.</p>
    </LegalPage>
  );
}

function TermsAr() {
  return (
    <LegalPage title="شروط الاستخدام" updated="23 أكتوبر 2026">
      <p>
        تدير كارسوق {COMPANY_NAME} (&quot;نحن&quot;). بإنشائك حسابًا أو استخدامك كارسوق فإنك توافق على هذه الشروط،
        وتخضع هذه الشروط لأنظمة المملكة العربية السعودية.
      </p>

      <h2>ما هي كارسوق</h2>
      <p>
        كارسوق منصة إعلانات. يتعامل المشترون والبائعون مع بعضهم مباشرة. لسنا طرفًا في أي عملية بيع، ولا نفحص
        السيارات، ولا نضمن دقة أي إعلان. افحص السيارة ومستنداتها قبل الدفع.
      </p>

      <h2>حسابك</h2>
      <ul>
        <li>قدّم معلومات صحيحة وحافظ على سرية كلمة المرور.</li>
        <li>أنت مسؤول عن كل ما يتم من خلال حسابك.</li>
      </ul>

      <h2>الإعلانات</h2>
      <ul>
        <li>اعرض فقط السيارات التي تملكها أو المفوّض ببيعها.</li>
        <li>يجب أن تكون الأوصاف والأسعار والصور دقيقة وألا تضلل المشترين.</li>
        <li>يُمنع عرض السيارات المسروقة أو المواد المحظورة أو الإعلانات المزعجة أو المكررة أو المحتوى المسيء.</li>
        <li>تحتفظ بملكية صورك وتمنح كارسوق ترخيصًا بعرضها على المنصة.</li>
      </ul>

      <h2>الباقات والمدفوعات</h2>
      <p>
        تُحتسب الباقات المدفوعة والإعلانات المميزة بالريال السعودي. تسري الباقة للمدة المحددة عند شرائها، ثم تعود
        إلى الباقة المجانية عند انتهائها. الرسوم غير قابلة للاسترداد بعد تفعيل الباقة، إلا فيما يقتضيه النظام.
      </p>

      <h2>الإشراف</h2>
      <p>يحق لنا إزالة الإعلانات أو إيقاف الحسابات التي تخالف هذه الشروط أو التي نعتقد بشكل معقول أنها احتيالية.</p>

      <h2>المسؤولية</h2>
      <p>في الحدود التي يسمح بها النظام، لا تتحمل كارسوق مسؤولية الخسائر الناتجة عن التعاملات بين المستخدمين أو عن محتوى الإعلانات.</p>

      <h2>التواصل</h2>
      <p>للاستفسار عن هذه الشروط: {email}.</p>
    </LegalPage>
  );
}
