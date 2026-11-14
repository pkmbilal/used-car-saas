import type { Metadata } from "next";
import Link from "@/components/locale-link";
import { LEGAL_CONTACT_EMAIL, LegalPage } from "@/components/legal-page";
import { COMPANY_NAME } from "@/lib/contact";
import { getDictionary } from "@/lib/i18n-server";
import { launchFreeUntil } from "@/lib/launch";
import { pageMetadata } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const { locale } = await getDictionary();
  return pageMetadata({
    ...(locale === "ar"
      ? { title: "شروط الاستخدام | كارسوق", description: "قواعد بيع السيارات وشرائها وتأجيرها على كارسوق." }
      : { title: "Terms of Use | KarSouq", description: "The rules for buying, selling and renting vehicles on KarSouq." }),
    path: "/terms",
  });
}

const email = (
  <a href={`mailto:${LEGAL_CONTACT_EMAIL}`} className="font-medium underline">
    {LEGAL_CONTACT_EMAIL}
  </a>
);

const linkClass = "font-medium underline";

function freeUntil(locale: string): string {
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-SA-u-ca-gregory" : "en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Riyadh",
  }).format(new Date(launchFreeUntil()));
}

// TODO(legal): draft only. Have both languages reviewed by a lawyer before
// launch, keep them saying the same thing, and set COMPANY_CR_NUMBER and
// COMPANY_ADDRESS in lib/contact.ts.
export default async function TermsPage() {
  const { locale } = await getDictionary();
  const until = freeUntil(locale);
  return locale === "ar" ? <TermsAr until={until} /> : <TermsEn until={until} />;
}

function TermsEn({ until }: { until: string }) {
  return (
    <LegalPage title="Terms of Use" updated="14 November 2026">
      <p>
        KarSouq is operated by {COMPANY_NAME} (&quot;we&quot;). By creating an account or using KarSouq you agree to
        these terms and to our{" "}
        <Link href="/privacy" className={linkClass}>
          Privacy Policy
        </Link>
        . They are governed by the laws of the Kingdom of Saudi Arabia.
      </p>

      <h2>What KarSouq is</h2>
      <p>
        KarSouq is a listings platform for buying, selling and renting cars and equipment. Buyers, sellers, renters and
        owners deal with each other directly. We are not a party to any sale, offer or rental, we do not take payments
        for them, we do not inspect vehicles, and we do not guarantee any listing&apos;s accuracy. Inspect the vehicle
        and its documents before you pay.
      </p>

      <h2>Your account</h2>
      <ul>
        <li>Give accurate information and keep your password safe.</li>
        <li>You are responsible for everything done through your account.</li>
        <li>Some actions, such as making an offer or requesting a rental, need a phone number on your account.</li>
      </ul>

      <h2>Listings</h2>
      <ul>
        <li>Only list vehicles or equipment you own or are authorised to sell or rent out.</li>
        <li>Descriptions, prices and photos must be accurate and must not mislead.</li>
        <li>No stolen vehicles, prohibited items, spam, duplicate listings or offensive content.</li>
        <li>Mark a listing as sold, or remove it, once it is no longer available.</li>
        <li>You keep ownership of your photos and grant KarSouq a licence to display them on the platform.</li>
      </ul>

      <h2>Price offers</h2>
      <p>
        Buyers can send a seller a private price offer, and the seller can accept, decline or counter it. An accepted
        offer is an agreement to talk and inspect, not a binding sale: the deal is only made when buyer and seller
        complete it between themselves. Make offers you intend to honour.
      </p>

      <h2>Rentals</h2>
      <ul>
        <li>For rental listings the price shown is the daily rate. Owners can set their own rental terms, which renters see before asking for dates.</li>
        <li>A rental request asks the owner for specific dates. The owner can accept or decline it. When a request is accepted, the owner&apos;s and renter&apos;s WhatsApp numbers are shared with each other.</li>
        <li>The rental agreement, deposit, insurance, licence checks and payment are arranged between owner and renter, outside KarSouq.</li>
      </ul>

      <h2>Dealers and badges</h2>
      <ul>
        <li>
          A Verified Dealer account needs a valid Commercial Registration. Dealers may also add VAT and Muroor details.
          Documents you send must be genuine and current, and you must tell us if they lapse or change.
        </li>
        <li>
          Badges such as ID-verified, Verified Dealer and &quot;Responds quickly&quot; reflect checks or activity on
          KarSouq at the time. They are not a guarantee of a seller or a vehicle, and we may remove them.
        </li>
      </ul>

      <h2>Plans and payments</h2>
      <p>
        Posting listings, including on a Verified Dealer account, is free until {until}, within the monthly limits shown
        on the{" "}
        <Link href="/pricing" className={linkClass}>
          Pricing
        </Link>{" "}
        page. We will give at least 30 days&apos; notice before any paid plan starts. Paid extras, such as featured
        placement, are billed in Saudi riyals; refunds follow our{" "}
        <Link href="/refunds" className={linkClass}>
          Refund Policy
        </Link>
        .
      </p>

      <h2>Moderation</h2>
      <p>
        We may review, edit the category of, hide or remove listings, and suspend accounts, that break these terms or
        that we reasonably believe are fraudulent. You can report a listing you think breaks them.
      </p>

      <h2>Liability</h2>
      <p>
        To the extent the law allows, KarSouq is not liable for losses arising from sales, offers or rentals between
        users, or from the content of listings.
      </p>

      <h2>Changes</h2>
      <p>
        We may update these terms. We will post changes on this page and update the date above; continuing to use
        KarSouq after that means you accept them.
      </p>

      <h2>Contact</h2>
      <p>Questions about these terms: {email}.</p>
    </LegalPage>
  );
}

