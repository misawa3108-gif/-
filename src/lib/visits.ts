import type { Host, Visit, VisitStatus } from "@/lib/types";

const STATUS_RANK: Record<VisitStatus, number> = {
  waiting: 0,
  meeting: 1,
  expected: 2,
  left: 3,
  cancelled: 4,
};

export function normalizeQuery(value: string): string {
  return value.normalize("NFKC").replace(/[\s　]+/g, "").toLowerCase();
}

export function findHost(hosts: Host[], id: string | null): Host | null {
  if (!id) return null;
  return hosts.find((host) => host.id === id) ?? null;
}

export function sortVisits(visits: Visit[]): Visit[] {
  return [...visits].sort((a, b) => {
    const byStatus = STATUS_RANK[a.status] - STATUS_RANK[b.status];
    if (byStatus !== 0) return byStatus;
    const aTime = a.scheduledAt ?? a.checkedInAt ?? a.createdAt;
    const bTime = b.scheduledAt ?? b.checkedInAt ?? b.createdAt;
    return aTime.localeCompare(bTime);
  });
}

export function matchAppointments(visits: Visit[], query: string): Visit[] {
  const expected = visits.filter(
    (visit) => visit.status === "expected" && visit.hasAppointment,
  );
  const q = normalizeQuery(query);
  if (!q) return sortVisits(expected);
  return expected.filter((visit) => {
    const haystack = normalizeQuery(
      `${visit.visitorName}${visit.visitorCompany}${visit.receptionNumber}`,
    );
    return haystack.includes(q);
  });
}

export function isLate(visit: Visit, now: Date): boolean {
  if (visit.status !== "expected" || !visit.scheduledAt) return false;
  return new Date(visit.scheduledAt).getTime() < now.getTime() - 10 * 60_000;
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .map((part) => part.charAt(0))
    .join("")
    .slice(0, 2);
}

export function partyPhrase(visit: Visit): string {
  if (visit.purpose === "delivery") return `${visit.partySize}個`;
  return `${visit.partySize}名`;
}
