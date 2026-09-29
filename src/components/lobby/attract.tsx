"use client";

import { LobbyFooter, LobbyHeader, lobbyWash } from "@/components/lobby/chrome";
import { company } from "@/lib/company";

export function AttractScreen({
  now,
  onStart,
}: {
  now: string;
  onStart: () => void;
}) {
  return (
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
          <p className="text-xs tracking-[0.32em] text-primary sm:text-sm">
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
              className="absolute inset-3 rounded-full border border-primary/25 bg-card/80 shadow-[0_16px_40px_-24px_oklch(0.35_0.04_168)] transition-transform duration-300 group-hover:scale-105 group-active:scale-95"
            />
            <span className="relative font-heading text-sm tracking-wide text-primary">
              タッチ
            </span>
          </span>
          <p className="mt-8 text-base font-medium tracking-wide sm:text-lg">
            画面にタッチしてください
          </p>
        </div>

        <LobbyFooter />
      </div>
    </button>
  );
}
