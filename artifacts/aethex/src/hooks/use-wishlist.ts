import { useEffect, useState, useCallback } from "react";

const KEY = "aethex:wishlist:v1";

function read(): number[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr.filter((n) => typeof n === "number") : [];
  } catch {
    return [];
  }
}

function write(ids: number[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(ids));
    window.dispatchEvent(new CustomEvent("aethex:wishlist-change"));
  } catch {}
}

export function useWishlist() {
  const [ids, setIds] = useState<number[]>(() => read());

  useEffect(() => {
    const sync = () => setIds(read());
    window.addEventListener("aethex:wishlist-change", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("aethex:wishlist-change", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const has = useCallback((id: number) => ids.includes(id), [ids]);

  const toggle = useCallback((id: number) => {
    const current = read();
    const next = current.includes(id)
      ? current.filter((x) => x !== id)
      : [...current, id];
    write(next);
    setIds(next);
    return !current.includes(id);
  }, []);

  const remove = useCallback((id: number) => {
    const next = read().filter((x) => x !== id);
    write(next);
    setIds(next);
  }, []);

  const clear = useCallback(() => {
    write([]);
    setIds([]);
  }, []);

  return { ids, count: ids.length, has, toggle, remove, clear };
}
