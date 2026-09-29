"use client";

import { useCallback, useEffect, useState, useTransition, type ReactNode } from "react";
import { Briefcase, HardHat, Truck, UserRound } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AttractScreen } from "@/components/lobby/attract";
import { HostPicker } from "@/components/lobby/host-picker";
import { LobbyFrame } from "@/components/lobby/frame";
import { PassCard } from "@/components/lobby/pass-card";
import { useReception } from "@/components/reception/use-reception";
import { directArrivalAction, guestAction, interviewAction } from "@/lib/actions";
import { INTERVIEW_HOST_ID, SERVICE_HOST_ID } from "@/lib/company";
import { greeting } from "@/lib/time";
import type { Snapshot, Visit } from "@/lib/types";
import { findHost } from "@/lib/visits";

type Screen =
  | { name: "attract" }
  | { name: "home" }
  | { name: "guest" }
  | { name: "guest-confirm" }
  | { name: "interview" }
  | { name: "interview-confirm" }
  | { name: "service" }
  | { name: "done"; visit: Visit };

type GuestDraft = {
  visitorCompany: string;
  visitorName: string;
  hostId: string;
};

type InterviewDraft = {
  visitorName: string;
};

const IDLE_MS = 90_000;

const emptyGuest = (): GuestDraft => ({
  visitorCompany: "",
  visitorName: "",
  hostId: "",
});

const emptyInterview = (): InterviewDraft => ({
  visitorName: "",
});

