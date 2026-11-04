"use client";

import { useEffect, useRef, type ReactNode } from "react";
import type { BookingStatus } from "@/lib/admin/types";
import { Badge } from "../ui/badge";
import { IconX } from "../ui/icons";
import { useAdminCtx } from "./context";

const tone: Record<BookingStatus, "warn" | "petrol" | "good" | "neutral" | "bad" | "amber"> = {
  pending: "warn", confirmed: "petrol", collected: "good", active: "good", returned: "amber", completed: "neutral", cancelled: "neutral", rejected: "bad",
};

export function StatusBadge({ status }: { status: BookingStatus }) {
  const { t } = useAdminCtx();
  return <Badge tone={tone[status]}>{t.status[status]}</Badge>;
}

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight sm:text-[28px]">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-steel">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Card({ title, actions, children, className = "", pad = true }: { title?: ReactNode; actions?: ReactNode; children: ReactNode; className?: string; pad?: boolean }) {
  return (
    <section className={`rounded-2xl border border-line bg-paper ${className}`}>
      {title && (
        <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-3.5">
          <h2 className="font-display text-[15px] font-bold">{title}</h2>
          {actions}
        </div>
      )}
      <div className={pad ? "p-5" : ""}>{children}</div>
    </section>
  );
}

export function Dialog({ open, onClose, title, children, footer }: { open: boolean; onClose: () => void; title: string; children: ReactNode; footer?: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  const { t } = useAdminCtx();
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);
  return (
    <dialog ref={ref} onClose={onClose} onCancel={onClose}
      className="m-auto w-[min(560px,calc(100vw-2rem))] rounded-2xl border border-line bg-paper p-0 text-ink shadow-lift backdrop:bg-ink/40 max-sm:mb-0 max-sm:w-full max-sm:max-w-none max-sm:rounded-b-none">
      {open && (
        <div className="flex max-h-[85vh] flex-col">
          <div className="flex items-center justify-between border-b border-line px-5 py-4">
            <h2 className="font-display text-lg font-bold">{title}</h2>
            <button type="button" onClick={onClose} className="grid size-9 place-items-center rounded-lg hover:bg-ink/5" aria-label={t.common.close}><IconX className="size-5" /></button>
          </div>
          <div className="overflow-y-auto px-5 py-5">{children}</div>
          {footer && <div className="flex flex-col-reverse gap-2 border-t border-line px-5 py-4 sm:flex-row sm:justify-end">{footer}</div>}
        </div>
      )}
    </dialog>
  );
}

export function StatTile({ label, value, sub, tone: tn = "default", href }: { label: string; value: ReactNode; sub?: ReactNode; tone?: "default" | "warn" | "good"; href?: string }) {
  const body = (
    <>
      <p className="text-[13px] font-medium text-steel">{label}</p>
      <p className={`mt-1 font-display text-[28px] font-bold leading-tight tabular-nums ${tn === "warn" ? "text-warn" : tn === "good" ? "text-good" : ""}`}>{value}</p>
      {sub && <p className="mt-0.5 text-xs text-mist">{sub}</p>}
    </>
  );
  const cls = "block rounded-2xl border border-line bg-paper p-4 transition-colors";
  return href ? <a href={href} className={`${cls} hover:border-steel/40`}>{body}</a> : <div className={cls}>{body}</div>;
}

export function Empty({ children }: { children: ReactNode }) {
  return <p className="py-6 text-center text-sm text-mist">{children}</p>;
}

export function Skeleton() {
  return (
    <div className="space-y-4" aria-busy="true">
      <div className="h-8 w-48 animate-pulse rounded-lg bg-sand" />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{[0, 1, 2, 3].map((i) => <div key={i} className="h-24 animate-pulse rounded-2xl bg-sand/70" />)}</div>
      <div className="h-72 animate-pulse rounded-2xl bg-sand/60" />
    </div>
  );
}
