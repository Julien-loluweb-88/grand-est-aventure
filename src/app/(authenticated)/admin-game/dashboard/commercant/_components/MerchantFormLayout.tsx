import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AdvertisementMerchantContentStatusValue } from "@/lib/advertisements/merchant-advertisement-status";
import { labelForAdvertisementMerchantContentStatus } from "@/lib/advertisements/merchant-advertisement-labels";

const STATUS_BADGE_CLASS: Record<AdvertisementMerchantContentStatusValue, string> = {
  SLOT_EMPTY: "bg-muted text-muted-foreground ring-muted-foreground/20",
  DRAFT: "bg-amber-100 text-amber-900 ring-amber-600/20 dark:bg-amber-950/50 dark:text-amber-200",
  PENDING_REVIEW:
    "bg-sky-100 text-sky-900 ring-sky-600/20 dark:bg-sky-950/50 dark:text-sky-200",
  APPROVED:
    "bg-emerald-100 text-emerald-900 ring-emerald-600/20 dark:bg-emerald-950/50 dark:text-emerald-200",
  REJECTED: "bg-destructive/10 text-destructive ring-destructive/20",
};

export function MerchantStatusBadge({
  status,
}: {
  status: AdvertisementMerchantContentStatusValue;
}) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset",
        STATUS_BADGE_CLASS[status]
      )}
    >
      {labelForAdvertisementMerchantContentStatus(status)}
    </span>
  );
}

export function MerchantFormStatusBar({
  advertisementName,
  advertiserName,
  status,
  rejectionReason,
  pendingReview,
}: {
  advertisementName: string;
  advertiserName: string;
  status: AdvertisementMerchantContentStatusValue;
  rejectionReason: string | null;
  pendingReview: boolean;
}) {
  return (
    <div className="rounded-lg border bg-card px-4 py-3 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Campagne
          </p>
          <p className="text-base font-semibold text-foreground">{advertisementName}</p>
          <p className="text-sm text-muted-foreground">{advertiserName}</p>
        </div>
        <MerchantStatusBadge status={status} />
      </div>
      {rejectionReason ? (
        <div className="mt-3 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          <span className="font-semibold">Motif du refus :</span> {rejectionReason}
        </div>
      ) : null}
      {pendingReview ? (
        <div className="mt-3 rounded-md border border-sky-200 bg-sky-50 px-3 py-2 text-sm text-sky-900 dark:border-sky-900 dark:bg-sky-950/40 dark:text-sky-100">
          Soumission en cours de validation — les champs sont verrouillés jusqu&apos;à la
          décision.
        </div>
      ) : null}
    </div>
  );
}

export function MerchantFormGuide({ icon: Icon, title, children }: {
  icon: LucideIcon;
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-lg border border-primary/20 bg-primary/5 px-4 py-3">
      <div className="flex gap-3">
        <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
          <Icon className="size-4" aria-hidden />
        </div>
        <div className="min-w-0 space-y-2 text-sm">
          <p className="font-semibold text-foreground">{title}</p>
          <div className="text-muted-foreground [&_strong]:font-medium [&_strong]:text-foreground">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

export function MerchantFormSection({
  icon: Icon,
  title,
  subtitle,
  optional = false,
  accentClassName = "text-primary",
  children,
}: {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  optional?: boolean;
  accentClassName?: string;
  children: ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-lg border bg-card shadow-sm">
      <header className="border-b bg-muted/50 px-4 py-3">
        <div className="flex items-start gap-2.5">
          <Icon className={cn("mt-0.5 size-4 shrink-0", accentClassName)} aria-hidden />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm font-semibold text-foreground">{title}</h3>
              {optional ? (
                <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground ring-1 ring-border">
                  Optionnel
                </span>
              ) : null}
            </div>
            {subtitle ? (
              <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{subtitle}</p>
            ) : null}
          </div>
        </div>
      </header>
      <div className="space-y-5 p-4">{children}</div>
    </section>
  );
}

export function MerchantFieldHint({ children }: { children: ReactNode }) {
  return (
    <p className="text-xs leading-relaxed text-muted-foreground">{children}</p>
  );
}

export function MerchantFieldExample({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-md bg-amber-50 px-2.5 py-1.5 text-xs leading-relaxed text-amber-950 dark:bg-amber-950/30 dark:text-amber-100">
      <span className="font-semibold">Exemple :</span> {children}
    </p>
  );
}

export function MerchantFormActionsHelp({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-lg border border-emerald-200 bg-emerald-50/80 px-4 py-3 text-sm dark:border-emerald-900 dark:bg-emerald-950/30">
      <p className="font-semibold text-emerald-950 dark:text-emerald-100">Actions</p>
      <div className="mt-1.5 space-y-1 text-emerald-900/90 dark:text-emerald-100/90 [&_strong]:font-semibold [&_strong]:text-emerald-950 dark:[&_strong]:text-emerald-50">
        {children}
      </div>
    </div>
  );
}