export function Kiosk({ initial }: { initial: Snapshot }) {
  const { snapshot, replace } = useReception(initial);
  const [screen, setScreen] = useState<Screen>({ name: "attract" });
  const [guest, setGuest] = useState<GuestDraft>(emptyGuest);
  const [interview, setInterview] = useState<InterviewDraft>(emptyInterview);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const [secondsLeft, setSecondsLeft] = useState(24);
  const [returnAt, setReturnAt] = useState<number | null>(null);

  const goAttract = useCallback(() => {
    setError("");
    setReturnAt(null);
    setGuest(emptyGuest());
    setInterview(emptyInterview());
    setScreen({ name: "attract" });
  }, []);

  useEffect(() => {
    if (returnAt === null) return;
    const id = setInterval(() => {
      const left = Math.max(0, Math.ceil((returnAt - Date.now()) / 1000));
      setSecondsLeft(left);
      if (left <= 0) goAttract();
    }, 250);
    return () => clearInterval(id);
  }, [returnAt, goAttract]);

  function goHome() {
    setError("");
    setReturnAt(null);
    setScreen({ name: "home" });
  }

  useEffect(() => {
    if (screen.name === "attract" || screen.name === "done" || pending) return;
    const id = window.setTimeout(() => {
      goAttract();
    }, IDLE_MS);
    return () => window.clearTimeout(id);
  }, [screen, guest, interview, pending, goAttract]);

  function complete(visit: Visit) {
    setSecondsLeft(24);
    setReturnAt(Date.now() + 24_000);
    setScreen({ name: "done", visit });
  }

  function back() {
    setError("");
    if (screen.name === "done") {
      goAttract();
      return;
    }
    if (screen.name === "guest") {
      goHome();
      return;
    }
    if (screen.name === "guest-confirm") {
      setScreen({ name: "guest" });
      return;
    }
    if (screen.name === "interview") {
      goHome();
      return;
    }
    if (screen.name === "interview-confirm") {
      setScreen({ name: "interview" });
      return;
    }
    if (screen.name === "service") {
      goHome();
    }
  }

  function arrive(purpose: "delivery" | "work") {
    if (pending) return;
    setError("");
    startTransition(async () => {
      const result = await directArrivalAction(purpose);
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      replace(result.snapshot);
      complete(result.visit);
    });
  }

  if (screen.name === "attract") {
    return <AttractScreen now={snapshot.now} onStart={() => setScreen({ name: "home" })} />;
  }

  if (screen.name === "home") {
    return (
      <LobbyFrame now={snapshot.now} wide onBack={goAttract}>
        <div className="flex flex-1 flex-col items-center justify-center px-2 py-10 text-center">
          <p className="text-xs tracking-[0.32em] text-primary sm:text-sm">
            {greeting(new Date(snapshot.now))}
          </p>
          <h1 className="mt-5 font-heading text-5xl leading-none tracking-tight sm:text-6xl">
            ご用件をお選びください
          </h1>
          <p className="mt-5 max-w-md text-sm leading-relaxed text-muted-foreground sm:text-base">
            あてはまる受付をタッチしてください。記入が終わると、担当者の携帯へ連絡します。
          </p>

          <div className="mt-12 grid w-full gap-3 text-left sm:grid-cols-3 sm:gap-4">
            <Choice
              icon={<UserRound />}
              title="来客用"
              body="会社名、訪問者の名前、アポの相手を記入します。"
              onClick={() => {
                setError("");
                setGuest(emptyGuest());
                setScreen({ name: "guest" });
              }}
            />
            <Choice
              icon={<Briefcase />}
              title="面接用"
              body="訪問者の名前だけ記入します。人事担当の携帯へ連絡します。"
              onClick={() => {
                setError("");
                setInterview(emptyInterview());
                setScreen({ name: "interview" });
              }}
            />
            <Choice
              icon={<HardHat />}
              title="配送・工事用"
              body="配送か工事・作業を選ぶと、担当者の携帯へ直接連絡します。"
              onClick={() => {
                setError("");
                setScreen({ name: "service" });
              }}
            />
          </div>
        </div>
      </LobbyFrame>
    );
  }

  if (screen.name === "guest" || screen.name === "guest-confirm") {
    const host = findHost(snapshot.hosts, guest.hostId);
    const confirming = screen.name === "guest-confirm";
    return (
      <LobbyFrame
        now={snapshot.now}
        onBack={back}
        title={confirming ? "この内容で連絡します" : "来客の受付"}
        lede={
          confirming
            ? "アポの相手の携帯へ、到着の連絡を送ります。"
            : "会社名、訪問者の名前、誰に対してのアポかを記入してください。"
        }
      >
        {confirming ? (
          <>
            <Summary
              rows={[
                ["会社名", guest.visitorCompany.trim()],
                ["訪問者の名前", guest.visitorName.trim()],
                [
                  "アポの相手",
                  host ? `${host.name}（${host.department}・${host.floor}）` : "—",
                ],
                ["連絡先", host ? `${host.name}の携帯` : "—"],
              ]}
            />
            <Button
              type="button"
              disabled={pending}
              className="mt-6 h-14 w-full rounded-2xl text-base"
              onClick={() => {
                startTransition(async () => {
                  const result = await guestAction({
                    visitorCompany: guest.visitorCompany,
                    visitorName: guest.visitorName,
                    hostId: guest.hostId,
                  });
                  if (!result.ok) {
                    toast.error(result.message);
                    return;
                  }
                  replace(result.snapshot);
                  complete(result.visit);
                });
              }}
            >
              {pending ? "連絡しています…" : "携帯へ連絡する"}
            </Button>
          </>
        ) : (
          <form
            className="flex flex-col gap-5"
            onSubmit={(event) => {
              event.preventDefault();
              if (!guest.visitorCompany.trim()) {
                setError("会社名を入力してください。");
                return;
              }
              if (!guest.visitorName.trim()) {
                setError("訪問者の名前を入力してください。");
                return;
              }
              if (!guest.hostId) {
                setError("誰に対してのアポかを選んでください。");
                return;
              }
              setError("");
              setScreen({ name: "guest-confirm" });
            }}
          >
            <Field label="会社名" htmlFor="guest-company" required>
              <Input
                id="guest-company"
                autoFocus
                value={guest.visitorCompany}
                onChange={(event) =>
                  setGuest((draft) => ({
                    ...draft,
                    visitorCompany: event.target.value,
                  }))
                }
                placeholder="株式会社ノースブリッジ"
                className="h-14 rounded-2xl text-base md:text-base"
                maxLength={60}
              />
            </Field>
            <Field label="訪問者の名前" htmlFor="guest-name" required>
              <Input
                id="guest-name"
                value={guest.visitorName}
                onChange={(event) =>
                  setGuest((draft) => ({
                    ...draft,
                    visitorName: event.target.value,
                  }))
                }
                placeholder="山田 太郎"
                className="h-14 rounded-2xl text-base md:text-base"
                maxLength={40}
              />
            </Field>
            <Field label="誰に対してのアポか" required>
              <HostPicker
                hosts={snapshot.hosts}
                value={guest.hostId}
                onChange={(hostId) => setGuest((draft) => ({ ...draft, hostId }))}
              />
            </Field>
            {error ? (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            ) : null}
            <Button type="submit" className="h-14 rounded-2xl text-base">
              内容を確認する
            </Button>
          </form>
        )}
      </LobbyFrame>
    );
  }

  if (screen.name === "interview" || screen.name === "interview-confirm") {
    const interviewer = findHost(snapshot.hosts, INTERVIEW_HOST_ID);
    const confirming = screen.name === "interview-confirm";
    return (
      <LobbyFrame
        now={snapshot.now}
        onBack={back}
        title={confirming ? "このお名前で連絡します" : "面接の受付"}
        lede={
          confirming
            ? interviewer
              ? `${interviewer.department} ${interviewer.name}の携帯へ、到着の連絡を送ります。`
              : "面接担当者の携帯へ連絡します。"
            : "訪問者の名前だけ記入してください。人事担当の携帯へ連絡します。"
        }
      >
        {!interviewer ? (
          <div className="rounded-2xl border border-dashed px-4 py-10 text-center text-sm text-muted-foreground">
            面接担当者の携帯が登録されていません。受付カウンターへお声がけください。
          </div>
        ) : confirming ? (
          <>
            <Summary
              rows={[
                ["訪問者の名前", interview.visitorName.trim()],
                [
                  "連絡先",
                  `${interviewer.department} ${interviewer.name}の携帯`,
                ],
              ]}
            />
            <Button
              type="button"
              disabled={pending}
              className="mt-6 h-14 w-full rounded-2xl text-base"
              onClick={() => {
                startTransition(async () => {
                  const result = await interviewAction({
                    visitorName: interview.visitorName,
                  });
                  if (!result.ok) {
                    toast.error(result.message);
                    return;
                  }
                  replace(result.snapshot);
                  complete(result.visit);
                });
              }}
            >
              {pending ? "連絡しています…" : "携帯へ連絡する"}
            </Button>
          </>
        ) : (
          <form
            className="flex flex-col gap-5"
            onSubmit={(event) => {
              event.preventDefault();
              if (!interview.visitorName.trim()) {
                setError("訪問者の名前を入力してください。");
                return;
              }
              setError("");
              setScreen({ name: "interview-confirm" });
            }}
          >
            <Field label="訪問者の名前" htmlFor="interview-name" required>
              <Input
                id="interview-name"
                autoFocus
                value={interview.visitorName}
                onChange={(event) =>
                  setInterview({ visitorName: event.target.value })
                }
                placeholder="木村 咲"
                className="h-14 rounded-2xl text-base md:text-base"
                maxLength={40}
              />
            </Field>
            <p className="rounded-2xl bg-secondary px-4 py-3 text-sm leading-relaxed text-secondary-foreground">
              送信すると、{interviewer.department} {interviewer.name}
              の携帯へ連絡します。お名前以外の記入はありません。
            </p>
            {error ? (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            ) : null}
            <Button type="submit" className="h-14 rounded-2xl text-base">
              内容を確認する
            </Button>
          </form>
        )}
      </LobbyFrame>
    );
  }

  if (screen.name === "service") {
    const contact = findHost(snapshot.hosts, SERVICE_HOST_ID);
    return (
      <LobbyFrame
        now={snapshot.now}
        onBack={pending ? undefined : back}
        title="配送・工事"
        lede={
          pending
            ? "担当者の携帯へ連絡しています…"
            : contact
              ? `選ぶと、${contact.department} ${contact.name}の携帯へすぐに連絡します。`
              : "担当者の携帯が登録されていません。"
        }
      >
        {!contact ? (
          <div className="rounded-2xl border border-dashed px-4 py-10 text-center text-sm text-muted-foreground">
            担当者の携帯が登録されていません。受付カウンターへお声がけください。
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
            <Choice
              icon={<Truck />}
              title="配送"
              body="選んだ時点で、担当者の携帯へ配送の到着を連絡します。"
              disabled={pending}
              onClick={() => arrive("delivery")}
            />
            <Choice
              icon={<HardHat />}
              title="工事・作業"
              body="選んだ時点で、担当者の携帯へ工事・作業の到着を連絡します。"
              disabled={pending}
              onClick={() => arrive("work")}
            />
          </div>
        )}
      </LobbyFrame>
    );
  }

  const host = findHost(snapshot.hosts, screen.visit.hostId);
  const notice = snapshot.notices.find((item) => item.visitId === screen.visit.id);
  const deliveryDone = screen.visit.purpose === "delivery";
  const workDone = screen.visit.purpose === "work";
  const interviewDone = screen.visit.purpose === "interview";
  const who = host ? `${host.name}さんの携帯` : "担当者の携帯";
  return (
    <LobbyFrame now={snapshot.now} onBack={goAttract} title="受付が完了しました">
      <PassCard visit={screen.visit} host={host} />
      <p className="mt-6 text-sm leading-relaxed text-muted-foreground sm:text-base">
        {deliveryDone
          ? `${who}へ配達の連絡を送りました。お荷物は受付カウンターへお渡しください。`
          : workDone
            ? `${who}へ工事・作業の到着を連絡しました。受付で入館のご案内をお受けください。`
            : interviewDone
              ? `${who}へ面接の到着を連絡しました。ロビーで少々お待ちください。`
              : `${who}へ来客の到着を連絡しました。ロビーで少々お待ちください。`}
      </p>
      {notice ? (
        <div className="mt-4 rounded-3xl bg-secondary px-5 py-4" aria-live="polite">
          <p className="text-xs tracking-[0.14em] text-muted-foreground">
            送信した連絡
          </p>
          <p className="mt-2 text-sm leading-relaxed">{notice.body}</p>
        </div>
      ) : null}
      <Button
        type="button"
        variant="outline"
        className="mt-6 h-12 rounded-2xl"
        onClick={goAttract}
      >
        最初の画面へ戻る（{secondsLeft}秒）
      </Button>
    </LobbyFrame>
  );
}

