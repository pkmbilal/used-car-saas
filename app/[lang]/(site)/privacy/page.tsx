import type { Metadata } from "next";
import { LEGAL_CONTACT_EMAIL, LegalPage } from "@/components/legal-page";
import { COMPANY_NAME } from "@/lib/contact";
import { getDictionary } from "@/lib/i18n-server";
import { pageMetadata } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const { locale } = await getDictionary();
  return pageMetadata({
    ...(locale === "ar"
      ? {
          title: "سياسة الخصوصية | كارسوق",
          description: "كيف تجمع كارسوق بياناتك الشخصية وتستخدمها وتحميها.",
        }
      : {
          title: "Privacy Policy | KarSouq",
          description: "How KarSouq collects, uses and protects your personal data.",
        }),
    path: "/privacy",
  });
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
    <LegalPage
      doc="privacy"
      title="Privacy Policy"
      updated="14 November 2026"
      intro={
        <>
          <p>
            KarSouq is a marketplace for used cars in the Kingdom of Saudi Arabia, operated by {COMPANY_NAME}{" "}
            (&quot;we&quot;), the controller of your personal data. This policy explains what personal data we collect,
            why, and the rights you have under the Personal Data Protection Law (PDPL).
          </p>
        </>
      }
      sections={[
        {
          title: <>Data we collect</>,
          body: (
            <>
              <ul>
                <li>Account details: email address, password (stored hashed), name, phone number and city.</li>
                <li>
                  Seller and dealer details: business name, showroom address, logo, and your Commercial Registration,
                  VAT and Muroor numbers and certificates.
                </li>
                <li>Identity verification: copies of the ID documents you upload to get a verified badge.</li>
                <li>Listings: vehicle and equipment details, photos, prices and rental terms you publish.</li>
                <li>Offers and rental requests: amounts, dates, notes, and when and how you reply to them.</li>
                <li>Payments: amount, method and reference for services you pay for.</li>
                <li>
                  Usage: listing views and contact taps, saved searches and favorites, and a one-way hash of your IP
                  address when you reveal a seller&apos;s phone number (to stop abuse).
                </li>
                <li>
                  Analytics: anonymous page-view statistics from Vercel Web Analytics, which does not use cookies.
                </li>
              </ul>
            </>
          ),
        },
        {
          title: <>How we use it</>,
          body: (
            <>
              <ul>
                <li>To run your account and show your listings to buyers.</li>
                <li>
                  To let buyers contact sellers by phone or WhatsApp. A seller&apos;s phone number is shown to visitors
                  who tap to reveal it on an active listing.
                </li>
                <li>
                  To pass on offers and rental requests. When an owner accepts a rental request, the owner&apos;s and
                  renter&apos;s WhatsApp numbers are shared with each other.
                </li>
                <li>
                  To show how quickly sellers reply to offers and rental requests, as a public &quot;Responds
                  quickly&quot; badge.
                </li>
                <li>To verify sellers and dealers and keep the marketplace free of fraud and spam.</li>
                <li>To manage plans, listing limits and featured placements.</li>
                <li>To send account emails such as sign-up codes and password resets.</li>
                <li>To understand how the site is used and improve it.</li>
              </ul>
            </>
          ),
        },
        {
          title: <>Identity and business documents</>,
          body: (
            <>
              <p>
                ID documents and dealer documents (Commercial Registration, VAT and Muroor certificates) are stored in
                private storage that is not publicly accessible. Only KarSouq administrators can view them, and only to
                review your verification or dealer request. You give explicit consent when you upload ID documents.
              </p>
            </>
          ),
        },
        {
          title: <>Cookies and app storage</>,
          body: (
            <>
              <p>
                We use only the cookies needed to keep you signed in and remember your language. If you install KarSouq
                as an app, your device stores some pages so the app can open offline. We do not use advertising cookies.
              </p>
            </>
          ),
        },
        {
          title: <>Who we share data with</>,
          body: (
            <>
              <p>
                We do not sell your data. We use service providers to host the site and store data and images (Vercel,
                Supabase and Cloudflare). Some of them may process data outside the Kingdom under the safeguards the
                PDPL requires. We disclose data to authorities when the law requires it.
              </p>
            </>
          ),
        },
        {
          title: <>How long we keep it</>,
          body: (
            <>
              <p>
                We keep your data while your account is open, and after that only as long as we need it for legal,
                accounting or fraud-prevention purposes.
              </p>
            </>
          ),
        },
        {
          title: <>Your rights</>,
          body: (
            <>
              <p>
                You can ask to access, correct or delete your personal data, or withdraw consent, by emailing {email}.
                You can also complain to the Saudi Data &amp; AI Authority (SDAIA).
              </p>
            </>
          ),
        },
        {
          title: <>Changes</>,
          body: (
            <>
              <p>We will post any changes to this policy on this page and update the date above.</p>
            </>
          ),
        },
      ]}
    />
  );
}

