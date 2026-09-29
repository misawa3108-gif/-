"use client";

import { useCallback, useEffect, useState, useTransition, type ReactNode } from "react";
import Link from "next/link";
import { Briefcase, HardHat, Truck, UserRound } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AttractScreen } from "@/components/lobby/attract";
import { HostPicker } from "@/components/lobby/host-picker";
import { LobbyFrame } from "@/components/lobby/frame";
import { PassCard } from "@/components/lobby/pass-card";
import { useReception } from "@/components/reception/use-reception";
import {
  deliveryAction,
  guestAction,
  interviewAction,
  workAction,
} from "@/lib/actions";
import { INTERVIEW_HOST_ID, company } from "@/lib/company";
import { CARRIERS } from "@/lib/labels";
import { greeting } from "@/lib/time";
import type { Snapshot, Visit } from "@/lib/types";
import { findHost } from "@/lib/visits";
import { cn } from "@/lib/utils";

type Screen =
  | { name: "attract" }
  | { name: "home" }
  | { name: "guest" }
  | { name: "guest-confirm" }
  | { name: "interview" }
  | { name: "interview-confirm" }
  | { name: "service" }
  | { name: "delivery"; step: 0 | 1 | 2 }
  | { name: "work"; step: 0 | 1 }
  | { name: "done"; visit: Visit };

type GuestDraft = {
  visitorCompany: string;
  visitorName: string;
  hostId: string;
};

type InterviewDraft = {
  visitorName: string;
};

type DeliveryDraft = {
  carrier: string;
  customCarrier: string;
  driverName: string;
  parcelCount: number;
  hostId: string;
  purposeNote: string;
};

type WorkDraft = {
  visitorName: string;
  visitorCompany: string;
  partySize: number;
  hostId: string;
  purposeNote: string;
};

const DELIVERY_STEPS = ["配送会社", "お荷物", "確認"];
const WORK_STEPS = ["作業内容", "確認"];
const IDLE_MS = 90_000;

const emptyGuest = (): GuestDraft => ({
  visitorCompany: "",
  visitorName: "",
  hostId: "",
});

const emptyInterview = (): InterviewDraft => ({
  visitorName: "",
});

const emptyDelivery = (): DeliveryDraft => ({
  carrier: "",
  customCarrier: "",
  driverName: "",
  parcelCount: 1,
  hostId: "",
  purposeNote: "",
});

const emptyWork = (): WorkDraft => ({
  visitorName: "",
  visitorCompany: "",
  partySize: 1,
  hostId: "",
  purposeNote: "",
});