function Choice({
  icon,
  title,
  body,
  onClick,
  disabled = false,
}: {
  icon: ReactNode;
  title: string;
  body: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="group flex h-full flex-col items-start rounded-3xl border border-border bg-card px-5 py-5 text-left transition-colors hover:border-primary/50 hover:bg-accent/60 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-60 sm:min-h-52 sm:py-6"
    >
      <span className="flex size-11 items-center justify-center rounded-2xl bg-secondary text-primary [&_svg]:size-5">
        {icon}
      </span>
      <span className="mt-5 font-heading text-2xl leading-snug">{title}</span>
      <span className="mt-2 text-sm leading-relaxed text-muted-foreground">
        {body}
      </span>
    </button>
  );
}

function Field({
  label,
  hint,
  required,
  htmlFor,
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  htmlFor?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between gap-3">
        <Label htmlFor={htmlFor} className="text-sm">
          {label}
          {required ? <span className="text-destructive"> *</span> : null}
        </Label>
        {hint ? (
          <span className="text-xs text-muted-foreground">{hint}</span>
        ) : null}
      </div>
      {children}
    </div>
  );
}

function Summary({ rows }: { rows: [string, string][] }) {
  return (
    <dl className="divide-y rounded-3xl border bg-card">
      {rows.map(([label, value]) => (
        <div
          key={label}
          className="grid grid-cols-[5.5rem_1fr] gap-3 px-4 py-3.5 sm:grid-cols-[7rem_1fr] sm:px-5"
        >
          <dt className="text-sm text-muted-foreground">{label}</dt>
          <dd className="text-sm font-medium sm:text-base">{value}</dd>
        </div>
      ))}
    </dl>
  );
}
