import type { Host, Visit } from "@/lib/types";

export function formatMobile(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 11) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
  }
  return phone;
}

export function noticeBody(visit: Visit, host: Host): string {
  const ticket = `受付番号 ${visit.receptionNumber}`;
  if (visit.purpose === "interview") {
    return `【面接】${visit.visitorName}様が受付にお見えです。${ticket}。1階ロビーまでお迎えください。`;
  }
  if (visit.purpose === "delivery") {
    const who = visit.visitorCompany
      ? `${visit.visitorCompany}の${visit.visitorName}様`
      : `${visit.visitorName}様`;
    const count = visit.partySize > 0 ? `（${visit.partySize}個）` : "";
    return `【配送】${who}${count}がお見えです。${ticket}。1階受付までお越しください。`;
  }
  if (visit.purpose === "work") {
    const detail = visit.purposeNote ? `${visit.purposeNote}。` : "";
    return `【工事】${visit.visitorCompany}の${visit.visitorName}様がお見えです。${detail}${ticket}。1階受付までお越しください。`;
  }
  const organization = visit.visitorCompany || "個人";
  return `【来客】${organization}の${visit.visitorName}様がお見えです。アポの相手は${host.name}です。${ticket}。1階ロビーまでお迎えください。`;
}
