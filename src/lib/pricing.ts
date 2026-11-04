/**
 * Pricing engine — pure and deterministic, shared by the browser (live estimate)
 * and the server (authoritative price on submit). All amounts in sen.
 */
import type { AddOn, BookingRules, Location, SeasonalRule, Vehicle, VehicleCategory } from "./data/types";
import { fromLocal, isLocalDateTime, localTime, toLocal } from "./time";

export type PeriodError =
  | "invalid"
  | "return_before_pickup"
  | "too_short"
  | "too_long"
  | "lead_time"
  | "outside_hours";

export function validatePeriod(pickup: string, ret: string, rules: BookingRules, now = new Date()): PeriodError | null {
  if (!isLocalDateTime(pickup) || !isLocalDateTime(ret)) return "invalid";
  const p = fromLocal(pickup).getTime();
  const r = fromLocal(ret).getTime();
  if (r <= p) return "return_before_pickup";
  const within = (t: string) => {
    const [h, m] = t.split(":").map(Number);
    const mins = h * 60 + m;
    return mins >= rules.openHour * 60 && mins <= rules.closeHour * 60;
  };
  if (!within(localTime(pickup)) || !within(localTime(ret))) return "outside_hours";
  if (p < now.getTime() + rules.minLeadHours * 3600_000) return "lead_time";
  if (r - p < rules.minRentalHours * 3600_000) return "too_short";
  if (r - p > rules.maxRentalDays * 86400_000) return "too_long";
  return null;
}

export interface SelectedAddOn {
  id: string;
  qty: number;
}

export interface QuoteContext {
  rules: BookingRules;
  addOns: AddOn[];
  locations: Location[];
  seasonalRules: SeasonalRule[];
  category: VehicleCategory;
}

export interface Quote {
  durationMinutes: number;
  days: number; // full billable days (after extra-hour cap)
  extraHours: number; // billable hours beyond full days
  chargeableDays: number; // days used for per-day add-ons
  tier: "daily" | "weekly" | "monthly";
  dayRateSen: number;
  baseSen: number; // days * dayRate
  extraHoursSen: number;
  seasonal: { id: string; days: number; amountSen: number } | null;
  addOnLines: { id: string; qty: number; unitSen: number; pricing: AddOn["pricing"]; amountSen: number }[];
  addOnsSen: number;
  locationFeeSen: number;
  subtotalSen: number;
  taxSen: number;
  totalSen: number;
  depositSen: number;
}

export class QuoteError extends Error {}

export function calculateQuote(
  vehicle: Vehicle,
  pickup: string,
  ret: string,
  selected: SelectedAddOn[],
  locationId: string,
  ctx: QuoteContext,
): Quote {
  if (!isLocalDateTime(pickup) || !isLocalDateTime(ret)) throw new QuoteError("invalid period");
  const start = fromLocal(pickup).getTime();
  const durationMinutes = Math.round((fromLocal(ret).getTime() - start) / 60_000);
  if (durationMinutes <= 0) throw new QuoteError("return must be after pickup");

  let days = Math.floor(durationMinutes / 1440);
  const remainder = durationMinutes - days * 1440;
  const tierFor = (d: number): Quote["tier"] =>
    d >= ctx.rules.monthlyFromDays ? "monthly" : d >= ctx.rules.weeklyFromDays ? "weekly" : "daily";

  let extraHours = remainder > ctx.rules.graceMinutes ? Math.ceil(remainder / 60) : 0;
  let tier = tierFor(Math.max(days, 1));
  let dayRateSen = vehicle.rates[tier];
  // Extra hours never cost more than one extra day.
  if (days === 0 || extraHours * vehicle.rates.hourly >= dayRateSen) {
    if (extraHours > 0 || days === 0) days += 1;
    extraHours = 0;
    tier = tierFor(days);
    dayRateSen = vehicle.rates[tier];
  }
  const baseSen = days * dayRateSen;
  const extraHoursSen = extraHours * vehicle.rates.hourly;
  const chargeableDays = days + (extraHours > 0 ? 1 : 0);

  // Seasonal surcharge: per billable day whose start falls inside a rule window.
  let seasonal: Quote["seasonal"] = null;
  for (const rule of ctx.seasonalRules) {
    let n = 0;
    for (let i = 0; i < days; i++) {
      const d = toLocal(new Date(start + i * 86400_000)).slice(0, 10);
      if (d >= rule.from && d <= rule.to) n++;
    }
    if (n > 0) {
      const amountSen = Math.round(n * dayRateSen * rule.surcharge);
      if (!seasonal || amountSen > seasonal.amountSen) seasonal = { id: rule.id, days: n, amountSen };
    }
  }

  const addOnLines: Quote["addOnLines"] = [];
  const seen = new Set<string>();
  for (const s of selected) {
    if (seen.has(s.id)) throw new QuoteError(`duplicate add-on ${s.id}`);
    seen.add(s.id);
    const a = ctx.addOns.find((x) => x.id === s.id);
    if (!a) throw new QuoteError(`unknown add-on ${s.id}`);
    if (!Number.isInteger(s.qty) || s.qty < 0 || s.qty > a.maxQty) throw new QuoteError(`invalid quantity for ${s.id}`);
    if (s.qty === 0) continue;
    const amountSen = a.priceSen * s.qty * (a.pricing === "per_day" ? chargeableDays : 1);
    addOnLines.push({ id: a.id, qty: s.qty, unitSen: a.priceSen, pricing: a.pricing, amountSen });
  }
  const addOnsSen = addOnLines.reduce((t, l) => t + l.amountSen, 0);

  const location = ctx.locations.find((l) => l.id === locationId);
  if (!location) throw new QuoteError("unknown location");
  const locationFeeSen = location.feeSen;

  const subtotalSen = baseSen + extraHoursSen + (seasonal?.amountSen ?? 0) + addOnsSen + locationFeeSen;
  const taxSen = Math.round(subtotalSen * ctx.rules.taxRate);

  return {
    durationMinutes,
    days,
    extraHours,
    chargeableDays,
    tier,
    dayRateSen,
    baseSen,
    extraHoursSen,
    seasonal,
    addOnLines,
    addOnsSen,
    locationFeeSen,
    subtotalSen,
    taxSen,
    totalSen: subtotalSen + taxSen,
    depositSen: ctx.category.depositSen,
  };
}
