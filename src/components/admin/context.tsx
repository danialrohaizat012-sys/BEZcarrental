"use client";

import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import type { AdminDict } from "@/lib/i18n/admin";
import { getAdminDictionary } from "@/lib/i18n/admin";
import type { Locale } from "@/lib/i18n";
import { dispatch, type DispatchResult } from "@/lib/admin/store";
import type { AdminState } from "@/lib/admin/types";

interface Ctx {
  lang: Locale;
  t: AdminDict;
  user: string;
  toast: (msg: string, tone?: "ok" | "err") => void;
  /** Run a domain mutation; shows a toast on failure. */
  act: (fn: (s: AdminState) => AdminState, okMsg?: string) => DispatchResult;
}
const AdminCtx = createContext<Ctx | null>(null);

export function AdminProvider({ lang, user, children }: { lang: Locale; user: string; children: ReactNode }) {
  const t = getAdminDictionary(lang);
  const [toastState, setToast] = useState<{ msg: string; tone: "ok" | "err"; id: number } | null>(null);
  const toast = useCallback((msg: string, tone: "ok" | "err" = "ok") => {
    const id = Date.now();
    setToast({ msg, tone, id });
    setTimeout(() => setToast((cur) => (cur?.id === id ? null : cur)), 3500);
  }, []);
  const act = useCallback((fn: (s: AdminState) => AdminState, okMsg?: string) => {
    const r = dispatch(fn);
    if (r.ok) { if (okMsg) toast(okMsg); }
    else toast(`${t.errors[r.code] ?? t.errors.unknown}${r.detail && r.code === "conflict" ? `: ${r.detail}` : ""}`, "err");
    return r;
  }, [t, toast]);
  return (
    <AdminCtx.Provider value={{ lang, t, user, toast, act }}>
      {children}
      <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-20 z-[70] flex justify-center px-4 lg:bottom-6">
        {toastState && (
          <p className={`pointer-events-auto animate-rise rounded-xl px-4 py-2.5 text-sm font-medium shadow-lift ${toastState.tone === "ok" ? "bg-ink text-ivory" : "bg-bad text-white"}`}>
            {toastState.msg}
          </p>
        )}
      </div>
    </AdminCtx.Provider>
  );
}

export function useAdminCtx() {
  const c = useContext(AdminCtx);
  if (!c) throw new Error("AdminProvider missing");
  return c;
}
