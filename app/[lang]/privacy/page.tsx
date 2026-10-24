import type { Metadata } from "next";
import { LEGAL_CONTACT_EMAIL, LegalPage } from "@/components/legal-page";
import { COMPANY_NAME } from "@/lib/contact";
import { getDictionary, localeAlternates } from "@/lib/i18n-server";

export async function generateMetadata(): Promise<Metadata> {
  const { locale } = await getDictionary();
  return {
    ...(locale === "ar"
      ? { title: "سياسة الخصوصية | كارسوق", description: "كيف تجمع كارسوق بياناتك الشخصية وتستخدمها وتحميها." }
      : { title: "Privacy Policy | KarSouq", description: "How KarSouq collects, uses and protects your personal data." }),
    alternates: await localeAlternates("/privacy"),
  };
}

const email = (
  <a href={`mailto:${LEGAL_CONTACT_EMAIL}`} className="font-medium underline">
    {LEGAL_CONTACT_EMAIL}
  </a>
);

// TODO(legal): draft written to the Saudi PDPL's main requirements. Have both
// languages reviewed by a lawyer before launch; keep them saying the same thing.
export default async function PrivacyPage() {
  const { locale } = await getDictionary();
  return locale === "ar" ? <PrivacyAr /> : <PrivacyEn />;
}

function PrivacyEn() {
  return (
    <LegalPage title="Privacy Policy" updated="23 October 2026">
      <p>
        KarSouq is a marketplace for used cars in the Kingdom of Saudi Arabia, operated by {COMPANY_NAME}{" "}
        (&quot;we&quot;), the controller of your personal data. This policy
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
        ID documents are stored in private storage that is not publicly accessible. Only KarSouq administrators can
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
        You can ask to access, correct or delete your personal data, or withdraw consent, by emailing {email}. You can
        also complain to the Saudi Data &amp; AI Authority (SDAIA).
      </p>

      <h2>Changes</h2>
      <p>We will post any changes to this policy on this page and update the date above.</p>
    </LegalPage>
  );
}

function PrivacyAr() {
  return (
    <LegalPage title="سياسة الخصوصية" updated="23 أكتوبر 2026">
      <p>
        كارسوق سوق للسيارات المستعملة في المملكة العربية السعودية، تديره {COMPANY_NAME} (&quot;نحن&quot;) بصفتها
        الجهة المتحكمة في بياناتك الشخصية. توضح هذه السياسة البيانات الشخصية التي نجمعها وسبب جمعها والحقوق التي
        يمنحك إياها نظام حماية البيانات الشخصية.
      </p>

      <h2>البيانات التي نجمعها</h2>
      <ul>
        <li>بيانات الحساب: البريد الإلكتروني وكلمة المرور (محفوظة بشكل مشفّر) والاسم ورقم الجوال والمدينة.</li>
        <li>بيانات البائعين والمعارض: اسم النشاط التجاري وعنوان المعرض والشعار ومستندات طلب حساب المعرض.</li>
        <li>توثيق الهوية: نسخ مستندات الهوية التي ترفعها للحصول على شارة التوثيق.</li>
        <li>الإعلانات: بيانات السيارات وصورها وأسعارها التي تنشرها.</li>
        <li>مدفوعات الباقات: المبلغ وطريقة الدفع ومرجعه للباقات التي تشتريها.</li>
        <li>الاستخدام: مشاهدات الإعلانات ونقرات التواصل وعمليات البحث المحفوظة والمفضلة.</li>
      </ul>

      <h2>كيف نستخدمها</h2>
      <ul>
        <li>لإدارة حسابك وعرض إعلاناتك للمشترين.</li>
        <li>لتمكين المشترين من التواصل مع البائعين عبر الهاتف أو واتساب. يظهر رقم جوالك في إعلاناتك المنشورة.</li>
        <li>للتحقق من البائعين والمعارض وحماية السوق من الاحتيال والإعلانات المزعجة.</li>
        <li>لإدارة الباقات وحدود الإعلانات والإعلانات المميزة.</li>
        <li>لإرسال رسائل الحساب مثل رموز التسجيل وإعادة تعيين كلمة المرور.</li>
      </ul>

      <h2>مستندات الهوية</h2>
      <p>
        تُحفظ مستندات الهوية في مساحة تخزين خاصة غير متاحة للعموم. لا يطّلع عليها إلا مسؤولو كارسوق، ولغرض مراجعة
        طلب التوثيق فقط. وتمنح موافقتك الصريحة عند رفعها.
      </p>

      <h2>مع من نشارك البيانات</h2>
      <p>
        لا نبيع بياناتك. نستعين بمزودي خدمات لاستضافة الموقع وتخزين البيانات والصور (Vercel وSupabase وCloudflare).
        قد يعالج بعضهم البيانات خارج المملكة وفق الضمانات التي يشترطها النظام. ونفصح عن البيانات للجهات المختصة
        عندما يقتضي النظام ذلك.
      </p>

      <h2>مدة الاحتفاظ بالبيانات</h2>
      <p>
        نحتفظ ببياناتك ما دام حسابك قائمًا، وبعد ذلك للمدة اللازمة فقط للأغراض النظامية أو المحاسبية أو لمكافحة
        الاحتيال.
      </p>

      <h2>حقوقك</h2>
      <p>
        يمكنك طلب الاطلاع على بياناتك الشخصية أو تصحيحها أو حذفها، أو سحب موافقتك، بمراسلتنا على {email}. ويمكنك
        أيضًا تقديم شكوى إلى الهيئة السعودية للبيانات والذكاء الاصطناعي (سدايا).
      </p>

      <h2>التغييرات</h2>
      <p>سننشر أي تغييرات على هذه السياسة في هذه الصفحة ونحدّث التاريخ أعلاه.</p>
    </LegalPage>
  );
}
