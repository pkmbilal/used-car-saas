"use client";

import { useActionState, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Flag } from "lucide-react";
import { reportListing, type ReportState } from "@/app/[lang]/(site)/listings/[id]/actions";
import { useDictionary } from "@/components/i18n-provider";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { translateMessage } from "@/lib/dictionary";
import { localizePath } from "@/lib/i18n";
import { MAX_REPORT_DETAILS, REPORT_REASON_VALUES } from "@/lib/moderation";

type Props = {
  listingId: string;
  signedIn: boolean;
};

export function ReportListingButton({ listingId, signedIn }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const { t, locale } = useDictionary();
  const loginHref = localizePath(locale, `/login?next=${encodeURIComponent(pathname)}`);
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState<ReportState, FormData>(
    reportListing.bind(null, listingId),
    {},
  );

  // The session may have expired since the page rendered.
  useEffect(() => {
    if (state.error === "signin") router.push(loginHref);
  }, [state.error, router, loginHref]);

  if (state.sent) {
    return <p className="text-sm text-muted-foreground">{t.listing.reportThanks}</p>;
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button
        type="button"
        variant="link"
        onClick={() => (signedIn ? setOpen(true) : router.push(loginHref))}
        className="h-auto self-start px-0 text-sm font-normal text-muted-foreground"
      >
        <Flag className="size-3.5" />
        {t.listing.reportListing}
      </Button>
      <DialogContent className="light sm:max-w-md">
        <form action={formAction} className="flex flex-col gap-5">
          <DialogHeader>
            <DialogTitle>{t.listing.reportListing}</DialogTitle>
            <DialogDescription>{t.listing.reportDescription}</DialogDescription>
          </DialogHeader>
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-2 text-sm font-medium">{t.listing.reportQuestion}</legend>
            <RadioGroup name="reason" required>
              {REPORT_REASON_VALUES.map((value) => (
                <div key={value} className="flex items-center gap-2">
                  <RadioGroupItem value={value} id={`reason-${value}`} />
                  <Label htmlFor={`reason-${value}`} className="font-normal">
                    {t.listing.reportReasons[value]}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </fieldset>
          <div className="flex flex-col gap-2">
            <Label htmlFor="report-details">{t.listing.reportDetails}</Label>
            <Textarea id="report-details" name="details" rows={3} maxLength={MAX_REPORT_DETAILS} />
          </div>
          {state.error && state.error !== "signin" && <p className="text-sm text-destructive">{translateMessage(t, state.error)}</p>}
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                {t.common.cancel}
              </Button>
            </DialogClose>
            <Button type="submit" disabled={pending}>
              {pending ? t.listing.sending : t.listing.sendReport}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
