"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { contactChannel } from "@/lib/contacts";
import type { ContactChannel, Host } from "@/lib/types";
import { cn } from "@/lib/utils";

export function ContactSettings({
  hosts,
  pendingId,
  onSave,
}: {
  hosts: Host[];
  pendingId: string | null;
  onSave: (host: Host, channel: ContactChannel, mobile: string, wowtalkId: string) => void;
}) {
  return (
    <section className="rounded-3xl border bg-card px-4 py-5 sm:px-6">
      <div className="max-w-2xl">
        <h2 className="font-heading text-2xl">担当者の連絡先</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          連絡先はあとから変更できます。WowTalkにする場合、IDは空欄のまま保存し、決まり次第入力してください。
        </p>
      </div>
      <ul className="mt-5 flex flex-col gap-3">
        {hosts.map((host) => (
          <ContactRow
            key={`${host.id}:${host.contactChannel}:${host.mobile}:${host.wowtalkId}`}
            host={host}
            pending={pendingId === host.id}
            onSave={onSave}
          />
        ))}
      </ul>
    </section>
  );
}

function ContactRow({
  host,
  pending,
  onSave,
}: {
  host: Host;
  pending: boolean;
  onSave: (host: Host, channel: ContactChannel, mobile: string, wowtalkId: string) => void;
}) {
  const [channel, setChannel] = useState<ContactChannel>(contactChannel(host));
  const [mobile, setMobile] = useState(host.mobile);
  const [wowtalkId, setWowtalkId] = useState(host.wowtalkId);
  const wowtalk = channel === "wowtalk";

  return (
    <li className="rounded-2xl border px-3 py-3 sm:px-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <p className="font-medium">{host.name}</p>
          <p className="text-xs text-muted-foreground">
            {host.department} · {host.title}
          </p>
        </div>
        <form
          className="flex flex-col gap-2 sm:flex-row sm:items-end"
          onSubmit={(event) => {
            event.preventDefault();
            onSave(host, channel, mobile, wowtalkId);
          }}
        >
          <div className="flex rounded-full border p-1">
            <ChannelButton
              pressed={!wowtalk}
              onClick={() => setChannel("mobile")}
            >
              携帯
            </ChannelButton>
            <ChannelButton
              pressed={wowtalk}
              onClick={() => setChannel("wowtalk")}
            >
              WowTalk
            </ChannelButton>
          </div>
          <label className="flex min-w-0 flex-col gap-1 sm:w-56">
            <span className="text-xs text-muted-foreground">
              {wowtalk ? "WowTalk ID" : "携帯番号"}
            </span>
            <Input
              value={wowtalk ? wowtalkId : mobile}
              onChange={(event) =>
                wowtalk
                  ? setWowtalkId(event.target.value)
                  : setMobile(event.target.value)
              }
              placeholder={wowtalk ? "あとから設定" : "090-0000-0000"}
              maxLength={wowtalk ? 40 : 20}
              className="h-10 rounded-xl"
              aria-label={wowtalk ? `${host.name}のWowTalk ID` : `${host.name}の携帯番号`}
            />
          </label>
          <Button
            type="submit"
            variant="outline"
            disabled={pending}
            className="h-10 rounded-full px-4"
          >
            {pending ? "保存しています…" : "保存"}
          </Button>
        </form>
      </div>
      {wowtalk && !wowtalkId.trim() ? (
        <p className="mt-2 text-xs text-muted-foreground">
          WowTalk IDはあとから設定できます。未入力でも、受付の連絡はこの担当者へ届きます。
        </p>
      ) : null}
    </li>
  );
}

function ChannelButton({
  pressed,
  onClick,
  children,
}: {
  pressed: boolean;
  onClick: () => void;
  children: string;
}) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      className={cn(
        "h-8 rounded-full px-3 text-sm transition-colors",
        pressed
          ? "bg-primary text-primary-foreground"
          : "text-muted-foreground hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}
