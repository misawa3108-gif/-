"use client";

import { useEffect, useState, useTransition, type ReactNode } from "react";
import Link from "next/link";
import { Briefcase, ChevronRight, Package, Search, UserRound } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { HostPicker } from "@/components/lobby/host-picker";
import { LobbyFrame } from "@/components/lobby/frame";
import { PassCard } from "@/components/lobby/pass-card";
import { useReception } from "@/components/reception/use-reception";
import {
  checkInAction,
  deliveryAction,
  walkInAction,
} from "@/lib/actions";
import { company } from "@/lib/company";
import { CARRIERS, PURPOSE_LABEL, VISITOR_PURPOSES } from "@/lib/labels";
import { formatTokyoTime, greeting } from "@/lib/time";
import type { Purpose, Snapshot, Visit } from "@/lib/types";
import {
  findHost,
  matchAppointments,
  normalizeQuery,
  partyPhrase,
  type AppointmentLane,
} from "@/lib/visits";
import { cn } from "@/lib/utils";

type Screen =
  | { name: "home" }
  | { name: "appointment"; lane: AppointmentLane }
  | { name: "appointment-confirm"; visitId: string; lane: AppointmentLane }
  | { name: "walkin"; lane: AppointmentLane; step: 0 | 1 | 2 | 3 }
  | { name: "delivery"; step: 0 | 1 | 2 }
  | { name: "done"; visit: Visit };

type WalkInDraft = {
  purpose: Purpose;
  hostId: string;
  visitorName: string;
  visitorCompany: string;
  partySize: number;
  purposeNote: string;
};

type DeliveryDraft = {
  carrier: string;
  customCarrier: string;
  driverName: string;
  parcelCount: number;
  hostId: string;
  purposeNote: string;
};

const WALK_STEPS = ["ご用件", "担当者", "お客様情報", "確認"];
const INTERVIEW_STEPS = ["面接官", "お名前", "確認"];
const DELIVERY_STEPS = ["配送会社", "お荷物", "確認"];

const emptyWalkIn = (): WalkInDraft => ({
  purpose: "meeting",
  hostId: "",
  visitorName: "",
  visitorCompany: "",
  partySize: 1,
  purposeNote: "",
});

const emptyDelivery = (): DeliveryDraft => ({
  carrier: "",
  customCarrier: "",
  driverName: "",
  parcelCount: 1,
  hostId: "",
  purposeNote: "",
});

