"use client";

import type { Session } from "@/features/auth/types";

export const sessionKey = "thiago.session";

export function readSession(): Session | null {
  if (typeof window === "undefined") return null;
  const saved = window.localStorage.getItem(sessionKey);
  if (!saved) return null;
  try {
    return JSON.parse(saved) as Session;
  } catch {
    window.localStorage.removeItem(sessionKey);
    return null;
  }
}

export function writeSession(session: Session) {
  window.localStorage.setItem(sessionKey, JSON.stringify(session));
}

export function clearSession() {
  window.localStorage.removeItem(sessionKey);
}
