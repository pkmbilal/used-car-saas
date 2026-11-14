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
      ? { title: "سياسة الاسترداد والإلغاء | كارسوق", description: "متى وكيف تسترد المبالغ المدفوعة لكارسوق." }
      : { title: "Refund & Cancellation Policy | KarSouq", description: "When and how payments made to KarSouq are refunded." }),
    path: "/refunds",
  });
}

const email = (
  <a href={`mailto:${LEGAL_CONTACT_EMAIL}`} className="font-medium underline">
    {LEGAL_CONTACT_EMAIL}
  </a>
);

function freeUntil(locale: string): string {
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-SA-u-ca-gregory" : "en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Riyadh",
  }).format(new Date(launchFreeUntil()));
}

// TODO(legal): draft only. Have both languages reviewed by a lawyer before
// launch and before online payments go live; keep them saying the same thing.
export default async function RefundsPage() {
  const { locale } = await getDictionary();
  const until = freeUntil(locale);
  return locale === "ar" ? <RefundsAr until={until} /> : <RefundsEn until={until} />;
}

function RefundsEn({ until }: { until: string }) {
  return (
    <LegalPage title="Refund & Cancellation Policy" updated="14 November 2026">
      <p>
        This policy covers payments made to {COMPANY_NAME} (&quot;we&quot;) for KarSouq services. It forms part of
        our{" "}
        <Link href="/terms" className="font-medium underline">
          Terms of Use
        </Link>
        .
      </p>

      <h2>Free during launch</h2>
      <p>
        Posting listings, including on a Verified Dealer account, is free until {until}. Nothing is charged for it, so
        there is nothing to refund. We will give at least 30 days&apos; notice before any paid plan starts.
      </p>

      <h2>Paid services</h2>
      <p>
        Some extras, such as featured placement for a listing, are paid. Until online payment is available, you pay by
        bank transfer or another method we agree with you, and an administrator activates the service once the payment
        is confirmed.
      </p>

      <h2>When you get a refund</h2>
      <ul>
        <li>You cancel before the service is activated: full refund.</li>
        <li>You paid twice or paid the wrong amount: the extra is refunded.</li>
        <li>We cannot deliver the service, or we remove your listing through our own error: refund for the unused part.</li>
      </ul>

      <h2>When you don&apos;t</h2>
      <ul>
        <li>Once a service is active, its fee is non-refundable, except where the law requires otherwise.</li>
        <li>
          No refund is due if a listing is removed or an account suspended for breaking the Terms of Use, or if the car
          is sold or the listing taken down before the service ends.
        </li>
      </ul>

      <h2>Deals between users</h2>
      <p>
        KarSouq is not a party to car sales, price offers or rentals between users and does not take payments for them.
        Any deposit, price or rental fee is agreed and paid between buyer and seller (or renter and owner); refunds for
        them are a matter between those users.
      </p>

      <h2>How to ask</h2>
      <p>
        Email {email} within 14 days of paying, with your account email, the payment reference and the reason. We reply
        within 5 working days. Approved refunds are paid to the original payment method within 14 days.
      </p>
    </LegalPage>
  );
}

function RefundsAr({ until }: { until: string }) {
  return (
    <LegalPage title="سياسة الاسترداد والإلغاء" updated="14 نوفمبر 2026">
      <p>
        تنطبق هذه السياسة على المبالغ المدفوعة لـ{COMPANY_NAME} (&quot;نحن&quot;) مقابل خدمات كارسوق، وهي جزء من{" "}
        <Link href="/terms" className="font-medium underline">
          شروط الاستخدام
        </Link>
        .
      </p>

      <h2>مجانًا خلال فترة الإطلاق</h2>
      <p>
        نشر الإعلانات مجاني حتى {until}، بما في ذلك حسابات المعارض الموثقة. لا نتقاضى أي رسوم عليه، فلا يوجد ما
        يُسترد. وسنُعلن قبل 30 يومًا على الأقل من بدء أي باقة مدفوعة.
      </p>

      <h2>الخدمات المدفوعة</h2>
      <p>
        بعض الخدمات الإضافية مدفوعة، مثل تمييز الإعلان. وإلى أن يتوفر الدفع الإلكتروني، يتم الدفع بالتحويل البنكي أو
        بطريقة أخرى نتفق عليها معك، ويفعّل أحد المسؤولين الخدمة بعد تأكيد الدفع.
      </p>

      <h2>متى تسترد المبلغ</h2>
      <ul>
        <li>إذا ألغيت قبل تفعيل الخدمة: استرداد كامل.</li>
        <li>إذا دفعت مرتين أو دفعت مبلغًا خاطئًا: يُسترد المبلغ الزائد.</li>
        <li>إذا تعذّر علينا تقديم الخدمة، أو حذفنا إعلانك بخطأ منا: يُسترد الجزء غير المستخدم.</li>
      </ul>

      <h2>متى لا يُسترد المبلغ</h2>
      <ul>
        <li>بعد تفعيل الخدمة تصبح رسومها غير قابلة للاسترداد، إلا فيما يقتضيه النظام.</li>
        <li>
          لا يُسترد المبلغ إذا حُذف الإعلان أو أُوقف الحساب لمخالفة شروط الاستخدام، أو إذا بيعت السيارة أو حُذف الإعلان
          قبل انتهاء الخدمة.
        </li>
      </ul>

      <h2>التعاملات بين المستخدمين</h2>
      <p>
        كارسوق ليست طرفًا في عمليات بيع السيارات أو عروض الأسعار أو التأجير بين المستخدمين، ولا تستلم أي مبالغ عنها.
        يتفق المشتري والبائع (أو المستأجر والمالك) على أي عربون أو ثمن أو أجرة ويدفعونها فيما بينهم، واسترداد هذه
        المبالغ شأن بينهم.
      </p>

      <h2>كيف تطلب الاسترداد</h2>
      <p>
        راسلنا على {email} خلال 14 يومًا من الدفع، مع البريد الإلكتروني لحسابك ومرجع الدفع وسبب الطلب. نرد خلال 5 أيام
        عمل، وتُعاد المبالغ المعتمدة إلى طريقة الدفع الأصلية خلال 14 يومًا.
      </p>
    </LegalPage>
  );
}
