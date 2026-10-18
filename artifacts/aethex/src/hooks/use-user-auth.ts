import { useState, useEffect } from "react";
import { AUTH_EVENT, signIn, signOut, signUp } from "@/lib/account";

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  isPro: boolean;
  proExpiry?: string;
  /** The Cadus plan: starter, core, professional or enterprise (see lib/cadus/plans). */
  plan?: "starter" | "core" | "professional" | "enterprise";
  planExpiry?: string;
  avatar?: string;
  phone?: string;
  role?: "student" | "doctor" | "other";
  college?: string;
  hospital?: string;
  addresses: Address[];
  wishlist: number[];
  cadusDailyCount: number;
  cadusLastDate: string;
  verified?: boolean;
  verificationStatus?: "none" | "pending" | "approved" | "rejected";
}

export interface Address {
  id: string;
  label: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
  isDefault: boolean;
}

const STORAGE_KEY = "aethex_user";

const readUser = (): UserProfile | null => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

/**
 * The signed-in account. Accounts live on Cloudflare (lib/account.ts); this
 * hook keeps the local copy in step and adds the local-only extras.
 */
export function useUserAuth() {
  const [user, setUser] = useState<UserProfile | null>(readUser);

  // Stay in step with sign-in and sign-out from other components and tabs.
  useEffect(() => {
    const sync = () => setUser(readUser());
    window.addEventListener(AUTH_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => { window.removeEventListener(AUTH_EVENT, sync); window.removeEventListener("storage", sync); };
  }, []);

  const saveUser = (u: UserProfile) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(u));
    setUser(u);
  };

  /** Starts a sign-up; the account is created when the emailed code is entered (verifyEmailCode). */
  const signup = async (name: string, email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    const r = await signUp(name, email, password);
    return r.ok ? { success: true } : { success: false, error: r.error };
  };

  /** Signs in with email and password. */
  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    const r = await signIn(email, password);
    return r.ok ? { success: true } : { success: false, error: r.error };
  };

  /** Legacy pages send this as a bearer token; the session itself is the cookie. */
  const getJwt = (): string | null => (user ? "session" : null);

  /** Signs out of every aethex.in site. */
  const logout = () => {
    // Ends the session on the server, then forgets the account here (the
    // change reaches every component through AUTH_EVENT).
    void signOut();
  };

  const updateProfile = (updates: Partial<UserProfile>) => {
    if (!user) return;
    saveUser({ ...user, ...updates });
  };

  const toggleWishlist = (productId: number) => {
    if (!user) return;
    const wishlist = user.wishlist.includes(productId)
      ? user.wishlist.filter(id => id !== productId)
      : [...user.wishlist, productId];
    updateProfile({ wishlist });
  };

  const activatePro = () => {
    if (!user) return;
    const expiry = new Date();
    expiry.setMonth(expiry.getMonth() + 1);
    updateProfile({ isPro: true, proExpiry: expiry.toISOString(), plan: "professional", planExpiry: expiry.toISOString() });
  };

  const activateProAnnual = () => {
    if (!user) return;
    const expiry = new Date();
    expiry.setFullYear(expiry.getFullYear() + 1);
    updateProfile({ isPro: true, proExpiry: expiry.toISOString(), plan: "professional", planExpiry: expiry.toISOString() });
  };

  const incrementCadusCount = (): boolean => {
    if (!user) return false;
    if (user.isPro) return true;
    const today = new Date().toDateString();
    const count = user.cadusLastDate === today ? user.cadusDailyCount : 0;
    if (count >= 10) return false;
    updateProfile({ cadusDailyCount: count + 1, cadusLastDate: today });
    return true;
  };

  return {
    user,
    isLoggedIn: !!user,
    isPro: user?.isPro ?? false,
    signup,
    login,
    getJwt,
    logout,
    updateProfile,
    toggleWishlist,
    activatePro,
    activateProAnnual,
    incrementCadusCount,
  };
}
