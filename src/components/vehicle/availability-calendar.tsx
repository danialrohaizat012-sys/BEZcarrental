"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { BusyRange } from "@/lib/data/types";
import { getDictionary, intlLocale, type Locale } from "@/lib/i18n";
import { addDaysLocal, fromLocal, TIME_ZONE, todayLocal } from "@/lib/time";
import { IconChevron, IconChevronLeft } from "../ui/icons";

type DayState = "past" | "free" | "partial" | "booked" | "maintenance";

const stateClass: Record<DayState, string> = {
  past: "text-mist/60",
  free: "bg-paper text-ink hover:bg-petrol-soft hover:text-petrol border border-line",
  partial: "bg-amber-soft text-amber-2 border border-amber/30",
  booked: "bg-ink/[0.06] text-steel line-through decoration-steel/40",
  maintenance: "bg-[repeating-linear-gradient(135deg,#e7e3da_0_4px,#f2efe8_4px_8px)] text-steel",
};

export function AvailabilityCalendar({
  busy, lang, openHour, closeHour, bookBase,
}: { busy: BusyRange[]; lang: Locale; openHour: number; closeHour: number; bookBase: string }) {
  const t = getDictionary(lang).vehicle;
  const today = todayLocal();
  const [offset, setOffset] = useState(0);

  const month = useMemo(() => {
    const [y, m] = today.split("-").map(Number);
    const first = new Date(Date.UTC(y, m - 1 + offset, 1));
    const year = first.getUTCFullYear(), mon = first.getUTCMonth();
    const daysIn = new Date(Date.UTC(year, mon + 1, 0)).getUTCDate();
    const lead = (first.getUTCDay() + 6) % 7; // Monday-first
    const label = new Intl.DateTimeFormat(intlLocale(lang), { month: "long", year: "numeric", timeZone: "UTC" }).format(first);
    const startDate = first.toISOString().slice(0, 10);
    const days = Array.from({ length: daysIn }, (_, i) => {
      const date = addDaysLocal(startDate, i);
      if (date < today) return { date, state: "past" as DayState };
      const open = fromLocal(`${date}T${String(openHour).padStart(2, "0")}:00`).getTime();
      const close = fromLocal(`${date}T${String(closeHour).padStart(2, "0")}:00`).getTime();
      let covered = 0;
      let maint = false;
      for (const r of busy) {
        const s = Math.max(open, Date.parse(r.start));
        const e = Math.min(close, Date.parse(r.end));
        if (e > s) { covered += e - s; if (r.kind === "maintenance") maint = true; }
      }
      const frac = covered / (close - open);
      const state: DayState = frac >= 0.999 ? (maint ? "maintenance" : "booked") : frac > 0 ? "partial" : "free";
      return { date, state };
    });
    return { label, lead, days };
  }, [busy, lang, offset, openHour, closeHour, today]);

  const weekdays = useMemo(() => {
    const f = new Intl.DateTimeFormat(intlLocale(lang), { weekday: "narrow", timeZone: "UTC" });
    return Array.from({ length: 7 }, (_, i) => f.format(new Date(Date.UTC(2024, 0, 1 + i))));
  }, [lang]);

  const fullDate = (d: string) =>
    new Intl.DateTimeFormat(intlLocale(lang), { dateStyle: "full", timeZone: TIME_ZONE }).format(new Date(`${d}T12:00:00+08:00`));

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <p className="font-display font-semibold capitalize" aria-live="polite">{month.label}</p>
        <div className="flex gap-1">
          <button type="button" onClick={() => setOffset((o) => Math.max(0, o - 1))} disabled={offset === 0}
            className="grid size-9 place-items-center rounded-lg border border-line bg-paper disabled:opacity-40" aria-label={t.prevMonth}>
            <IconChevronLeft className="size-4" />
          </button>
          <button type="button" onClick={() => setOffset((o) => Math.min(5, o + 1))} disabled={offset === 5}
            className="grid size-9 place-items-center rounded-lg border border-line bg-paper disabled:opacity-40" aria-label={t.nextMonth}>
            <IconChevron className="size-4" />
          </button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-mist">
        {weekdays.map((w, i) => <div key={i} className="py-1">{w}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: month.lead }, (_, i) => <div key={`l${i}`} />)}
        {month.days.map(({ date, state }) => {
          const n = Number(date.slice(8));
          const cls = `grid aspect-square place-items-center rounded-lg text-sm tabular-nums transition-colors ${stateClass[state]} ${date === today ? "ring-2 ring-petrol/50" : ""}`;
          const label = `${fullDate(date)} — ${state === "free" ? t.legendFree : state === "partial" ? t.legendPartial : state === "maintenance" ? t.legendMaintenance : state === "booked" ? t.legendBooked : ""}`;
          return state === "free" || state === "partial" ? (
            <Link key={date} href={`${bookBase}&pickup=${date}T10:00&return=${addDaysLocal(date, 1)}T10:00`} className={cls} aria-label={label} title={label}>{n}</Link>
          ) : (
            <div key={date} className={cls} aria-label={label} title={label}>{n}</div>
          );
        })}
      </div>
      <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-xs text-steel">
        <li className="flex items-center gap-1.5"><span className="size-3 rounded border border-line bg-paper" />{t.legendFree}</li>
        <li className="flex items-center gap-1.5"><span className="size-3 rounded border border-amber/30 bg-amber-soft" />{t.legendPartial}</li>
        <li className="flex items-center gap-1.5"><span className="size-3 rounded bg-ink/10" />{t.legendBooked}</li>
        <li className="flex items-center gap-1.5"><span className="size-3 rounded bg-[repeating-linear-gradient(135deg,#d9d4c9_0_2px,#f2efe8_2px_4px)]" />{t.legendMaintenance}</li>
      </ul>
    </div>
  );
}
