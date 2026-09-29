import fs from "node:fs";
import path from "node:path";
import { seedDatabase } from "@/lib/seed";
import { tokyoDateKey } from "@/lib/time";
import type {
  Database,
  DeliveryInput,
  Host,
  Purpose,
  Snapshot,
  Visit,
  VisitStatus,
  WalkInInput,
  WorkInput,
} from "@/lib/types";
import { VISIT_STATUSES } from "@/lib/types";
import { sortVisits } from "@/lib/visits";

const WALK_IN_PURPOSES: Purpose[] = ["meeting", "interview", "sales", "other"];

let memory: Database | null = null;
let chain: Promise<unknown> = Promise.resolve();

function dataFile(): string {
  if (process.env.VERCEL) return path.join("/tmp", "lightpass-reception.json");
  return path.join(process.cwd(), "data", "reception.json");
}

function withLock<T>(fn: () => T): Promise<T> {
  const run = chain.then(() => fn());
  chain = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

function isDatabase(value: unknown): value is Database {
  if (!value || typeof value !== "object") return false;
  const record = value as Database;
  return (
    Array.isArray(record.hosts) &&
    Array.isArray(record.visits) &&
    typeof record.seq === "number" &&
    typeof record.seqDate === "string"
  );
}

function save(db: Database) {
  const file = dataFile();
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const tmp = `${file}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(db, null, 2));
  fs.renameSync(tmp, file);
  memory = db;
}

function load(): Database {
  try {
    const parsed: unknown = JSON.parse(fs.readFileSync(dataFile(), "utf8"));
    if (!isDatabase(parsed)) throw new Error("invalid reception data");
    memory = parsed;
    return parsed;
  } catch {
    if (memory) return memory;
    const seeded = seedDatabase();
    memory = seeded;
    try {
      save(seeded);
    } catch {
      memory = seeded;
    }
    return seeded;
  }
}

function visible(visit: Visit, now: Date): boolean {
  if (visit.status === "waiting" || visit.status === "meeting") return true;
  const key = tokyoDateKey(now);
  return [visit.scheduledAt, visit.checkedInAt, visit.createdAt, visit.leftAt].some(
    (stamp) => stamp !== null && tokyoDateKey(new Date(stamp)) === key,
  );
}

function toSnapshot(db: Database): Snapshot {
  const now = new Date();
  return {
    hosts: db.hosts.map((host) => ({ ...host })),
    visits: sortVisits(
      db.visits.filter((visit) => visible(visit, now)).map((visit) => ({ ...visit })),
    ),
    now: now.toISOString(),
  };
}

function clean(value: string, max: number): string {
  return value.normalize("NFKC").trim().replace(/\s+/g, " ").slice(0, max);
}

function partySize(value: number, max = 20): number | null {
  if (!Number.isFinite(value)) return null;
  const size = Math.round(value);
  if (size < 1 || size > max) return null;
  return size;
}

function nextNumber(db: Database, now: Date): string {
  const day = tokyoDateKey(now);
  if (db.seqDate !== day) {
    db.seqDate = day;
    db.seq = 0;
  }
  db.seq += 1;
  return `A-${String(db.seq).padStart(3, "0")}`;
}

function requireHost(hosts: Host[], hostId: string): Host | null {
  return hosts.find((host) => host.id === hostId) ?? null;
}

function applyStatus(visit: Visit, status: VisitStatus, nowIso: string) {
  visit.status = status;
  if (status === "waiting") {
    visit.checkedInAt ??= nowIso;
    visit.notifiedAt ??= nowIso;
    visit.leftAt = null;
  }
  if (status === "meeting") {
    visit.checkedInAt ??= nowIso;
    visit.meetingStartedAt = nowIso;
    visit.leftAt = null;
  }
  if (status === "left") {
    visit.leftAt = nowIso;
  }
  if (status === "expected") {
    visit.checkedInAt = null;
    visit.meetingStartedAt = null;
    visit.leftAt = null;
    visit.notifiedAt = null;
  }
}

function blankVisit(db: Database, now: Date): Visit {
  const nowIso = now.toISOString();
  return {
    id: crypto.randomUUID(),
    receptionNumber: nextNumber(db, now),
    visitorName: "",
    visitorCompany: "",
    partySize: 1,
    purpose: "meeting",
    purposeNote: "",
    hostId: null,
    status: "waiting",
    hasAppointment: false,
    carrier: null,
    scheduledAt: null,
    checkedInAt: nowIso,
    meetingStartedAt: null,
    leftAt: null,
    notifiedAt: nowIso,
    createdAt: nowIso,
  };
}

export function readSnapshot(): Promise<Snapshot> {
  return withLock(() => toSnapshot(load()));
}

export function resetDemo(): Promise<Snapshot> {
  return withLock(() => {
    const seeded = seedDatabase();
    try {
      save(seeded);
    } catch {
      memory = seeded;
    }
    return toSnapshot(seeded);
  });
}

export function checkInAppointment(
  visitId: string,
): Promise<{ snapshot: Snapshot; visit: Visit } | { message: string }> {
  return withLock(() => {
    const db = load();
    const visit = db.visits.find((item) => item.id === visitId);
    if (!visit || !visit.hasAppointment) {
      return { message: "ご予約が見つかりません。受付カウンターへお声がけください。" };
    }
    if (visit.status === "cancelled") {
      return { message: "このご予約は取り消されています。" };
    }
    if (visit.status !== "expected") {
      return { message: "このご予約はすでに受付済みです。" };
    }
    applyStatus(visit, "waiting", new Date().toISOString());
    try {
      save(db);
    } catch {
      memory = db;
    }
    return { snapshot: toSnapshot(db), visit: { ...visit } };
  });
}

export function createWalkIn(
  input: WalkInInput,
): Promise<{ snapshot: Snapshot; visit: Visit } | { message: string }> {
  return withLock(() => {
    const name = clean(input.visitorName, 40);
    const company = clean(input.visitorCompany, 60);
    const note = clean(input.purposeNote, 120);
    const size = partySize(input.partySize);
    if (!name) return { message: "お名前を入力してください。" };
    if (!size) return { message: "人数は1〜20名で指定してください。" };
    if (!WALK_IN_PURPOSES.includes(input.purpose)) {
      return { message: "ご用件を選択してください。" };
    }
    const db = load();
    if (!requireHost(db.hosts, input.hostId)) {
      return { message: "担当者を選択してください。" };
    }
    const now = new Date();
    const visit = blankVisit(db, now);
    visit.visitorName = name;
    visit.visitorCompany = company;
    visit.partySize = size;
    visit.purpose = input.purpose;
    visit.purposeNote = note;
    visit.hostId = input.hostId;
    db.visits.push(visit);
    try {
      save(db);
    } catch {
      memory = db;
    }
    return { snapshot: toSnapshot(db), visit: { ...visit } };
  });
}

export function createDelivery(
  input: DeliveryInput,
): Promise<{ snapshot: Snapshot; visit: Visit } | { message: string }> {
  return withLock(() => {
    const carrierName =
      input.carrier === "その他"
        ? clean(input.customCarrier, 40)
        : clean(input.carrier, 40);
    const driver = clean(input.driverName, 40);
    const note = clean(input.purposeNote, 120);
    const parcels = partySize(input.parcelCount, 30);
    if (!carrierName) return { message: "配送会社を入力してください。" };
    if (!parcels) return { message: "個数は1〜30で指定してください。" };
    const db = load();
    if (!requireHost(db.hosts, input.hostId)) {
      return { message: "宛先の担当者を選択してください。" };
    }
    const now = new Date();
    const visit = blankVisit(db, now);
    visit.visitorName = driver || "配達担当";
    visit.visitorCompany = carrierName;
    visit.partySize = parcels;
    visit.purpose = "delivery";
    visit.purposeNote = note;
    visit.hostId = input.hostId;
    visit.carrier = carrierName;
    db.visits.push(visit);
    try {
      save(db);
    } catch {
      memory = db;
    }
    return { snapshot: toSnapshot(db), visit: { ...visit } };
  });
}

export function createWork(
  input: WorkInput,
): Promise<{ snapshot: Snapshot; visit: Visit } | { message: string }> {
  return withLock(() => {
    const name = clean(input.visitorName, 40);
    const company = clean(input.visitorCompany, 60);
    const note = clean(input.purposeNote, 120);
    const size = partySize(input.partySize);
    if (!company) return { message: "会社名を入力してください。" };
    if (!name) return { message: "お名前を入力してください。" };
    if (!note) return { message: "作業内容を入力してください。" };
    if (!size) return { message: "人数は1〜20名で指定してください。" };
    const db = load();
    if (!requireHost(db.hosts, input.hostId)) {
      return { message: "担当者を選択してください。" };
    }
    const now = new Date();
    const visit = blankVisit(db, now);
    visit.visitorName = name;
    visit.visitorCompany = company;
    visit.partySize = size;
    visit.purpose = "work";
    visit.purposeNote = note;
    visit.hostId = input.hostId;
    db.visits.push(visit);
    try {
      save(db);
    } catch {
      memory = db;
    }
    return { snapshot: toSnapshot(db), visit: { ...visit } };
  });
}

export function updateVisitStatus(
  visitId: string,
  status: VisitStatus,
): Promise<{ snapshot: Snapshot; visit: Visit } | { message: string }> {
  return withLock(() => {
    if (!VISIT_STATUSES.includes(status)) {
      return { message: "状態を変更できませんでした。" };
    }
    const db = load();
    const visit = db.visits.find((item) => item.id === visitId);
    if (!visit) return { message: "来訪記録が見つかりません。" };
    applyStatus(visit, status, new Date().toISOString());
    try {
      save(db);
    } catch {
      memory = db;
    }
    return { snapshot: toSnapshot(db), visit: { ...visit } };
  });
}

export function notifyHost(
  visitId: string,
): Promise<{ snapshot: Snapshot; visit: Visit } | { message: string }> {
  return withLock(() => {
    const db = load();
    const visit = db.visits.find((item) => item.id === visitId);
    if (!visit) return { message: "来訪記録が見つかりません。" };
    if (!visit.hostId) return { message: "担当者が設定されていません。" };
    if (visit.status === "cancelled" || visit.status === "left") {
      return { message: "この来訪には通知できません。" };
    }
    visit.notifiedAt = new Date().toISOString();
    try {
      save(db);
    } catch {
      memory = db;
    }
    return { snapshot: toSnapshot(db), visit: { ...visit } };
  });
}
