"use client";

import type { ReactNode } from "react";
import { ArrowLeft } from "lucide-react";
import { Clock } from "@/components/reception/clock";
import { Mark } from "@/components/reception/mark";
import { company } from "@/lib/company";
import { cn } from "@/lib/utils";

export function LobbyFrame({
  now,
  title,
  lede,
  onBack,
  steps,
  stepIndex,
  children,
  wide = false,
}: {
  now: string;
  title?: string;
  lede?: string;
  onBack?: () => void;
  steps?: string[];
  stepIndex?: number;
  children: ReactNode;
  wide?: boolean;
}) {
  return (
    <div className="relative min-h-dvh">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,oklch(0.76_0.15_50)_0%,transparent_54%),radial-gradient(ellipse_at_bottom_right,oklch(0.9_0.09_72)_0%,transparent_48%)]"
      />
      <div className="relative mx-auto flex min-h-dvh w-full max-w-6xl flex-col px-4 py-5 sm:px-8 sm:py-7">
        <header className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <Mark />
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

        <div className={cn("mx-auto flex w-full flex-1 flex-col pt-8 sm:pt-12", wide ? "max-w-5xl" : "max-w-3xl")}>
          {onBack ? (
            <button
              type="button"
              onClick={onBack}
              className="mb-6 inline-flex w-fit items-center gap-2 rounded-full px-1 py-1 text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <ArrowLeft className="size-4" />
              戻る
            </button>
          ) : null}

          {steps && stepIndex !== undefined ? (
            <div className="mb-6">
              <ol className="flex gap-1.5" aria-label="進捗">
                {steps.map((label, index) => (
                  <li
                    key={label}
                    className={cn(
                      "h-1 flex-1 rounded-full",
                      index <= stepIndex ? "bg-primary" : "bg-border",
                    )}
                  >
                    <span className="sr-only">
                      {label}
                      {index === stepIndex ? "（現在）" : ""}
                    </span>
                  </li>
                ))}
              </ol>
              <p className="mt-2 text-xs tracking-wide text-muted-foreground">
                {steps[stepIndex]}
              </p>
            </div>
          ) : null}

          {title ? (
            <div className="mb-6">
              <h1 className="font-heading text-3xl leading-tight tracking-tight sm:text-4xl">
                {title}
              </h1>
              {lede ? (
                <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
                  {lede}
                </p>
              ) : null}
            </div>
          ) : null}

          {children}
        </div>
      </div>
    </div>
  );
}
