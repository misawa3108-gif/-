"use client";

import Link from "next/link";
import { Settings } from "lucide-react";
import { LobbyFooter, LobbyHeader, lobbyWash } from "@/components/lobby/chrome";
import { Mark } from "@/components/reception/mark";
import { company } from "@/lib/company";

export function AttractScreen({
  now,
  onStart,
}: {
  now: string;
  onStart: () => void;
}) {
  return (
    <div className="relative min-h-dvh">
      <button
        type="button"
        onClick={onStart}
        className="group relative flex min-h-dvh w-full cursor-pointer flex-col text-left focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/40 focus-visible:ring-inset"
      >
        <span className="sr-only">画面にタッチして受付を始める</span>
        <div aria-hidden="true" className={lobbyWash} />
        <div className="relative flex min-h-dvh w-full flex-col px-6 py-6 sm:px-10 sm:py-8">
          <LobbyHeader now={now} />

          <div className="flex flex-1 flex-col items-center justify-center px-2 py-10 text-center">
            <Mark className="size-28 sm:size-36" />
            <p className="mt-6 text-xs tracking-[0.32em] text-primary sm:text-sm">
              {company.nameEn.toUpperCase()}
            </p>
            <h1 className="mt-5 font-heading text-5xl leading-none tracking-tight sm:text-7xl">
              ようこそ
            </h1>
            <p className="mt-5 max-w-md text-sm leading-relaxed text-muted-foreground sm:text-base">
              {company.name}へお越しくださいました。
              <span className="mt-1 block">受付を始めるには、画面にタッチしてください。</span>
            </p>

            <span className="relative mt-12 flex size-24 items-center justify-center sm:size-28">
              <span
                aria-hidden="true"
                className="reception-pulse absolute inset-0 rounded-full bg-primary/20"
              />
              <span
                aria-hidden="true"
                className="absolute inset-3 rounded-full border border-primary/35 bg-card/80 shadow-[0_16px_40px_-24px_oklch(0.55_0.1_80)] transition-transform duration-300 group-hover:scale-105 group-active:scale-95"
              />
              <span className="relative font-heading text-sm tracking-wide text-primary">
                タッチ
              </span>
            </span>
            <p className="mt-8 text-base font-medium tracking-wide sm:text-lg">
              画面にタッチしてください
            </p>
          </div>

          <LobbyFooter className="px-12" />
        </div>
      </button>
      <Link
        href="/desk"
        aria-label="受付デスク"
        className="absolute right-4 bottom-4 z-10 flex size-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-card hover:text-foreground focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 sm:right-6 sm:bottom-6"
      >
        <Settings className="size-4" />
      </Link>
    </div>
  );
}
