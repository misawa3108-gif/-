"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Mark } from "@/components/reception/mark";
import { useReception } from "@/components/reception/use-reception";
import { markReadAction } from "@/lib/actions";
import { contactChannel, contactNoun } from "@/lib/contacts";
import { company } from "@/lib/company";
import { formatMobile } from "@/lib/notices";
import { formatTokyoClock, formatTokyoTime } from "@/lib/time";
import type { Host, Snapshot } from "@/lib/types";
import { findHost } from "@/lib/visits";
import { cn } from "@/lib/utils";

export function Handset({ initial }: { initial: Snapshot }) {
  const { snapshot, replace } = useReception(initial);
  const [hostId, setHostId] = useState(
    () => initial.notices[0]?.hostId ?? initial.hosts[0]?.id ?? "",
  );
  const [banner, setBanner] = useState<string | null>(null);
  const [freshIds, setFreshIds] = useState<string[]>([]);
  const [, startTransition] = useTransition();
  const seen = useRef<Set<string> | null>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const [clock, setClock] = useState(() => new Date(initial.now));

  const host = findHost(snapshot.hosts, hostId);
  const thread = snapshot.notices
    .filter((notice) => notice.hostId === hostId)
    .slice()
    .reverse();
  const unreadKey = snapshot.notices
    .filter((notice) => notice.hostId === hostId && notice.readAt === null)
    .map((notice) => notice.id)
    .join(",");

  useEffect(() => {
    const id = window.setInterval(() => setClock(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    const ids = snapshot.notices.map((notice) => notice.id);
    if (seen.current === null) {
      seen.current = new Set(ids);
      return;
    }
    const arrived = snapshot.notices.filter(
      (notice) => !seen.current?.has(notice.id),
    );
    if (arrived.length === 0) return;
    for (const notice of arrived) seen.current.add(notice.id);
    const newest = arrived[0];
    if (!newest) return;
    setHostId(newest.hostId);
    setFreshIds(arrived.map((notice) => notice.id));
    const person = findHost(snapshot.hosts, newest.hostId);
    const label = person
      ? `${person.name}の${contactNoun(person)}に届きました`
      : "連絡が届きました";
    setBanner(label);
    toast.message(label);
  }, [snapshot.notices, snapshot.hosts]);

  useEffect(() => {
    if (!banner) return;
    const id = window.setTimeout(() => setBanner(null), 4000);
    return () => window.clearTimeout(id);
  }, [banner]);

  useEffect(() => {
    if (!unreadKey || !hostId) return;
    const id = window.setTimeout(() => {
      startTransition(async () => {
        try {
          const next = await markReadAction(hostId);
          replace(next);
        } catch {
          toast.error("既読にできませんでした。");
        }
      });
    }, 1600);
    return () => window.clearTimeout(id);
  }, [unreadKey, hostId, replace]);

  useEffect(() => {
    const node = scroller.current;
    if (!node) return;
    node.scrollTop = node.scrollHeight;
  }, [hostId, thread.length]);

  return (
    <div className="min-h-dvh">
      <header className="border-b bg-card/80">
        <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-4 px-4 py-4">
          <div className="flex items-center gap-3">
            <Mark className="size-9" />
            <div>
              <p className="font-heading text-lg leading-tight">担当者への連絡</p>
              <p className="text-xs text-muted-foreground">
                {company.name} · 受付からの連絡
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button asChild variant="outline" className="h-10 rounded-full px-4">
              <Link href="/">来客画面</Link>
            </Button>
            <Button asChild variant="outline" className="h-10 rounded-full px-4">
              <Link href="/desk">受付デスク</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-3xl flex-col gap-4 px-4 py-5">
        <div>
          <p className="text-xs tracking-[0.14em] text-muted-foreground">
            表示している連絡先
          </p>
          <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
            {snapshot.hosts.map((person) => {
              const unread = snapshot.notices.filter(
                (notice) => notice.hostId === person.id && notice.readAt === null,
              ).length;
              const selected = person.id === hostId;
              return (
                <button
                  key={person.id}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => setHostId(person.id)}
                  className={cn(
                    "flex shrink-0 items-center gap-2 rounded-full border px-3 py-2 text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                    selected
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-card hover:border-primary/40",
                  )}
                >
                  <span>
                    <span className="block leading-tight">{person.name}</span>
                    <span
                      className={cn(
                        "block text-[11px]",
                        selected
                          ? "text-primary-foreground/80"
                          : "text-muted-foreground",
                      )}
                    >
                      {person.department} · {contactNoun(person)}
                    </span>
                  </span>
                  {unread > 0 ? (
                    <Badge
                      variant={selected ? "secondary" : "default"}
                      className="h-5 min-w-5 px-1.5"
                    >
                      {unread}
                    </Badge>
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mx-auto w-full max-w-sm rounded-[2.4rem] bg-zinc-900 p-3 shadow-[0_24px_60px_-28px_oklch(0.25_0.03_170)]">
          <div className="flex h-[680px] flex-col overflow-hidden rounded-[1.8rem] bg-background">
            <div className="flex items-center justify-between px-5 pt-3 text-[11px] text-muted-foreground tabular-nums">
              <span>{formatTokyoClock(clock)}</span>
              <span>{host ? handsetDestination(host) : ""}</span>
            </div>
            <div className="border-b px-5 py-3">
              <p className="text-xs text-muted-foreground">メッセージ</p>
              <p className="font-heading text-xl leading-tight">
                {host ? host.name : "担当者"}
              </p>
              <p className="text-xs text-muted-foreground">
                {host
                  ? `${host.department} · ${host.title} · ${contactNoun(host)}`
                  : "担当者を選んでください"}
              </p>
            </div>
            {banner ? (
              <p
                className="message-in mx-4 mt-3 rounded-2xl bg-primary px-3 py-2 text-center text-xs text-primary-foreground"
                role="status"
              >
                {banner}
              </p>
            ) : null}
            <div ref={scroller} className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
              {thread.length === 0 ? (
                <div className="flex h-full items-center justify-center px-4 text-center">
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    今日の連絡はまだありません。来客が受付すると、この{host ? contactNoun(host) : "連絡先"}に届きます。
                  </p>
                </div>
              ) : (
                <ul className="flex flex-col gap-3">
                  {thread.map((notice) => (
                    <li
                      key={notice.id}
                      className={cn(
                        "max-w-[92%] rounded-3xl rounded-tl-md bg-secondary px-4 py-3",
                        freshIds.includes(notice.id) && "message-in",
                      )}
                    >
                      <p className="text-[11px] tracking-wide text-muted-foreground">
                        ライトパス受付 · {formatTokyoTime(notice.sentAt)}
                      </p>
                      <p className="mt-1.5 text-sm leading-relaxed">{notice.body}</p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function handsetDestination(host: Host): string {
  if (contactChannel(host) === "wowtalk") {
    return host.wowtalkId.trim() ? `WowTalk ${host.wowtalkId.trim()}` : "WowTalk ID未設定";
  }
  return formatMobile(host.mobile);
}
