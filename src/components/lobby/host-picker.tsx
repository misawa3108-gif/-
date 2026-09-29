"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import type { Host } from "@/lib/types";
import { normalizeQuery } from "@/lib/visits";
import { cn } from "@/lib/utils";

export function HostPicker({
  hosts,
  value,
  onChange,
}: {
  hosts: Host[];
  value: string;
  onChange: (id: string) => void;
}) {
  const [query, setQuery] = useState("");
  const q = normalizeQuery(query);

  const groups = useMemo(() => {
    const filtered = hosts.filter((host) => {
      if (!q) return true;
      return normalizeQuery(
        `${host.name}${host.department}${host.title}${host.floor}`,
      ).includes(q);
    });
    const map = new Map<string, Host[]>();
    for (const host of filtered) {
      const list = map.get(host.department) ?? [];
      list.push(host);
      map.set(host.department, list);
    }
    return [...map.entries()];
  }, [hosts, q]);

  return (
    <div className="flex flex-col gap-4">
      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="氏名・部署で探す"
          aria-label="担当者を探す"
          onKeyDown={(event) => {
            if (event.key === "Enter") event.preventDefault();
          }}
          className="h-14 rounded-2xl pl-11 text-base md:text-base"
        />
      </div>
      {groups.length === 0 ? (
        <p className="rounded-2xl border border-dashed px-4 py-10 text-center text-sm text-muted-foreground">
          該当する担当者がいません。表記を変えて探してください。
        </p>
      ) : (
        <div className="flex flex-col gap-6">
          {groups.map(([department, people]) => (
            <section key={department}>
              <h2 className="mb-2 text-xs tracking-[0.14em] text-muted-foreground">
                {department}
              </h2>
              <ul className="grid gap-2 sm:grid-cols-2">
                {people.map((host) => {
                  const selected = host.id === value;
                  return (
                    <li key={host.id}>
                      <button
                        type="button"
                        aria-pressed={selected}
                        onClick={() => onChange(host.id)}
                        className={cn(
                          "flex w-full items-center justify-between gap-3 rounded-2xl border px-4 py-3.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                          selected
                            ? "border-primary bg-accent"
                            : "border-border bg-card hover:border-primary/40",
                        )}
                      >
                        <span>
                          <span className="block text-base font-medium">
                            {host.name}
                          </span>
                          <span className="mt-0.5 block text-xs text-muted-foreground">
                            {host.title}
                          </span>
                        </span>
                        <span className="shrink-0 text-sm text-muted-foreground tabular-nums">
                          {host.floor}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