function TermsAr({ until }: { until: string }) {
  return (
    <LegalPage title="شروط الاستخدام" updated="14 نوفمبر 2026">
      <p>
        تدير كارسوق {COMPANY_NAME} (&quot;نحن&quot;). بإنشائك حسابًا أو استخدامك كارسوق فإنك توافق على هذه الشروط
        وعلى{" "}
        <Link href="/privacy" className={linkClass}>
          سياسة الخصوصية
        </Link>
        ، وتخضع هذه الشروط لأنظمة المملكة العربية السعودية.
      </p>

      <h2>ما هي كارسوق</h2>
      <p>
        كارسوق منصة إعلانات لبيع السيارات والمعدات وشرائها وتأجيرها. يتعامل المشترون والبائعون والمستأجرون والملاك مع
        بعضهم مباشرة. لسنا طرفًا في أي عملية بيع أو عرض سعر أو تأجير، ولا نستلم أي مبالغ عنها، ولا نفحص المركبات، ولا
        نضمن دقة أي إعلان. افحص المركبة ومستنداتها قبل الدفع.
      </p>

      <h2>حسابك</h2>
      <ul>
        <li>قدّم معلومات صحيحة وحافظ على سرية كلمة المرور.</li>
        <li>أنت مسؤول عن كل ما يتم من خلال حسابك.</li>
        <li>تتطلب بعض الإجراءات، مثل تقديم عرض سعر أو طلب استئجار، إضافة رقم جوال إلى حسابك.</li>
      </ul>

      <h2>الإعلانات</h2>
      <ul>
        <li>اعرض فقط المركبات أو المعدات التي تملكها أو المفوّض ببيعها أو تأجيرها.</li>
        <li>يجب أن تكون الأوصاف والأسعار والصور دقيقة وألا تكون مضللة.</li>
        <li>يُمنع عرض السيارات المسروقة أو المواد المحظورة أو الإعلانات المزعجة أو المكررة أو المحتوى المسيء.</li>
        <li>حدّد الإعلان كمباع أو احذفه عندما لا يعود متاحًا.</li>
        <li>تحتفظ بملكية صورك وتمنح كارسوق ترخيصًا بعرضها على المنصة.</li>
      </ul>

      <h2>عروض الأسعار</h2>
      <p>
        يمكن للمشتري إرسال عرض سعر خاص إلى البائع، ويمكن للبائع قبوله أو رفضه أو تقديم عرض مقابل. قبول العرض اتفاق على
        التواصل والمعاينة وليس بيعًا ملزمًا، ولا تتم الصفقة إلا عندما يُكملها المشتري والبائع فيما بينهما. قدّم العروض
        التي تنوي الالتزام بها.
      </p>

      <h2>التأجير</h2>
      <ul>
        <li>في إعلانات التأجير يكون السعر المعروض هو الأجرة اليومية. ويمكن للمالك وضع شروط التأجير الخاصة به، ويطّلع عليها المستأجر قبل طلب التواريخ.</li>
        <li>طلب الاستئجار يطلب من المالك تواريخ محددة، وللمالك قبوله أو رفضه. وعند قبول الطلب يُشارك رقم واتساب كلٍّ من المالك والمستأجر مع الآخر.</li>
        <li>يُتفق على عقد التأجير والعربون والتأمين والتحقق من الرخصة والدفع بين المالك والمستأجر خارج كارسوق.</li>
      </ul>

      <h2>المعارض والشارات</h2>
      <ul>
        <li>
          يتطلب حساب المعرض الموثّق سجلًا تجاريًا ساريًا، ويمكن للمعارض أيضًا إضافة بيانات ضريبة القيمة المضافة والمرور.
          يجب أن تكون المستندات التي ترسلها صحيحة وسارية، وعليك إبلاغنا إذا انتهت أو تغيّرت.
        </li>
        <li>
          الشارات مثل &quot;هوية موثقة&quot; و&quot;معرض موثّق&quot; و&quot;يرد بسرعة&quot; تعكس عمليات تحقق أو نشاطًا على
          كارسوق في حينه، وليست ضمانًا للبائع أو للمركبة، ويحق لنا إزالتها.
        </li>
      </ul>

      <h2>الباقات والمدفوعات</h2>
      <p>
        نشر الإعلانات مجاني حتى {until}، بما في ذلك حسابات المعارض الموثقة، وفي حدود الإعلانات الشهرية الموضحة في صفحة{" "}
        <Link href="/pricing" className={linkClass}>
          الباقات
        </Link>
        . وسنُعلن قبل 30 يومًا على الأقل من بدء أي باقة مدفوعة. تُحتسب الخدمات الإضافية المدفوعة، مثل تمييز الإعلان،
        بالريال السعودي، ويخضع استرداد رسومها لـ
        <Link href="/refunds" className={linkClass}>
          سياسة الاسترداد
        </Link>
        .
      </p>

      <h2>الإشراف</h2>
      <p>
        يحق لنا مراجعة الإعلانات أو تعديل تصنيفها أو إخفاؤها أو حذفها، وإيقاف الحسابات، إذا خالفت هذه الشروط أو اعتقدنا
        بشكل معقول أنها احتيالية. ويمكنك الإبلاغ عن أي إعلان تراه مخالفًا.
      </p>

      <h2>المسؤولية</h2>
      <p>
        في الحدود التي يسمح بها النظام، لا تتحمل كارسوق مسؤولية الخسائر الناتجة عن عمليات البيع أو عروض الأسعار أو
        التأجير بين المستخدمين، أو عن محتوى الإعلانات.
      </p>

      <h2>التغييرات</h2>
      <p>
        قد نحدّث هذه الشروط، وسننشر التغييرات في هذه الصفحة ونحدّث التاريخ أعلاه. واستمرارك في استخدام كارسوق بعد ذلك
        يعني قبولك لها.
      </p>

      <h2>التواصل</h2>
      <p>للاستفسار عن هذه الشروط: {email}.</p>
    </LegalPage>
  );
}
