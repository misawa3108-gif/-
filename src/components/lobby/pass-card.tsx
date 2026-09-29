import { company } from "@/lib/company";
import { PURPOSE_LABEL } from "@/lib/labels";
import { formatTokyoTime } from "@/lib/time";
import type { Host, Visit } from "@/lib/types";
import { organizationLabel, partyPhrase } from "@/lib/visits";

export function PassCard({ visit, host }: { visit: Visit; host: Host | null }) {
  const when = visit.checkedInAt ?? visit.createdAt;
  const detail = [
    organizationLabel(visit) === visit.visitorName ? null : organizationLabel(visit),
    partyPhrase(visit) || null,
    PURPOSE_LABEL[visit.purpose] === visit.visitorName
      ? null
      : PURPOSE_LABEL[visit.purpose],
  ]
    .filter(Boolean)
    .join(" · ");
  return (
    <article className="overflow-hidden rounded-3xl border bg-card shadow-[0_18px_50px_-28px_oklch(0.35_0.04_168)]">
      <div className="flex">
        <div className="w-2 shrink-0 bg-primary" />
        <div className="flex-1 px-5 py-5 sm:px-7 sm:py-6">
          <div className="flex items-start justify-between gap-4">
            <p className="text-xs tracking-[0.16em] text-muted-foreground">
              {company.nameEn}
            </p>
            <p className="text-xs text-muted-foreground tabular-nums">
              {formatTokyoTime(when)}
            </p>
          </div>
          <p className="mt-5 text-xs tracking-wide text-muted-foreground">
            受付番号
          </p>
          <p className="font-heading text-5xl leading-none tracking-tight sm:text-6xl">
            {visit.receptionNumber}
          </p>
          <div className="mt-6 border-t border-dashed pt-4">
            <p className="text-xl font-medium">{visit.visitorName}</p>
            {detail ? (
              <p className="mt-1 text-sm text-muted-foreground">{detail}</p>
            ) : null}
            <p className="mt-3 text-sm">
              {host
                ? `${host.department}　${host.name}　${host.floor}`
                : "担当者未設定"}
            </p>
          </div>
        </div>
      </div>
    </article>
  );
}
