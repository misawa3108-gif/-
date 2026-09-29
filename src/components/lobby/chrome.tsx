import { Clock } from "@/components/reception/clock";
import { Mark } from "@/components/reception/mark";
import { company } from "@/lib/company";

export function LobbyHeader({ now }: { now: string }) {
  return (
    <header className="flex items-start justify-between gap-4">
      <div className="flex items-center gap-3">
        <Mark className="size-10 sm:size-11" />
        <p className="font-heading text-base leading-tight sm:text-lg">
          {company.name}
        </p>
      </div>
      <Clock initialIso={now} withDate />
    </header>
  );
}

export function LobbyFooter() {
  return (
    <footer className="pb-2 text-center text-xs leading-relaxed text-muted-foreground">
      <p>{company.address}</p>
      <p className="mt-1">受付 {company.hours}</p>
    </footer>
  );
}

export const lobbyWash =
  "pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,oklch(0.94_0.03_92)_0%,transparent_58%),radial-gradient(ellipse_at_bottom,oklch(0.98_0.015_95)_0%,transparent_50%)]";
