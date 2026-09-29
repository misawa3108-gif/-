export const PURPOSES = [
  "meeting",
  "interview",
  "sales",
  "delivery",
  "work",
  "other",
] as const;

export type Purpose = (typeof PURPOSES)[number];

export const VISIT_STATUSES = [
  "expected",
  "waiting",
  "meeting",
  "left",
  "cancelled",
] as const;

export type VisitStatus = (typeof VISIT_STATUSES)[number];

export type Host = {
  id: string;
  name: string;
  department: string;
  title: string;
  extension: string;
  floor: string;
};

export type Visit = {
  id: string;
  receptionNumber: string;
  visitorName: string;
  visitorCompany: string;
  partySize: number;
  purpose: Purpose;
  purposeNote: string;
  hostId: string | null;
  status: VisitStatus;
  hasAppointment: boolean;
  carrier: string | null;
  scheduledAt: string | null;
  checkedInAt: string | null;
  meetingStartedAt: string | null;
  leftAt: string | null;
  notifiedAt: string | null;
  createdAt: string;
};

export type Snapshot = {
  hosts: Host[];
  visits: Visit[];
  now: string;
};

export type ActionResult =
  | { ok: true; snapshot: Snapshot; visit: Visit }
  | { ok: false; message: string };

export type WalkInInput = {
  visitorName: string;
  visitorCompany: string;
  partySize: number;
  purpose: Purpose;
  purposeNote: string;
  hostId: string;
};

export type DeliveryInput = {
  carrier: string;
  customCarrier: string;
  driverName: string;
  parcelCount: number;
  hostId: string;
  purposeNote: string;
};

export type WorkInput = {
  visitorName: string;
  visitorCompany: string;
  partySize: number;
  purposeNote: string;
  hostId: string;
};

export type Database = {
  hosts: Host[];
  visits: Visit[];
  seq: number;
  seqDate: string;
};