export function Kiosk({ initial }: { initial: Snapshot }) {
  const { snapshot, replace } = useReception(initial);
  const [screen, setScreen] = useState<Screen>({ name: "home" });
  const [query, setQuery] = useState("");
  const [walkIn, setWalkIn] = useState<WalkInDraft>(emptyWalkIn);
  const [delivery, setDelivery] = useState<DeliveryDraft>(emptyDelivery);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const [secondsLeft, setSecondsLeft] = useState(24);
  const [returnAt, setReturnAt] = useState<number | null>(null);

  useEffect(() => {
    if (returnAt === null) return;
    const id = setInterval(() => {
      const left = Math.max(0, Math.ceil((returnAt - Date.now()) / 1000));
      setSecondsLeft(left);
      if (left <= 0) {
        setReturnAt(null);
        setQuery("");
        setError("");
        setScreen({ name: "home" });
      }
    }, 250);
    return () => clearInterval(id);
  }, [returnAt]);

  function goHome() {
    setError("");
    setQuery("");
    setReturnAt(null);
    setScreen({ name: "home" });
  }

  function openLane(lane: AppointmentLane) {
    setError("");
    setQuery("");
    setScreen({ name: "appointment", lane });
  }

  function startWalkIn(lane: AppointmentLane) {
    setError("");
    setWalkIn({
      ...emptyWalkIn(),
      purpose: lane === "interview" ? "interview" : "meeting",
    });
    setScreen({
      name: "walkin",
      lane,
      step: lane === "interview" ? 1 : 0,
    });
  }

  function complete(visit: Visit) {
    setSecondsLeft(24);
    setReturnAt(Date.now() + 24_000);
    setScreen({ name: "done", visit });
  }

  function back() {
    setError("");
    if (screen.name === "appointment" || screen.name === "done") {
      goHome();
      return;
    }
    if (screen.name === "appointment-confirm") {
      setScreen({ name: "appointment", lane: screen.lane });
      return;
    }
    if (screen.name === "walkin") {
      const first = screen.lane === "interview" ? 1 : 0;
      if (screen.step <= first) {
        setScreen({ name: "appointment", lane: screen.lane });
        return;
      }
      setScreen({
        name: "walkin",
        lane: screen.lane,
        step: (screen.step - 1) as 0 | 1 | 2,
      });
      return;
    }
    if (screen.name === "delivery") {
      if (screen.step === 0) goHome();
      else setScreen({ name: "delivery", step: (screen.step - 1) as 0 | 1 });
    }
  }

  const matches =
    screen.name === "appointment"
      ? matchAppointments(snapshot.visits, query, screen.lane)
      : [];
  const typed = normalizeQuery(query).length > 0;

  if (screen.name === "home") {
    return (
      <LobbyFrame now={snapshot.now} wide>
        <div className="flex flex-1 flex-col">
          <p className="text-sm tracking-[0.18em] text-primary">
            {company.building}
          </p>
          <h1 className="mt-3 max-w-xl font-heading text-4xl leading-[1.15] tracking-tight sm:text-6xl">
            {greeting(new Date(snapshot.now))}
            <span className="mt-1 block">ご来訪ありがとうございます</span>
          </h1>
          <p className="mt-5 max-w-lg text-sm leading-relaxed text-muted-foreground sm:text-base">
            受付番号をお渡しし、担当者へお知らせします。あてはまる受付を選んでください。
          </p>

          <div className="mt-10 grid gap-3 sm:grid-cols-3 sm:gap-4">
            <Choice
              icon={<UserRound />}
              title="来客用"
              body="打ち合わせ、ご挨拶、その他のご訪問です。"
              onClick={() => openLane("visitor")}
            />
            <Choice
              icon={<Briefcase />}
              title="面接用"
              body="採用面接のご予約呼び出しと受付です。"
              onClick={() => openLane("interview")}
            />
            <Choice
              icon={<Package />}
              title="配送関係用"
              body="宅配や荷物の宛先を記録します。"
              onClick={() => {
                setDelivery(emptyDelivery());
                setError("");
                setScreen({ name: "delivery", step: 0 });
              }}
            />
          </div>

          <footer className="mt-auto flex flex-col gap-3 pt-12 text-xs text-muted-foreground sm:flex-row sm:items-end sm:justify-between">
            <p>
              {company.address}
              <span className="px-1.5">·</span>
              受付 {company.hours}
            </p>
            <Link
              href="/desk"
              className="w-fit text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
            >
              受付スタッフ
            </Link>
          </footer>
        </div>
      </LobbyFrame>
    );
  }

  if (screen.name === "appointment") {
    const interview = screen.lane === "interview";
    return (
      <LobbyFrame
        now={snapshot.now}
        onBack={back}
        title={interview ? "面接のご予約" : "来客のご予約"}
        lede={
          interview
            ? "予約時のお名前を入力してください。一覧には出さないようにしています。"
            : "予約時のお名前か会社名を入力してください。一覧には出さないようにしています。"
        }
      >
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-muted-foreground" />
          <Input
            autoFocus
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={interview ? "木村" : "山田、または会社名"}
            aria-label={interview ? "面接予約を探す" : "来客予約を探す"}
            className="h-14 rounded-2xl pl-12 text-base md:text-base"
          />
        </div>
        <div className="mt-4">
          <Button
            type="button"
            variant="outline"
            className="h-11 rounded-full px-5"
            onClick={() => startWalkIn(screen.lane)}
          >
            {interview ? "予約がない方はこちら" : "予約がない来客の方はこちら"}
          </Button>
        </div>
        <div className="mt-5">
          {!typed ? (
            <p className="rounded-2xl border border-dashed px-4 py-12 text-center text-sm text-muted-foreground">
              {interview
                ? "面接予約のお名前を入力すると、本日の予定が表示されます。"
                : "来客予約のお名前を入力すると、本日の予定が表示されます。"}
            </p>
          ) : matches.length === 0 ? (
            <div className="rounded-2xl border border-dashed px-4 py-10 text-center">
              <p className="text-sm text-muted-foreground">
                「{query.trim()}」の{interview ? "面接" : "来客"}予約は見当たりません。
              </p>
              <Button
                type="button"
                variant="outline"
                className="mt-4 h-11 rounded-full px-5"
                onClick={() => startWalkIn(screen.lane)}
              >
                {interview ? "予約なしで面接受付する" : "予約なしで来客受付する"}
              </Button>
            </div>
          ) : (
            <ul className="flex flex-col gap-2">
              {matches.map((visit) => {
                const host = findHost(snapshot.hosts, visit.hostId);
                return (
                  <li key={visit.id}>
                    <button
                      type="button"
                      onClick={() =>
                        setScreen({
                          name: "appointment-confirm",
                          visitId: visit.id,
                          lane: screen.lane,
                        })
                      }
                      className="flex w-full items-center justify-between gap-3 rounded-2xl border bg-card px-4 py-4 text-left transition-colors hover:border-primary/40 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                    >
                      <span>
                        <span className="block text-lg font-medium">
                          {visit.visitorName}
                        </span>
                        <span className="mt-1 block text-sm text-muted-foreground">
                          {visit.visitorCompany || "個人"}
                          <span className="px-1.5">·</span>
                          {host ? host.name : "担当未定"}
                          <span className="px-1.5">·</span>
                          {visit.scheduledAt
                            ? formatTokyoTime(visit.scheduledAt)
                            : "時間未定"}
                        </span>
                      </span>
                      <ChevronRight className="size-5 shrink-0 text-muted-foreground" />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </LobbyFrame>
    );
  }

  if (screen.name === "appointment-confirm") {
    const visit = snapshot.visits.find((item) => item.id === screen.visitId);
    const host = visit ? findHost(snapshot.hosts, visit.hostId) : null;
    return (
      <LobbyFrame
        now={snapshot.now}
        onBack={back}
        title="こちらのご予約ですか"
        lede={
          screen.lane === "interview"
            ? "内容を確認して受付してください。面接官へ到着をお知らせします。"
            : "内容を確認して受付してください。担当者へ来客をお知らせします。"
        }
      >
        {!visit || visit.status !== "expected" ? (
          <div className="rounded-2xl border border-dashed px-4 py-10 text-center text-sm text-muted-foreground">
            このご予約はすでに受付済みか、取り消されています。
            <div>
              <Button
                type="button"
                variant="outline"
                className="mt-4 h-11 rounded-full px-5"
                onClick={() =>
                  setScreen({ name: "appointment", lane: screen.lane })
                }
              >
                検索に戻る
              </Button>
            </div>
          </div>
        ) : (
          <>
            <Summary
              rows={[
                ["お名前", visit.visitorName],
                ["会社", visit.visitorCompany || "個人"],
                ["人数", partyPhrase(visit)],
                ["ご用件", PURPOSE_LABEL[visit.purpose]],
                ["内容", visit.purposeNote || "—"],
                [
                  "予定",
                  visit.scheduledAt ? formatTokyoTime(visit.scheduledAt) : "—",
                ],
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
                  const result = await checkInAction(visit.id);
                  if (!result.ok) {
                    toast.error(result.message);
                    return;
                  }
                  replace(result.snapshot);
                  complete(result.visit);
                });
              }}
            >
              受付する
            </Button>
          </>
        )}
      </LobbyFrame>
    );
  }

  if (screen.name === "walkin") {
    const host = findHost(snapshot.hosts, walkIn.hostId);
    const interview = screen.lane === "interview";
    return (
      <LobbyFrame
        now={snapshot.now}
        onBack={back}
        title={
          screen.step === 0
            ? "ご用件を教えてください"
            : screen.step === 1
              ? interview
                ? "面接官を選んでください"
                : "どちらにご用ですか"
              : screen.step === 2
                ? interview
                  ? "お名前を教えてください"
                  : "お客様のお名前"
                : interview
                  ? "面接の受付内容"
                  : "受付内容の確認"
        }
        lede={
          screen.step === 3
            ? interview
              ? "この内容で面接官へ到着をお知らせします。"
              : "この内容で担当者へお知らせします。"
            : undefined
        }
        steps={interview ? INTERVIEW_STEPS : WALK_STEPS}
        stepIndex={interview ? screen.step - 1 : screen.step}
      >
        {screen.step === 0 ? (
          <div className="grid gap-2 sm:grid-cols-2">
            {VISITOR_PURPOSES.map((purpose) => (
              <button
                key={purpose}
                type="button"
                aria-pressed={walkIn.purpose === purpose}
                onClick={() => {
                  setWalkIn((draft) => ({ ...draft, purpose }));
                  setScreen({ name: "walkin", lane: screen.lane, step: 1 });
                }}
                className={cn(
                  "rounded-2xl border bg-card px-4 py-5 text-left text-lg transition-colors hover:border-primary/40 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                  walkIn.purpose === purpose
                    ? "border-primary bg-accent"
                    : "border-border",
                )}
              >
                {PURPOSE_LABEL[purpose]}
              </button>
            ))}
          </div>
        ) : null}

        {screen.step === 1 ? (
          <>
            <HostPicker
              hosts={snapshot.hosts}
              value={walkIn.hostId}
              onChange={(hostId) => setWalkIn((draft) => ({ ...draft, hostId }))}
            />
            <NextButton
              disabled={!walkIn.hostId}
              onClick={() =>
                setScreen({ name: "walkin", lane: screen.lane, step: 2 })
              }
            />
          </>
        ) : null}

        {screen.step === 2 ? (
          <form
            className="flex flex-col gap-5"
            onSubmit={(event) => {
              event.preventDefault();
              const name = walkIn.visitorName.trim();
              if (!name) {
                setError("お名前を入力してください。");
                return;
              }
              setError("");
              setScreen({ name: "walkin", lane: screen.lane, step: 3 });
            }}
          >
            <Field label="お名前" htmlFor="visitor-name" required>
              <Input
                id="visitor-name"
                autoFocus
                value={walkIn.visitorName}
                onChange={(event) =>
                  setWalkIn((draft) => ({
                    ...draft,
                    visitorName: event.target.value,
                  }))
                }
                placeholder={interview ? "木村 咲" : "山田 太郎"}
                className="h-14 rounded-2xl text-base md:text-base"
                maxLength={40}
              />
            </Field>
            <Field
              label={interview ? "所属" : "会社名"}
              htmlFor="visitor-company"
              hint="個人の方は空欄で構いません"
            >
              <Input
                id="visitor-company"
                value={walkIn.visitorCompany}
                onChange={(event) =>
                  setWalkIn((draft) => ({
                    ...draft,
                    visitorCompany: event.target.value,
                  }))
                }
                placeholder={interview ? "空欄でも構いません" : "株式会社ノースブリッジ"}
                className="h-14 rounded-2xl text-base md:text-base"
                maxLength={60}
              />
            </Field>
            <Field label="人数">
              <CountStepper
                value={walkIn.partySize}
                min={1}
                max={20}
                unit="名"
                onChange={(partySize) =>
                  setWalkIn((draft) => ({ ...draft, partySize }))
                }
              />
            </Field>
            <Field label="ひとこと" htmlFor="visitor-note" hint="任意">
              <Textarea
                id="visitor-note"
                value={walkIn.purposeNote}
                onChange={(event) =>
                  setWalkIn((draft) => ({
                    ...draft,
                    purposeNote: event.target.value,
                  }))
                }
                placeholder={
                  interview ? "プロダクトデザイナー一次面接" : "四半期の進捗確認"
                }
                maxLength={120}
                className="min-h-24 rounded-2xl text-base md:text-base"
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

        {screen.step === 3 ? (
          <>
            <Summary
              rows={[
                ["お名前", walkIn.visitorName.trim()],
                [
                  interview ? "所属" : "会社",
                  walkIn.visitorCompany.trim() || "個人",
                ],
                ["人数", `${walkIn.partySize}名`],
                ["ご用件", PURPOSE_LABEL[walkIn.purpose]],
                ["内容", walkIn.purposeNote.trim() || "—"],
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
                  const result = await walkInAction({
                    visitorName: walkIn.visitorName,
                    visitorCompany: walkIn.visitorCompany,
                    partySize: walkIn.partySize,
                    purpose: walkIn.purpose,
                    purposeNote: walkIn.purposeNote,
                    hostId: walkIn.hostId,
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
              この内容で受付する
            </Button>
          </>
        ) : null}
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
            ? "配送関係の受付"
            : screen.step === 1
              ? "お荷物の内容"
              : "配達の確認"
        }
        lede={
          screen.step === 0
            ? "配送会社を選んでください。"
            : screen.step === 2
              ? "宛先の担当者へ配達をお知らせします。お荷物は受付カウンターへお渡しください。"
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
                    ? `${host.name}（${host.department}・${host.floor}・内線 ${host.extension}）`
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
  const deliveryDone = screen.visit.purpose === "delivery";
  const interviewDone = screen.visit.purpose === "interview";
  const who = host
    ? `${host.name}（${host.department}・${host.floor}）`
    : "担当者";
  return (
    <LobbyFrame now={snapshot.now} onBack={goHome} title="受付が完了しました">
      <PassCard visit={screen.visit} host={host} />
      <p className="mt-6 text-sm leading-relaxed text-muted-foreground sm:text-base">
        {deliveryDone
          ? `${host ? `${host.name}（内線 ${host.extension}）` : "担当者"}へ配達をお知らせしました。お荷物は受付カウンターへお渡しください。`
          : interviewDone
            ? `${who}へ面接の到着をお知らせしました。ロビーで少々お待ちください。`
            : `${who}へ来客をお知らせしました。ロビーで少々お待ちください。`}
      </p>
      <Button
        type="button"
        variant="outline"
        className="mt-6 h-12 rounded-2xl"
        onClick={goHome}
      >
        トップへ戻る（{secondsLeft}秒）
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

function NextButton({
  disabled,
  onClick,
}: {
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <Button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="mt-6 h-14 rounded-2xl text-base"
    >
      次へ
    </Button>
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
