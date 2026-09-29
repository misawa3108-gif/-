import type { ContactChannel, Host } from "@/lib/types";

export function contactChannel(host: Host): ContactChannel {
  return host.contactChannel === "wowtalk" ? "wowtalk" : "mobile";
}

export function contactNoun(host: Host | null): string {
  if (!host) return "連絡先";
  return contactChannel(host) === "wowtalk" ? "WowTalk" : "携帯";
}

export function contactReady(host: Host): boolean {
  if (contactChannel(host) === "wowtalk") return true;
  return host.mobile.trim().length > 0;
}
