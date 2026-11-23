"use client";

import { useCallback, useSyncExternalStore } from "react";

const cache = new Map<string, { raw: string | null; value: unknown }>();
const subs = new Map<string, Set<() => void>>();

/** localStorage reactivo y sin desajustes de hidratación. `fallback` debe ser una referencia estable. */
export function useStoredJson<T>(key: string, fallback: T): [T, (v: T) => void] {
  const subscribe = useCallback(
    (cb: () => void) => {
      const set = subs.get(key) ?? new Set<() => void>();
      subs.set(key, set);
      set.add(cb);
      window.addEventListener("storage", cb);
      return () => {
        set.delete(cb);
        window.removeEventListener("storage", cb);
      };
    },
    [key],
  );
  const getSnapshot = useCallback((): T => {
    const raw = window.localStorage.getItem(key);
    const hit = cache.get(key);
    if (hit && hit.raw === raw) return hit.value as T;
    let value: T = fallback;
    try {
      if (raw) value = JSON.parse(raw) as T;
    } catch {
      /* valor corrupto */
    }
    cache.set(key, { raw, value });
    return value;
  }, [key, fallback]);
  const value = useSyncExternalStore(subscribe, getSnapshot, () => fallback);
  const write = useCallback(
    (v: T) => {
      try {
        window.localStorage.setItem(key, JSON.stringify(v));
      } catch {
        /* sin almacenamiento */
      }
      subs.get(key)?.forEach((f) => f());
    },
    [key],
  );
  return [value, write];
}
