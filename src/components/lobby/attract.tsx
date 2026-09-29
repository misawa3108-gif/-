"use client";

import { Clock } from "@/components/reception/clock";
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
    <button
      type="button"
      onClick={onStart}
      className="group relative flex min-h-dvh w-full cursor-pointer flex-col text-left focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/40 focus-visible:ring-inset"
    >
      <span className="sr-only">画面にタッチして受付を始める</span>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,oklch(0.75_0.16_52)_0%,transparent_58%),radial-gradient(ellipse_at_bottom,oklch(0.9_0.1_70)_0%,transparent_50%)]"
      />
      <div className="relative flex min-h-dvh w-full flex-col px-6 py-6 sm:px-10 sm:py-8">
        <header className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <Mark className="size-10 sm:size-11" />
            <div>
              <p className="font-heading text-base leading-tight sm:text-lg">
                {company.name}
              </p>
              <p className="text-xs tracking-wide text-muted-foreground">
                {company.building}
              </p>
            </div>
          </div>
          <Clock initialIso={now} withDate />
        </header>

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

        <footer className="pb-2 text-center text-xs leading-relaxed text-muted-foreground">
          <p>{company.address}</p>
          <p className="mt-1">受付 {company.hours}</p>
        </footer>
      </div>
    </button>
  );
}
