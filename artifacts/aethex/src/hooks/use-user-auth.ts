import { useState, useEffect } from "react";

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
const USERS_KEY = "aethex_users_db";
const JWT_KEY = "aethex_jwt";

function getUsers(): Record<string, UserProfile & { passwordHash: string }> {
  try {
    return JSON.parse(localStorage.getItem(USERS_KEY) || "{}");
  } catch {
    return {};
  }
}

function saveUsers(users: Record<string, UserProfile & { passwordHash: string }>) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString(36);
}

export function useUserAuth() {
  const [user, setUser] = useState<UserProfile | null>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  const saveUser = (u: UserProfile) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(u));
    setUser(u);
  };

  const signup = (
    name: string,
    email: string,
    password: string,
    role?: "student" | "doctor" | "other",
    college?: string,
    hospital?: string,
  ): { success: boolean; error?: string } => {
    const users = getUsers();
    const emailKey = email.toLowerCase();
    if (users[emailKey]) {
      return { success: false, error: "An account with this email already exists." };
    }
    const newUser: UserProfile & { passwordHash: string } = {
      id: Date.now().toString(),
      name,
      email: emailKey,
      isPro: false,
      role,
      college,
      hospital,
      addresses: [],
      wishlist: [],
      cadusDailyCount: 0,
      cadusLastDate: "",
      passwordHash: simpleHash(password),
    };
    users[emailKey] = newUser;
    saveUsers(users);
    const { passwordHash: _ph, ...profile } = newUser;
    saveUser(profile);
    return { success: true };
  };

  const login = (email: string, password: string): { success: boolean; error?: string } => {
    const users = getUsers();
    const emailKey = email.toLowerCase();
    const stored = users[emailKey];
    if (!stored) {
      return { success: false, error: "No account found with this email." };
    }
    if (stored.passwordHash !== simpleHash(password)) {
      return { success: false, error: "Incorrect password." };
    }
    const { passwordHash: _ph, ...profile } = stored;
    saveUser(profile);
    return { success: true };
  };

  const otpLogin = (email: string, jwt: string): void => {
    localStorage.setItem(JWT_KEY, jwt);
    const users = getUsers();
    const emailKey = email.toLowerCase();
    let profile: UserProfile;
    if (users[emailKey]) {
      const { passwordHash: _ph, ...existing } = users[emailKey];
      profile = existing;
    } else {
      const namePart = email.split("@")[0] ?? "Doctor";
      const name = namePart.charAt(0).toUpperCase() + namePart.slice(1);
      profile = {
        id: Date.now().toString(),
        name,
        email: emailKey,
        isPro: false,
        addresses: [],
        wishlist: [],
        cadusDailyCount: 0,
        cadusLastDate: "",
      };
      users[emailKey] = { ...profile, passwordHash: "" };
      saveUsers(users);
    }
    saveUser(profile);
  };

  const googleLogin = (firebaseUser: { uid: string; displayName: string | null; email: string | null; photoURL: string | null }): void => {
    const emailKey = (firebaseUser.email || `google:${firebaseUser.uid}`).toLowerCase();
    const users = getUsers();
    let profile: UserProfile;
    if (users[emailKey]) {
      const { passwordHash: _ph, ...existing } = users[emailKey];
      profile = { ...existing, avatar: firebaseUser.photoURL || existing.avatar };
    } else {
      const name = firebaseUser.displayName || (firebaseUser.email?.split("@")[0] ?? "Doctor");
      profile = {
        id: firebaseUser.uid,
        name,
        email: emailKey,
        avatar: firebaseUser.photoURL || undefined,
        isPro: false,
        addresses: [],
        wishlist: [],
        cadusDailyCount: 0,
        cadusLastDate: "",
      };
      users[emailKey] = { ...profile, passwordHash: "" };
      saveUsers(users);
    }
    saveUser(profile);
  };

  const phoneLogin = (phone: string, jwt: string): void => {
    localStorage.setItem(JWT_KEY, jwt);
    const phoneKey = `phone:${phone}`;
    const users = getUsers();
    let profile: UserProfile;
    if (users[phoneKey]) {
      const { passwordHash: _ph, ...existing } = users[phoneKey];
      profile = existing;
    } else {
      profile = {
        id: Date.now().toString(),
        name: "Doctor",
        email: "",
        phone,
        isPro: false,
        addresses: [],
        wishlist: [],
        cadusDailyCount: 0,
        cadusLastDate: "",
      };
      users[phoneKey] = { ...profile, passwordHash: "" };
      saveUsers(users);
    }
    saveUser(profile);
  };

  const getJwt = (): string | null => localStorage.getItem(JWT_KEY);

  const logout = () => {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(JWT_KEY);
    localStorage.removeItem("cadus3.authKey");
    setUser(null);
  };

  const updateProfile = (updates: Partial<UserProfile>) => {
    if (!user) return;
    const updated = { ...user, ...updates };
    const users = getUsers();
    const emailKey = user.email.toLowerCase();
    if (users[emailKey]) {
      users[emailKey] = { ...users[emailKey], ...updates };
      saveUsers(users);
    }
    saveUser(updated);
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
    otpLogin,
    googleLogin,
    phoneLogin,
    getJwt,
    logout,
    updateProfile,
    toggleWishlist,
    activatePro,
    activateProAnnual,
    incrementCadusCount,
  };
}
