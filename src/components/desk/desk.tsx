"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { Bell, Phone, RotateCcw, Search } from "lucide-react";
import { toast } from "sonner";
import { Clock } from "@/components/reception/clock";
import { Mark } from "@/components/reception/mark";
import { StatusBadge } from "@/components/reception/status-badge";
import { useReception } from "@/components/reception/use-reception";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  checkInAction,
  notifyAction,
  resetDemoAction,
  statusAction,
} from "@/lib/actions";
import { company } from "@/lib/company";
import { PURPOSE_LABEL } from "@/lib/labels";
import { formatMobile } from "@/lib/notices";
import { formatTokyoTime, minutesSince } from "@/lib/time";
import type { Snapshot, Visit, VisitStatus } from "@/lib/types";
import {
  findHost,
  isLate,
  normalizeQuery,
  partyPhrase,
} from "@/lib/visits";
import { cn } from "@/lib/utils";

type Filter = "active" | "expected" | "left" | "all";

const FILTERS: { id: Filter; label: string }[] = [
  { id: "active", label: "対応中" },
  { id: "expected", label: "来訪予定" },
  { id: "left", label: "退館" },
  { id: "all", label: "本日すべて" },
];

export function Desk({ initial }: { initial: Snapshot }) {
  const { snapshot, replace } = useReception(initial);
  const [filter, setFilter] = useState<Filter>("active");
  const [query, setQuery] = useState("");
  const [resetOpen, setResetOpen] = useState(false);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [clock, setClock] = useState(() => new Date(initial.now));

  useEffect(() => {
    const id = setInterval(() => setClock(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);

  const counts = {
    waiting: snapshot.visits.filter((visit) => visit.status === "waiting")
      .length,
    meeting: snapshot.visits.filter((visit) => visit.status === "meeting")
      .length,
    expected: snapshot.visits.filter((visit) => visit.status === "expected")
      .length,
    left: snapshot.visits.filter((visit) => visit.status === "left").length,
  };

  const q = normalizeQuery(query);
  const visits = snapshot.visits.filter((visit) => {
    if (filter === "active" && visit.status !== "waiting" && visit.status !== "meeting") {
      return false;
    }
    if (filter === "expected" && visit.status !== "expected") return false;
    if (filter === "left" && visit.status !== "left" && visit.status !== "cancelled") {
      return false;
    }
    if (!q) return true;
    const host = findHost(snapshot.hosts, visit.hostId);
    const haystack = normalizeQuery(
      `${visit.visitorName}${visit.visitorCompany}${visit.receptionNumber}${visit.purposeNote}${host?.name ?? ""}${host?.department ?? ""}`,
    );
    return haystack.includes(q);
  });

  function run(
    visitId: string,
    task: () => Promise<Awaited<ReturnType<typeof statusAction>>>,
    success: string,
  ) {
    setPendingId(visitId);
    startTransition(async () => {
      const result = await task();
      setPendingId(null);
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      replace(result.snapshot);
      toast.success(success);
    });
  }

  return (
    <div className="min-h-dvh">
      <header className="border-b bg-card/80">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <Mark className="size-9" />
            <div>
              <p className="font-heading text-lg leading-tight">受付デスク</p>
              <p className="text-xs text-muted-foreground">
                {company.name} · {company.building}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 sm:gap-5">
            <Clock initialIso={snapshot.now} className="hidden sm:block" />
            <Button asChild variant="outline" className="h-10 rounded-full px-4">
              <Link href="/phone">担当者の携帯</Link>
            </Button>
            <Button asChild variant="outline" className="h-10 rounded-full px-4">
              <Link href="/">来客画面</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6">
        <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Stat
            label="ロビー待ち"
            value={counts.waiting}
            hint="お迎えが必要"
            tone="text-waiting-foreground"
          />
          <Stat label="ご案内中" value={counts.meeting} hint="館内にいます" />
          <Stat label="来訪予定" value={counts.expected} hint="まだ受付前" />
          <Stat label="退館" value={counts.left} hint="本日分" />
        </section>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-1 overflow-x-auto">
            {FILTERS.map((item) => (
              <button
                key={item.id}
                type="button"
                aria-pressed={filter === item.id}
                onClick={() => setFilter(item.id)}
                className={cn(
                  "h-9 shrink-0 rounded-full px-3.5 text-sm transition-colors",
                  filter === item.id
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                {item.label}
              </button>
            ))}
          </div>
          <div className="relative w-full sm:max-w-xs">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="名前・会社・担当で探す"
              aria-label="来客を探す"
              className="h-10 rounded-full pl-9"
            />
          </div>
        </div>

        {visits.length === 0 ? (
          <div className="rounded-3xl border border-dashed px-4 py-16 text-center">
            <p className="font-heading text-2xl">該当する来客はいません</p>
            <p className="mt-2 text-sm text-muted-foreground">
              {filter === "active"
                ? "ロビーで待っている方、ご案内中の方はいません。"
                : "条件を変えるか、来客画面から受付してください。"}
            </p>
          </div>
        ) : (
          <ul className="flex flex-col gap-3">
            {visits.map((visit) => (
              <VisitCard
                key={visit.id}
                visit={visit}
                hostName={findHost(snapshot.hosts, visit.hostId)}
                now={clock}
                busy={pending && pendingId === visit.id}
                onCheckIn={() =>
                  run(
                    visit.id,
                    () => checkInAction(visit.id),
                    `${visit.visitorName} を受付しました`,
                  )
                }
                onStatus={(status, success) =>
                  run(visit.id, () => statusAction(visit.id, status), success)
                }
                onNotify={() => {
                  const host = findHost(snapshot.hosts, visit.hostId);
                  run(
                    visit.id,
                    () => notifyAction(visit.id),
                    host
                      ? `${host.name}の携帯へ連絡しました`
                      : "携帯へ連絡しました",
                  );
                }}
              />
            ))}
          </ul>
        )}

        <div className="flex justify-end pt-2">
          <Button
            type="button"
            variant="ghost"
            className="text-muted-foreground"
            onClick={() => setResetOpen(true)}
          >
            <RotateCcw />
            デモを初期状態に戻す
          </Button>
        </div>
      </main>

      <Dialog open={resetOpen} onOpenChange={setResetOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>デモデータを戻しますか</DialogTitle>
            <DialogDescription>
              本日の受付記録を、最初から入っているサンプルに戻します。この画面で追加した来客は消えます。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setResetOpen(false)}
            >
              やめる
            </Button>
            <Button
              type="button"
              disabled={pending}
              onClick={() => {
                startTransition(async () => {
                  const next = await resetDemoAction();
                  replace(next);
                  setResetOpen(false);
                  toast.success("サンプルの来客に戻しました");
                });
              }}
            >
              戻す
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Stat({
  label,
  value,
  hint,
  tone,
}: {
  label: string;
  value: number;
  hint: string;
  tone?: string;
}) {
  return (
    <div className="rounded-3xl border bg-card px-4 py-4">
      <p className="text-xs tracking-wide text-muted-foreground">{label}</p>
      <p className={cn("mt-2 font-heading text-4xl tabular-nums", tone)}>
        {value}
      </p>
      <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
    </div>
  );
}

function VisitCard({
  visit,
  hostName,
  now,
  busy,
  onCheckIn,
  onStatus,
  onNotify,
}: {
  visit: Visit;
  hostName: ReturnType<typeof findHost>;
  now: Date;
  busy: boolean;
  onCheckIn: () => void;
  onStatus: (status: VisitStatus, success: string) => void;
  onNotify: () => void;
}) {
  const late = isLate(visit, now);
  const timing = describeTiming(visit, now);

  return (
    <li className="rounded-3xl border bg-card px-4 py-4 sm:px-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-heading text-lg tabular-nums">
              {visit.receptionNumber}
            </span>
            <StatusBadge status={visit.status} />
            {late ? (
              <span className="text-xs font-medium text-waiting-foreground">
                予定時刻を過ぎています
              </span>
            ) : null}
          </div>
          <p className="mt-2 text-xl font-medium">{visit.visitorName}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {visit.visitorCompany || "個人"}
            <span className="px-1.5">·</span>
            {PURPOSE_LABEL[visit.purpose]}
            <span className="px-1.5">·</span>
            {partyPhrase(visit)}
          </p>
        </div>
        <div className="text-left sm:text-right">
          <p className="text-xs text-muted-foreground">{timing.label}</p>
          <p className="font-heading text-2xl tabular-nums">{timing.value}</p>
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm">
          <p>
            {hostName
              ? `${hostName.department}　${hostName.name}　${hostName.floor}`
              : "担当者未設定"}
          </p>
          <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            {hostName?.mobile ? (
              <span className="inline-flex items-center gap-1">
                <Phone className="size-3.5" />
                {formatMobile(hostName.mobile)}
              </span>
            ) : (
              <span>携帯未登録</span>
            )}
            {visit.notifiedAt ? (
              <span className="inline-flex items-center gap-1">
                <Bell className="size-3.5" />
                {formatTokyoTime(visit.notifiedAt)} 携帯へ送信済み
              </span>
            ) : (
              <span>未連絡</span>
            )}
            {visit.purposeNote ? <span>{visit.purposeNote}</span> : null}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {visit.status === "expected" ? (
            <Button
              type="button"
              className="h-10 rounded-full px-4"
              disabled={busy}
              onClick={onCheckIn}
            >
              受付する
            </Button>
          ) : null}
          {visit.status === "waiting" ? (
            <Button
              type="button"
              className="h-10 rounded-full px-4"
              disabled={busy}
              onClick={() =>
                onStatus("meeting", `${visit.visitorName} をご案内しました`)
              }
            >
              ご案内した
            </Button>
          ) : null}
          {visit.status === "waiting" || visit.status === "meeting" ? (
            <Button
              type="button"
              variant="outline"
              className="h-10 rounded-full px-4"
              disabled={busy}
              onClick={() =>
                onStatus("left", `${visit.visitorName} の退館を記録しました`)
              }
            >
              退館
            </Button>
          ) : null}
          {visit.status === "waiting" ||
          visit.status === "meeting" ||
          visit.status === "expected" ? (
            <Button
              type="button"
              variant="outline"
              className="h-10 rounded-full px-4"
              disabled={busy || !visit.hostId || !hostName?.mobile}
              onClick={onNotify}
            >
              {visit.notifiedAt ? "携帯へ再連絡" : "携帯へ連絡"}
            </Button>
          ) : null}
          {visit.status === "expected" || visit.status === "waiting" ? (
            <Button
              type="button"
              variant="ghost"
              className="h-10 rounded-full px-3 text-muted-foreground"
              disabled={busy}
              onClick={() =>
                onStatus(
                  "cancelled",
                  `${visit.visitorName} の来訪を取り消しました`,
                )
              }
            >
              取り消し
            </Button>
          ) : null}
        </div>
      </div>
    </li>
  );
}

function describeTiming(visit: Visit, now: Date): { label: string; value: string } {
  if (visit.status === "expected" && visit.scheduledAt) {
    return { label: "予定", value: formatTokyoTime(visit.scheduledAt) };
  }
  if (visit.status === "waiting" && visit.checkedInAt) {
    const minutes = minutesSince(visit.checkedInAt, now);
    return {
      label: "待ち時間",
      value: minutes < 1 ? "たった今" : `${minutes}分`,
    };
  }
  if (visit.status === "meeting" && visit.meetingStartedAt) {
    const minutes = minutesSince(visit.meetingStartedAt, now);
    return {
      label: "案内から",
      value: minutes < 1 ? "たった今" : `${minutes}分`,
    };
  }
  if (visit.leftAt) {
    return { label: "退館", value: formatTokyoTime(visit.leftAt) };
  }
  return { label: "記録", value: formatTokyoTime(visit.createdAt) };
}
