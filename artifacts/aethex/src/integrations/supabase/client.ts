import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

function isNewKey(v: string) { return v.startsWith("sb_publishable_") || v.startsWith("sb_secret_"); }

// Strip default Authorization Bearer <opaque key> because sb_ keys are not JWTs.
const customFetch: typeof fetch = (input, init) => {
  const headers = new Headers(init?.headers);
  if (isNewKey(SUPABASE_KEY) && headers.get("Authorization") === `Bearer ${SUPABASE_KEY}`) {
    headers.delete("Authorization");
  }
  headers.set("apikey", SUPABASE_KEY);
  return fetch(input, { ...init, headers });
};

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: typeof window !== "undefined" ? window.localStorage : undefined,
    storageKey: "aethex-supabase-auth",
  },
  global: { fetch: customFetch },
});
