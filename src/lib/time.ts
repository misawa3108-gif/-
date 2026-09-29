const TOKYO = "Asia/Tokyo";

export function tokyoDateKey(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TOKYO,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export function formatTokyoDate(date: Date): string {
  return new Intl.DateTimeFormat("ja-JP", {
    timeZone: TOKYO,
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
  }).format(date);
}

export function formatTokyoTime(iso: string): string {
  return new Intl.DateTimeFormat("ja-JP", {
    timeZone: TOKYO,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(new Date(iso));
}

export function formatTokyoClock(date: Date): string {
  return new Intl.DateTimeFormat("ja-JP", {
    timeZone: TOKYO,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(date);
}

export function tokyoHour(date: Date): number {
  return Number(
    new Intl.DateTimeFormat("en-US", {
      timeZone: TOKYO,
      hour: "numeric",
      hourCycle: "h23",
    }).format(date),
  );
}

export function greeting(date: Date): string {
  const hour = tokyoHour(date);
  if (hour < 11) return "おはようございます";
  if (hour < 17) return "こんにちは";
  return "こんばんは";
}

export function shiftIso(now: Date, minutes: number): string {
  return new Date(now.getTime() + minutes * 60_000).toISOString();
}

export function minutesSince(iso: string, now: Date): number {
  return Math.max(
    0,
    Math.round((now.getTime() - new Date(iso).getTime()) / 60_000),
  );
}

export function waitLabel(iso: string, now: Date): string {
  const minutes = minutesSince(iso, now);
  if (minutes < 1) return "たった今";
  return `${minutes}分`;
}
