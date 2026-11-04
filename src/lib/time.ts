/**
 * Time helpers. All business times are Asia/Kuala_Lumpur (UTC+08:00, no DST).
 * Local wall-clock values are passed around as "YYYY-MM-DDTHH:mm" strings.
 */
import { intlLocale, type Locale } from "./i18n/config";

export const TIME_ZONE = "Asia/Kuala_Lumpur";
const OFFSET = "+08:00";
const LOCAL_RE = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/;

export function isLocalDateTime(value: unknown): value is string {
  if (typeof value !== "string") return false;
  const m = LOCAL_RE.exec(value);
  if (!m) return false;
  const d = new Date(`${value}:00${OFFSET}`);
  return !Number.isNaN(d.getTime()) && toLocal(d) === value;
}

/** "2026-11-05T10:00" (MYT) -> Date instant */
export function fromLocal(value: string): Date {
  return new Date(`${value}:00${OFFSET}`);
}

/** Date instant -> "2026-11-05T10:00" in MYT */
export function toLocal(d: Date): string {
  const shifted = new Date(d.getTime() + 8 * 3600_000);
  return shifted.toISOString().slice(0, 16);
}

export const localDate = (value: string) => value.slice(0, 10);
export const localTime = (value: string) => value.slice(11, 16);

/** Today's date in MYT, "YYYY-MM-DD" */
export const todayLocal = (now = new Date()) => toLocal(now).slice(0, 10);

export function addDaysLocal(date: string, days: number): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function formatDateTime(value: string, locale: Locale): string {
  return new Intl.DateTimeFormat(intlLocale(locale), {
    timeZone: TIME_ZONE,
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(fromLocal(value));
}

export function formatDate(date: string, locale: Locale, opts?: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat(intlLocale(locale), {
    timeZone: TIME_ZONE,
    day: "numeric",
    month: "short",
    year: "numeric",
    ...opts,
  }).format(new Date(`${date}T12:00:00${OFFSET}`));
}

/** Default search window: tomorrow 10:00 -> day after +2, 10:00 */
export function defaultPeriod(now = new Date()) {
  const t = todayLocal(now);
  return { pickup: `${addDaysLocal(t, 1)}T10:00`, return: `${addDaysLocal(t, 3)}T10:00` };
}

/** Half-hour slots between open and close, e.g. ["08:00", "08:30", ...] */
export function timeSlots(openHour: number, closeHour: number, stepMinutes = 30): string[] {
  const out: string[] = [];
  for (let m = openHour * 60; m <= closeHour * 60; m += stepMinutes) {
    out.push(`${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`);
  }
  return out;
}
