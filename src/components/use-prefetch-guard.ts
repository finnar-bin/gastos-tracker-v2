"use client";

import { useCallback, useRef } from "react";

export function usePrefetchGuard(windowMs = 2500) {
  const lastPrefetchAtRef = useRef<Map<string, number>>(new Map());

  const shouldPrefetch = useCallback(
    (key: string) => {
      const now = Date.now();
      const last = lastPrefetchAtRef.current.get(key) ?? 0;

      if (now - last < windowMs) {
        return false;
      }

      lastPrefetchAtRef.current.set(key, now);
      return true;
    },
    [windowMs],
  );

  return {
    shouldPrefetch,
  };
}