function PrivacyAr() {
  return (
    <LegalPage
      doc="privacy"
      title="سياسة الخصوصية"
      updated="14 نوفمبر 2026"
      intro={
        <>
          <p>
            كارسوق سوق للسيارات المستعملة في المملكة العربية السعودية، تديره {COMPANY_NAME} (&quot;نحن&quot;) بصفتها
            الجهة المتحكمة في بياناتك الشخصية. توضح هذه السياسة البيانات الشخصية التي نجمعها وسبب جمعها والحقوق التي
            يمنحك إياها نظام حماية البيانات الشخصية.
          </p>
        </>
      }
      sections={[
        {
          title: <>البيانات التي نجمعها</>,
          body: (
            <>
              <ul>
                <li>بيانات الحساب: البريد الإلكتروني وكلمة المرور (محفوظة بشكل مشفّر) والاسم ورقم الجوال والمدينة.</li>
                <li>
                  بيانات البائعين والمعارض: اسم النشاط التجاري وعنوان المعرض والشعار، وأرقام وشهادات السجل التجاري
                  وضريبة القيمة المضافة والمرور.
                </li>
                <li>توثيق الهوية: نسخ مستندات الهوية التي ترفعها للحصول على شارة التوثيق.</li>
                <li>الإعلانات: بيانات السيارات والمعدات وصورها وأسعارها وشروط تأجيرها التي تنشرها.</li>
                <li>عروض الأسعار وطلبات الاستئجار: المبالغ والتواريخ والملاحظات، ووقت ردك عليها وطريقته.</li>
                <li>المدفوعات: المبلغ وطريقة الدفع ومرجعه للخدمات التي تدفع مقابلها.</li>
                <li>
                  الاستخدام: مشاهدات الإعلانات ونقرات التواصل وعمليات البحث المحفوظة والمفضلة، وبصمة مشفّرة باتجاه واحد
                  لعنوان IP الخاص بك عند إظهار رقم بائع (لمنع إساءة الاستخدام).
                </li>
                <li>
                  الإحصاءات: إحصاءات مجهولة الهوية لزيارات الصفحات من Vercel Web Analytics، ولا تستخدم ملفات تعريف
                  الارتباط.
                </li>
              </ul>
            </>
          ),
        },
        {
          title: <>كيف نستخدمها</>,
          body: (
            <>
              <ul>
                <li>لإدارة حسابك وعرض إعلاناتك للمشترين.</li>
                <li>
                  لتمكين المشترين من التواصل مع البائعين عبر الهاتف أو واتساب. يظهر رقم جوال البائع للزائر الذي يضغط
                  لإظهاره في إعلان منشور.
                </li>
                <li>
                  لإيصال عروض الأسعار وطلبات الاستئجار. وعند قبول المالك طلب استئجار يُشارك رقم واتساب كلٍّ من المالك
                  والمستأجر مع الآخر.
                </li>
                <li>
                  لعرض سرعة رد البائعين على عروض الأسعار وطلبات الاستئجار، من خلال شارة &quot;يرد بسرعة&quot; العامة.
                </li>
                <li>للتحقق من البائعين والمعارض وحماية السوق من الاحتيال والإعلانات المزعجة.</li>
                <li>لإدارة الباقات وحدود الإعلانات والإعلانات المميزة.</li>
                <li>لإرسال رسائل الحساب مثل رموز التسجيل وإعادة تعيين كلمة المرور.</li>
                <li>لفهم طريقة استخدام الموقع وتحسينه.</li>
              </ul>
            </>
          ),
        },
        {
          title: <>مستندات الهوية والنشاط التجاري</>,
          body: (
            <>
              <p>
                تُحفظ مستندات الهوية ومستندات المعارض (السجل التجاري وشهادتا ضريبة القيمة المضافة والمرور) في مساحة تخزين
                خاصة غير متاحة للعموم. لا يطّلع عليها إلا مسؤولو كارسوق، ولغرض مراجعة طلب التوثيق أو طلب حساب المعرض فقط.
                وتمنح موافقتك الصريحة عند رفع مستندات الهوية.
              </p>
            </>
          ),
        },
        {
          title: <>ملفات تعريف الارتباط وتخزين التطبيق</>,
          body: (
            <>
              <p>
                نستخدم فقط ملفات تعريف الارتباط اللازمة لإبقائك مسجّلًا للدخول وتذكّر لغتك. وإذا ثبّتّ كارسوق كتطبيق، يحفظ
                جهازك بعض الصفحات ليعمل التطبيق دون اتصال. ولا نستخدم ملفات تعريف الارتباط الإعلانية.
              </p>
            </>
          ),
        },
        {
          title: <>مع من نشارك البيانات</>,
          body: (
            <>
              <p>
                لا نبيع بياناتك. نستعين بمزودي خدمات لاستضافة الموقع وتخزين البيانات والصور (Vercel وSupabase
                وCloudflare). قد يعالج بعضهم البيانات خارج المملكة وفق الضمانات التي يشترطها النظام. ونفصح عن البيانات
                للجهات المختصة عندما يقتضي النظام ذلك.
              </p>
            </>
          ),
        },
        {
          title: <>مدة الاحتفاظ بالبيانات</>,
          body: (
            <>
              <p>
                نحتفظ ببياناتك ما دام حسابك قائمًا، وبعد ذلك للمدة اللازمة فقط للأغراض النظامية أو المحاسبية أو لمكافحة
                الاحتيال.
              </p>
            </>
          ),
        },
        {
          title: <>حقوقك</>,
          body: (
            <>
              <p>
                يمكنك طلب الاطلاع على بياناتك الشخصية أو تصحيحها أو حذفها، أو سحب موافقتك، بمراسلتنا على {email}. ويمكنك
                أيضًا تقديم شكوى إلى الهيئة السعودية للبيانات والذكاء الاصطناعي (سدايا).
              </p>
            </>
          ),
        },
        {
          title: <>التغييرات</>,
          body: (
            <>
              <p>سننشر أي تغييرات على هذه السياسة في هذه الصفحة ونحدّث التاريخ أعلاه.</p>
            </>
          ),
        },
      ]}
    />
  );
}
