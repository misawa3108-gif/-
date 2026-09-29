"use client";

import type { ReactNode } from "react";
import { ArrowLeft } from "lucide-react";
import { LobbyFooter, LobbyHeader, lobbyWash } from "@/components/lobby/chrome";
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
      <div aria-hidden="true" className={lobbyWash} />
      <div className="relative flex min-h-dvh w-full flex-col px-6 py-6 sm:px-10 sm:py-8">
        <LobbyHeader now={now} />

        <div className={cn("mx-auto flex w-full flex-1 flex-col pt-8 sm:pt-10", wide ? "max-w-5xl" : "max-w-3xl")}>
          {onBack ? (
            <button
              type="button"
              onClick={onBack}
              className="mx-auto mb-6 inline-flex w-fit items-center gap-2 rounded-full px-1 py-1 text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <ArrowLeft className="size-4" />
              戻る
            </button>
          ) : null}

          {steps && stepIndex !== undefined ? (
            <div className="mb-6 text-center">
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
              <p className="mt-2 text-center text-xs tracking-wide text-muted-foreground">
                {steps[stepIndex]}
              </p>
            </div>
          ) : null}

          {title ? (
            <div className="mb-6 text-center">
              <h1 className="font-heading text-4xl leading-tight tracking-tight sm:text-5xl">
                {title}
              </h1>
              {lede ? (
                <p className="mx-auto mt-5 max-w-md text-sm leading-relaxed text-muted-foreground sm:text-base">
                  {lede}
                </p>
              ) : null}
            </div>
          ) : null}

          {children}
        </div>
        <LobbyFooter />
      </div>
    </div>
  );
}
