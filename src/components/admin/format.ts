import { intlLocale, type Locale } from "@/lib/i18n";
import { fromLocal, TIME_ZONE } from "@/lib/time";

export function fmtShort(local: string, lang: Locale) {
  return new Intl.DateTimeFormat(intlLocale(lang), { timeZone: TIME_ZONE, day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }).format(fromLocal(local));
}
export function fmtRange(a: string, b: string, lang: Locale) {
  return `${fmtShort(a, lang)} → ${fmtShort(b, lang)}`;
}
export function fmtIso(iso: string, lang: Locale) {
  return new Intl.DateTimeFormat(intlLocale(lang), { timeZone: TIME_ZONE, day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date(iso));
}
export function fmtMonth(key: string, lang: Locale) {
  return new Intl.DateTimeFormat(intlLocale(lang), { month: "short", timeZone: "UTC" }).format(new Date(`${key}-15T00:00:00Z`));
}
/** "RM 12.50" -> 1250 sen; returns NaN for invalid input */
export function parseRM(v: string): number {
  const n = Number(String(v).replace(/[^\d.]/g, ""));
  return v.trim() === "" || !Number.isFinite(n) ? NaN : Math.round(n * 100);
}
