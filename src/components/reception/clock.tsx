"use client";

import { useEffect, useState } from "react";
import { formatTokyoClock, formatTokyoDate } from "@/lib/time";
import { cn } from "@/lib/utils";

export function Clock({
  initialIso,
  className,
  withDate = false,
}: {
  initialIso: string;
  className?: string;
  withDate?: boolean;
}) {
  const [now, setNow] = useState(() => new Date(initialIso));

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className={cn("text-right", className)}>
      <time
        dateTime={now.toISOString()}
        className="block font-heading text-3xl leading-none tracking-tight tabular-nums sm:text-4xl"
      >
        {formatTokyoClock(now)}
      </time>
      {withDate ? (
        <p className="mt-1 text-xs tracking-wide text-muted-foreground">
          {formatTokyoDate(now)}
        </p>
      ) : null}
    </div>
  );
}
