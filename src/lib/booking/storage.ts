"use client";

import type { DemoBooking } from "./schema";

/**
 * DEMO ONLY: keeps submitted requests in this browser so the confirmation page can be
 * revisited. Phase 4 replaces this with a server lookup by reference + secret token.
 */
const KEY = "bez-demo-bookings";

export function saveBooking(b: DemoBooking) {
  try {
    const all = loadAll().filter((x) => x.ref !== b.ref);
    localStorage.setItem(KEY, JSON.stringify([b, ...all].slice(0, 20)));
  } catch { /* storage unavailable — confirmation still shown from memory */ }
}

export function loadAll(): DemoBooking[] {
  try { return JSON.parse(localStorage.getItem(KEY) || "[]"); } catch { return []; }
}

export const loadBooking = (ref: string) => loadAll().find((b) => b.ref === ref) ?? null;