export function Kiosk({ initial }: { initial: Snapshot }) {
  const { snapshot, replace } = useReception(initial);
  const [screen, setScreen] = useState<Screen>({ name: "attract" });
  const [guest, setGuest] = useState<GuestDraft>(emptyGuest);
  const [interview, setInterview] = useState<InterviewDraft>(emptyInterview);
  const [delivery, setDelivery] = useState<DeliveryDraft>(emptyDelivery);
  const [work, setWork] = useState<WorkDraft>(emptyWork);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const [secondsLeft, setSecondsLeft] = useState(24);
  const [returnAt, setReturnAt] = useState<number | null>(null);

  const goAttract = useCallback(() => {
    setError("");
    setReturnAt(null);
    setGuest(emptyGuest());
    setInterview(emptyInterview());
    setDelivery(emptyDelivery());
    setWork(emptyWork());
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
  }, [screen, guest, interview, delivery, work, pending, goAttract]);

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
      return;
    }
    if (screen.name === "delivery") {
      if (screen.step === 0) setScreen({ name: "service" });
      else setScreen({ name: "delivery", step: (screen.step - 1) as 0 | 1 });
      return;
    }
    if (screen.name === "work") {
      if (screen.step === 0) setScreen({ name: "service" });
      else setScreen({ name: "work", step: 0 });
    }
  }

  if (screen.name === "attract") {
    return <AttractScreen now={snapshot.now} onStart={() => setScreen({ name: "home" })} />;
  }

  if (screen.name === "home") {
    return (
      <LobbyFrame now={snapshot.now} wide onBack={goAttract}>
        <div className="flex flex-1 flex-col">
          <p className="text-sm tracking-[0.18em] text-primary">
            {greeting(new Date(snapshot.now))}
          </p>
          <h1 className="mt-3 max-w-xl font-heading text-4xl leading-[1.15] tracking-tight sm:text-6xl">
            ご用件をお選びください
          </h1>
          <p className="mt-5 max-w-lg text-sm leading-relaxed text-muted-foreground sm:text-base">
            あてはまる受付をタッチしてください。記入が終わると、担当者の携帯へ連絡します。
          </p>

          <div className="mt-10 grid gap-3 sm:grid-cols-3 sm:gap-4">
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
              body="宅配のお荷物、または工事・作業での入館です。"
              onClick={() => {
                setDelivery(emptyDelivery());
                setWork(emptyWork());
                setError("");
                setScreen({ name: "service" });
              }}
            />
          </div>

          <footer className="mt-auto flex flex-col gap-3 pt-12 text-xs text-muted-foreground sm:flex-row sm:items-end sm:justify-between">
            <p>
              {company.address}
              <span className="px-1.5">·</span>
              受付 {company.hours}
            </p>
            <span className="flex gap-4">
              <Link
                href="/phone"
                className="w-fit text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
              >
                担当者の携帯
              </Link>
              <Link
                href="/desk"
                className="w-fit text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
              >
                受付スタッフ
              </Link>
            </span>
          </footer>
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
    return (
      <LobbyFrame
        now={snapshot.now}
        onBack={back}
        title="配送・工事"
        lede="あてはまる方をタッチしてください。"
      >
        <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
          <Choice
            icon={<Truck />}
            title="配送"
            body="宅配やお荷物の受け渡しです。受付カウンターへお渡しください。"
            onClick={() => {
              setDelivery(emptyDelivery());
              setError("");
              setScreen({ name: "delivery", step: 0 });
            }}
          />
          <Choice
            icon={<HardHat />}
            title="工事"
            body="点検、工事、作業での入館です。担当者の携帯へ連絡します。"
            onClick={() => {
              setWork(emptyWork());
              setError("");
              setScreen({ name: "work", step: 0 });
            }}
          />
        </div>
      </LobbyFrame>
    );
  }

  if (screen.name === "work") {
    const host = findHost(snapshot.hosts, work.hostId);
    return (
      <LobbyFrame
        now={snapshot.now}
        onBack={back}
        title={screen.step === 0 ? "工事・作業の受付" : "作業の確認"}
        lede={
          screen.step === 0
            ? "会社名と作業内容、ご担当者を入力してください。"
            : "この内容で担当者の携帯へ到着を連絡します。"
        }
        steps={WORK_STEPS}
        stepIndex={screen.step}
      >
        {screen.step === 0 ? (
          <form
            className="flex flex-col gap-5"
            onSubmit={(event) => {
              event.preventDefault();
              if (!work.visitorCompany.trim()) {
                setError("会社名を入力してください。");
                return;
              }
              if (!work.visitorName.trim()) {
                setError("お名前を入力してください。");
                return;
              }
              if (!work.purposeNote.trim()) {
                setError("作業内容を入力してください。");
                return;
              }
              if (!work.hostId) {
                setError("担当者を選択してください。");
                return;
              }
              setError("");
              setScreen({ name: "work", step: 1 });
            }}
          >
            <Field label="会社名" htmlFor="work-company" required>
              <Input
                id="work-company"
                autoFocus
                value={work.visitorCompany}
                onChange={(event) =>
                  setWork((draft) => ({
                    ...draft,
                    visitorCompany: event.target.value,
                  }))
                }
                placeholder="港設備工業"
                className="h-14 rounded-2xl text-base md:text-base"
                maxLength={60}
              />
            </Field>
            <Field label="お名前" htmlFor="work-name" required>
              <Input
                id="work-name"
                value={work.visitorName}
                onChange={(event) =>
                  setWork((draft) => ({
                    ...draft,
                    visitorName: event.target.value,
                  }))
                }
                placeholder="青木 剛"
                className="h-14 rounded-2xl text-base md:text-base"
                maxLength={40}
              />
            </Field>
            <Field label="人数">
              <CountStepper
                value={work.partySize}
                min={1}
                max={20}
                unit="名"
                onChange={(partySize) =>
                  setWork((draft) => ({ ...draft, partySize }))
                }
              />
            </Field>
            <Field label="作業内容" htmlFor="work-note" required>
              <Textarea
                id="work-note"
                value={work.purposeNote}
                onChange={(event) =>
                  setWork((draft) => ({
                    ...draft,
                    purposeNote: event.target.value,
                  }))
                }
                placeholder="8F 空調の定期点検"
                maxLength={120}
                className="min-h-24 rounded-2xl text-base md:text-base"
              />
            </Field>
            <Field label="ご担当">
              <HostPicker
                hosts={snapshot.hosts}
                value={work.hostId}
                onChange={(hostId) => setWork((draft) => ({ ...draft, hostId }))}
              />
            </Field>
            {error ? (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            ) : null}
            <Button type="submit" className="h-14 rounded-2xl text-base">
              確認へ進む
            </Button>
          </form>
        ) : (
          <>
            <Summary
              rows={[
                ["会社", work.visitorCompany.trim()],
                ["お名前", work.visitorName.trim()],
                ["人数", `${work.partySize}名`],
                ["作業内容", work.purposeNote.trim()],
                [
                  "担当",
                  host
                    ? `${host.name}（${host.department}・${host.floor}）`
                    : "—",
                ],
              ]}
            />
            <Button
              type="button"
              disabled={pending}
              className="mt-6 h-14 w-full rounded-2xl text-base"
              onClick={() => {
                startTransition(async () => {
                  const result = await workAction(work);
                  if (!result.ok) {
                    toast.error(result.message);
                    return;
                  }
                  replace(result.snapshot);
                  complete(result.visit);
                });
              }}
            >
              この内容で受付する
            </Button>
          </>
        )}
      </LobbyFrame>
    );
  }

  if (screen.name === "delivery") {
    const host = findHost(snapshot.hosts, delivery.hostId);
    const carrierName =
      delivery.carrier === "その他"
        ? delivery.customCarrier.trim()
        : delivery.carrier;
    return (
      <LobbyFrame
        now={snapshot.now}
        onBack={back}
        title={
          screen.step === 0
            ? "配送の受付"
            : screen.step === 1
              ? "お荷物の内容"
              : "配達の確認"
        }
        lede={
          screen.step === 0
            ? "配送会社を選んでください。"
            : screen.step === 2
              ? "宛先の担当者の携帯へ配達を連絡します。お荷物は受付カウンターへお渡しください。"
              : undefined
        }
        steps={DELIVERY_STEPS}
        stepIndex={screen.step}
      >
        {screen.step === 0 ? (
          <div className="grid gap-2 sm:grid-cols-2">
            {CARRIERS.map((carrier) => (
              <button
                key={carrier}
                type="button"
                onClick={() => {
                  setDelivery((draft) => ({ ...draft, carrier }));
                  setScreen({ name: "delivery", step: 1 });
                }}
                className={cn(
                  "rounded-2xl border bg-card px-4 py-5 text-left text-lg transition-colors hover:border-primary/40 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                  delivery.carrier === carrier
                    ? "border-primary bg-accent"
                    : "border-border",
                )}
              >
                {carrier}
              </button>
            ))}
          </div>
        ) : null}

        {screen.step === 1 ? (
          <form
            className="flex flex-col gap-5"
            onSubmit={(event) => {
              event.preventDefault();
              if (!carrierName) {
                setError("配送会社を入力してください。");
                return;
              }
              if (!delivery.hostId) {
                setError("宛先の担当者を選択してください。");
                return;
              }
              setError("");
              setScreen({ name: "delivery", step: 2 });
            }}
          >
            {delivery.carrier === "その他" ? (
              <Field label="配送会社名" htmlFor="carrier-name" required>
                <Input
                  id="carrier-name"
                  autoFocus
                  value={delivery.customCarrier}
                  onChange={(event) =>
                    setDelivery((draft) => ({
                      ...draft,
                      customCarrier: event.target.value,
                    }))
                  }
                  className="h-14 rounded-2xl text-base md:text-base"
                  maxLength={40}
                />
              </Field>
            ) : null}
            <Field label="ドライバー名" htmlFor="driver-name" hint="任意">
              <Input
                id="driver-name"
                value={delivery.driverName}
                onChange={(event) =>
                  setDelivery((draft) => ({
                    ...draft,
                    driverName: event.target.value,
                  }))
                }
                placeholder="未記入の場合は「配達担当」になります"
                className="h-14 rounded-2xl text-base md:text-base"
                maxLength={40}
              />
            </Field>
            <Field label="個数">
              <CountStepper
                value={delivery.parcelCount}
                min={1}
                max={30}
                unit="個"
                onChange={(parcelCount) =>
                  setDelivery((draft) => ({ ...draft, parcelCount }))
                }
              />
            </Field>
            <Field label="宛先">
              <HostPicker
                hosts={snapshot.hosts}
                value={delivery.hostId}
                onChange={(hostId) =>
                  setDelivery((draft) => ({ ...draft, hostId }))
                }
              />
            </Field>
            <Field label="置き場所など" htmlFor="delivery-note" hint="任意">
              <Textarea
                id="delivery-note"
                value={delivery.purposeNote}
                onChange={(event) =>
                  setDelivery((draft) => ({
                    ...draft,
                    purposeNote: event.target.value,
                  }))
                }
                placeholder="総務部宛、冷蔵"
                maxLength={120}
                className="min-h-20 rounded-2xl text-base md:text-base"
              />
            </Field>
            {error ? (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            ) : null}
            <Button type="submit" className="h-14 rounded-2xl text-base">
              確認へ進む
            </Button>
          </form>
        ) : null}

        {screen.step === 2 ? (
          <>
            <Summary
              rows={[
                ["配送会社", carrierName || "—"],
                ["お名前", delivery.driverName.trim() || "配達担当"],
                ["個数", `${delivery.parcelCount}個`],
                ["メモ", delivery.purposeNote.trim() || "—"],
                [
                  "宛先",
                  host
                    ? `${host.name}（${host.department}・${host.floor}）の携帯`
                    : "—",
                ],
              ]}
            />
            <Button
              type="button"
              disabled={pending}
              className="mt-6 h-14 w-full rounded-2xl text-base"
              onClick={() => {
                startTransition(async () => {
                  const result = await deliveryAction(delivery);
                  if (!result.ok) {
                    toast.error(result.message);
                    return;
                  }
                  replace(result.snapshot);
                  complete(result.visit);
                });
              }}
            >
              配達を記録する
            </Button>
          </>
        ) : null}
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
            ? `${who}へ工事の到着を連絡しました。受付で入館のご案内をお受けください。`
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
}: {
  icon: ReactNode;
  title: string;
  body: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex h-full flex-col items-start rounded-3xl border border-border bg-card px-5 py-5 text-left transition-colors hover:border-primary/50 hover:bg-accent/60 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 sm:min-h-52 sm:py-6"
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

function CountStepper({
  value,
  min,
  max,
  unit,
  onChange,
}: {
  value: number;
  min: number;
  max: number;
  unit: string;
  onChange: (value: number) => void;
}) {
  return (
    <div className="flex items-center gap-3">
      <Button
        type="button"
        variant="outline"
        className="size-12 rounded-2xl text-lg"
        disabled={value <= min}
        onClick={() => onChange(value - 1)}
        aria-label="減らす"
      >
        −
      </Button>
      <span className="min-w-16 text-center font-heading text-2xl tabular-nums">
        {value}
        <span className="ml-1 text-base text-muted-foreground">{unit}</span>
      </span>
      <Button
        type="button"
        variant="outline"
        className="size-12 rounded-2xl text-lg"
        disabled={value >= max}
        onClick={() => onChange(value + 1)}
        aria-label="増やす"
      >
        ＋
      </Button>
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
