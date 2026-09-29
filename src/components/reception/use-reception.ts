"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getSnapshot } from "@/lib/actions";
import type { Snapshot } from "@/lib/types";

export function useReception(initial: Snapshot) {
  const [snapshot, setSnapshot] = useState(initial);
  const generation = useRef(0);

  const replace = useCallback((next: Snapshot) => {
    generation.current += 1;
    setSnapshot(next);
  }, []);

  const refresh = useCallback(async () => {
    const seen = generation.current;
    const next = await getSnapshot();
    if (seen !== generation.current) return;
    setSnapshot(next);
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      void refresh().catch(() => undefined);
    }, 2500);
    return () => clearInterval(id);
  }, [refresh]);

  return { snapshot, replace, refresh };
}
