"use client";

/**
 * DEMO persistence for the admin console: state lives in this browser's localStorage so the
 * prototype works on any static host. Phase 4 replaces this module with Supabase queries/RPCs;
 * components only use useAdmin() / dispatch(), so they don't change.
 */
import { useSyncExternalStore } from "react";
import { loadAll as loadWebRequests } from "../booking/storage";
import { DomainError, importWebRequests } from "./domain";
import { buildSeed } from "./seed";
import type { AdminState, BookingStatus } from "./types";

const KEY = "bez-demo-admin-v1";
const MAX_AGE_DAYS = 7;
let cache: AdminState | null = null;
const listeners = new Set<() => void>();

function persist(s: AdminState) {
  try { localStorage.setItem(KEY, JSON.stringify(s)); return true; } catch { return false; }
}

function load(): AdminState {
  let s: AdminState | null = null;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) s = JSON.parse(raw) as AdminState;
  } catch { s = null; }
  const stale = !s || s.version !== 1 || Date.now() - Date.parse(s.seededAt) > MAX_AGE_DAYS * 86400_000;
  if (stale) s = buildSeed();
  s = importWebRequests(s!, loadWebRequests());
  persist(s);
  return s;
}

function emit() { listeners.forEach((l) => l()); }

function subscribe(l: () => void) {
  listeners.add(l);
  const sync = () => { cache = load(); emit(); };
  const onStorage = (e: StorageEvent) => { if (e.key === KEY || e.key === "bez-demo-bookings") sync(); };
  window.addEventListener("storage", onStorage);
  window.addEventListener("focus", sync);
  return () => { listeners.delete(l); window.removeEventListener("storage", onStorage); window.removeEventListener("focus", sync); };
}

const getSnapshot = () => (cache ??= load());
const getServerSnapshot = () => null;

export function useAdmin(): AdminState | null {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export type DispatchResult = { ok: true } | { ok: false; code: string; detail?: string };

export function dispatch(fn: (s: AdminState) => AdminState): DispatchResult {
  try {
    const next = fn(getSnapshot());
    if (!persist(next)) return { ok: false, code: "storage_full" };
    cache = next;
    emit();
    return { ok: true };
  } catch (e) {
    if (e instanceof DomainError) return { ok: false, code: e.code, detail: e.detail };
    console.error(e);
    return { ok: false, code: "unknown" };
  }
}

export function resetDemo() {
  try { localStorage.removeItem("bez-demo-bookings"); } catch {}
  cache = buildSeed();
  persist(cache);
  emit();
}

/** For the public confirmation page: the status an admin set for this reference (demo, same browser). */
export function adminStatusForRef(ref: string): BookingStatus | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    return (JSON.parse(raw) as AdminState).bookings.find((b) => b.ref === ref)?.status ?? null;
  } catch { return null; }
}
