/**
 * Admin business rules — pure functions over AdminState.
 * Every mutation returns a new state or throws DomainError. In Phase 4 the same rules
 * are enforced in Postgres (exclusion constraint, status-transition trigger, RPCs).
 */
import { addOns, categories, locations, seasonalRules } from "../data/catalog";
import { calculateQuote, type SelectedAddOn } from "../pricing";
import { fromLocal, isLocalDateTime, toLocal } from "../time";
import type {
  AdminBooking, AdminState, AdminVehicle, Balance, BookingStatus, Customer, ExtraCharge, MaintenanceRecord, Payment,
} from "./types";

export class DomainError extends Error {
  constructor(public code: string, public detail?: string) {
    super(detail ? `${code}: ${detail}` : code);
  }
}

export const STATUS_ORDER: BookingStatus[] = ["pending", "confirmed", "collected", "active", "returned", "completed"];

export const TRANSITIONS: Record<BookingStatus, BookingStatus[]> = {
  pending: ["confirmed", "rejected", "cancelled"],
  confirmed: ["collected", "cancelled"],
  collected: ["active"],
  active: ["returned"],
  returned: ["completed"],
  completed: [],
  cancelled: [],
  rejected: [],
};

/** Statuses that hold the vehicle (cannot overlap). Pending requests do not block. */
export const BLOCKING: BookingStatus[] = ["confirmed", "collected", "active"];
export const OPEN: BookingStatus[] = ["pending", "confirmed", "collected", "active", "returned"];

export const canTransition = (from: BookingStatus, to: BookingStatus) => TRANSITIONS[from].includes(to);

let counter = 0;
export const newId = (prefix: string) =>
  `${prefix}_${typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID().slice(0, 8) : `${Date.now().toString(36)}${counter++}`}`;

const ms = (local: string) => fromLocal(local).getTime();

// ---------- queries ----------
export const findBooking = (s: AdminState, id: string) => s.bookings.find((b) => b.id === id || b.ref === id);
export const findVehicle = (s: AdminState, id: string) => s.vehicles.find((v) => v.id === id);
export const findCustomer = (s: AdminState, id: string) => s.customers.find((c) => c.id === id);

export interface Conflict { kind: "booking" | "maintenance"; id: string; label: string; start: string; end: string | null }

/** Blocking bookings and open maintenance overlapping [pickup, return) plus turnaround buffer. */
export function conflictsFor(s: AdminState, vehicleId: string, pickup: string, ret: string, excludeBookingId?: string): Conflict[] {
  const buffer = s.rules.turnaroundMinutes * 60_000;
  const p = ms(pickup), r = ms(ret);
  const out: Conflict[] = [];
  for (const b of s.bookings) {
    if (b.vehicleId !== vehicleId || b.id === excludeBookingId || !BLOCKING.includes(b.status)) continue;
    if (p < ms(b.return) + buffer && ms(b.pickup) - buffer < r) out.push({ kind: "booking", id: b.id, label: b.ref, start: b.pickup, end: b.return });
  }
  for (const m of s.maintenance) {
    if (m.vehicleId !== vehicleId || m.status !== "open") continue;
    const end = m.end ? ms(m.end) : Infinity;
    if (p < end && ms(m.start) < r) out.push({ kind: "maintenance", id: m.id, label: m.type, start: m.start, end: m.end });
  }
  return out;
}

/** Other pending requests for the same vehicle overlapping this booking. */
export function pendingClashes(s: AdminState, b: AdminBooking): AdminBooking[] {
  return s.bookings.filter((o) => o.id !== b.id && o.vehicleId === b.vehicleId && o.status === "pending" &&
    ms(o.pickup) < ms(b.return) && ms(b.pickup) < ms(o.return));
}

export function balanceOf(s: AdminState, b: AdminBooking): Balance {
  const pays = s.payments.filter((p) => p.bookingId === b.id);
  const sum = (k: Payment["kind"]) => pays.filter((p) => p.kind === k).reduce((t, p) => t + p.amountSen, 0);
  const charges = b.extraCharges.reduce((t, c) => t + c.amountSen, 0);
  const voided = b.status === "cancelled" || b.status === "rejected";
  const dueSen = voided ? 0 : b.quote.totalSen + charges;
  const paidSen = sum("rental");
  const refundedSen = sum("refund");
  const depositHeldGross = sum("deposit");
  const depositRefundedSen = sum("deposit_refund");
  const depositHeldSen = depositHeldGross - depositRefundedSen;
  const netPaid = paidSen - refundedSen;
  return {
    dueSen,
    paidSen,
    refundedSen,
    outstandingSen: Math.max(0, dueSen - netPaid),
    depositRequiredSen: b.quote.depositSen,
    depositHeldSen,
    depositRefundedSen,
    depositStatus: depositHeldGross === 0 ? "not_collected" : depositHeldSen === 0 ? "refunded" : depositRefundedSen > 0 ? "partial" : "held",
    refundStatus: netPaid > dueSen ? "due" : refundedSen > 0 ? "refunded" : "none",
  };
}

// ---------- pricing helper ----------
function requote(v: AdminVehicle, pickup: string, ret: string, addOnSel: SelectedAddOn[], locationId: string, s: AdminState) {
  const category = categories.find((c) => c.id === v.categoryId)!;
  return calculateQuote(v, pickup, ret, addOnSel, locationId, { rules: s.rules, addOns, locations, seasonalRules, category });
}

function update(s: AdminState, id: string, fn: (b: AdminBooking) => AdminBooking): AdminState {
  const b = findBooking(s, id);
  if (!b) throw new DomainError("not_found");
  return { ...s, bookings: s.bookings.map((x) => (x.id === b.id ? fn(x) : x)) };
}

// ---------- mutations ----------
export function transition(
  s: AdminState, id: string, to: BookingStatus, opts: { by: string; reason?: string; now?: Date } ,
): AdminState {
  const b = findBooking(s, id);
  if (!b) throw new DomainError("not_found");
  if (!canTransition(b.status, to)) throw new DomainError("invalid_transition", `${b.status} → ${to}`);
  const now = opts.now ?? new Date();

  if (to === "confirmed") {
    const v = findVehicle(s, b.vehicleId);
    if (!v || v.status !== "active") throw new DomainError("vehicle_unavailable");
    const c = conflictsFor(s, b.vehicleId, b.pickup, b.return, b.id);
    if (c.length) throw new DomainError("conflict", c.map((x) => x.label).join(", "));
  }
  if (to === "rejected" && !opts.reason?.trim()) throw new DomainError("reason_required");
  if (to === "completed") {
    const bal = balanceOf(s, b);
    if (bal.outstandingSen > 0) throw new DomainError("outstanding_balance");
  }

  let extra: ExtraCharge[] = b.extraCharges;
  if (to === "returned") {
    // Automatic late-return charge after the grace period: hourly, capped at one day per day late.
    const v = findVehicle(s, b.vehicleId);
    const lateMin = Math.floor((now.getTime() - ms(b.return)) / 60_000) - s.rules.graceMinutes;
    if (v && lateMin > 0 && !b.extraCharges.some((c) => c.type === "late")) {
      const hours = Math.ceil(lateMin / 60);
      const amountSen = Math.floor(hours / 24) * v.rates.daily + Math.min((hours % 24) * v.rates.hourly, v.rates.daily);
      extra = [...extra, { id: newId("ch"), type: "late", amountSen, note: `${hours}h late`, at: now.toISOString() }];
    }
  }

  return update(s, b.id, (x) => ({
    ...x,
    status: to,
    extraCharges: extra,
    history: [...x.history, { from: x.status, to, at: now.toISOString(), by: opts.by, reason: opts.reason?.trim() || undefined }],
  }));
}

export function changeDates(s: AdminState, id: string, pickup: string, ret: string, by: string): AdminState {
  const b = findBooking(s, id);
  if (!b) throw new DomainError("not_found");
  if (!OPEN.includes(b.status) || b.status === "returned") throw new DomainError("locked");
  if (!isLocalDateTime(pickup) || !isLocalDateTime(ret)) throw new DomainError("invalid_period");
  if (ms(ret) <= ms(pickup)) throw new DomainError("return_before_pickup");
  if (ms(ret) - ms(pickup) < s.rules.minRentalHours * 3600_000) throw new DomainError("too_short");
  if (BLOCKING.includes(b.status)) {
    const c = conflictsFor(s, b.vehicleId, pickup, ret, b.id);
    if (c.length) throw new DomainError("conflict", c.map((x) => x.label).join(", "));
  }
  const v = findVehicle(s, b.vehicleId)!;
  const quote = requote(v, pickup, ret, b.addOns, b.locationId, s);
  return update(s, id, (x) => ({
    ...x, pickup, return: ret, quote,
    history: [...x.history, { from: x.status, to: x.status, at: new Date().toISOString(), by, reason: `dates: ${pickup} → ${ret}` }],
  }));
}

export function assignVehicle(s: AdminState, id: string, vehicleId: string, by: string): AdminState {
  const b = findBooking(s, id);
  if (!b) throw new DomainError("not_found");
  if (!["pending", "confirmed"].includes(b.status)) throw new DomainError("locked");
  const v = findVehicle(s, vehicleId);
  if (!v || v.status !== "active") throw new DomainError("vehicle_unavailable");
  if (BLOCKING.includes(b.status)) {
    const c = conflictsFor(s, vehicleId, b.pickup, b.return, b.id);
    if (c.length) throw new DomainError("conflict", c.map((x) => x.label).join(", "));
  }
  const quote = requote(v, b.pickup, b.return, b.addOns, b.locationId, s);
  return update(s, id, (x) => ({
    ...x, vehicleId, quote,
    history: [...x.history, { from: x.status, to: x.status, at: new Date().toISOString(), by, reason: `vehicle: ${v.make} ${v.model} (${v.plateNo})` }],
  }));
}

export function recordPayment(s: AdminState, p: Omit<Payment, "id">): AdminState {
  const b = findBooking(s, p.bookingId);
  if (!b) throw new DomainError("not_found");
  if (!Number.isInteger(p.amountSen) || p.amountSen <= 0) throw new DomainError("invalid_amount");
  const bal = balanceOf(s, b);
  if (p.kind === "deposit_refund" && p.amountSen > bal.depositHeldSen) throw new DomainError("exceeds_deposit");
  if (p.kind === "refund" && p.amountSen > bal.paidSen - bal.refundedSen) throw new DomainError("exceeds_paid");
  return { ...s, payments: [...s.payments, { ...p, id: newId("pay") }] };
}

export function addCharge(s: AdminState, id: string, c: Omit<ExtraCharge, "id" | "at">): AdminState {
  if (!Number.isInteger(c.amountSen) || c.amountSen <= 0) throw new DomainError("invalid_amount");
  return update(s, id, (x) => ({ ...x, extraCharges: [...x.extraCharges, { ...c, id: newId("ch"), at: new Date().toISOString() }] }));
}

export function setInternalNotes(s: AdminState, id: string, notes: string): AdminState {
  return update(s, id, (x) => ({ ...x, internalNotes: notes.slice(0, 2000) }));
}

export function upsertVehicle(s: AdminState, v: AdminVehicle): AdminState {
  const plate = v.plateNo.trim().toUpperCase();
  if (!plate || !v.make.trim() || !v.model.trim()) throw new DomainError("required");
  if (s.vehicles.some((x) => x.id !== v.id && x.plateNo.toUpperCase() === plate)) throw new DomainError("duplicate_plate");
  const r = v.rates;
  if (![r.daily, r.hourly, r.weekly, r.monthly].every((n) => Number.isInteger(n) && n > 0)) throw new DomainError("invalid_rate");
  if (v.seats < 2 || v.seats > 15 || v.luggage < 0) throw new DomainError("invalid_capacity");
  const clean = { ...v, plateNo: plate, slug: v.slug || `${v.make}-${v.model}-${plate}`.toLowerCase().replace(/[^a-z0-9]+/g, "-") };
  const exists = s.vehicles.some((x) => x.id === v.id);
  return { ...s, vehicles: exists ? s.vehicles.map((x) => (x.id === v.id ? clean : x)) : [...s.vehicles, clean] };
}

export function addMaintenance(s: AdminState, m: Omit<MaintenanceRecord, "id" | "status">): AdminState {
  if (!findVehicle(s, m.vehicleId)) throw new DomainError("not_found");
  if (!isLocalDateTime(m.start) || (m.end && (!isLocalDateTime(m.end) || ms(m.end) <= ms(m.start)))) throw new DomainError("invalid_period");
  if (!Number.isInteger(m.costSen) || m.costSen < 0) throw new DomainError("invalid_amount");
  const end = m.end ?? "9999-12-31T23:59";
  const clash = s.bookings.filter((b) => b.vehicleId === m.vehicleId && BLOCKING.includes(b.status) && ms(b.pickup) < ms(end) && ms(m.start) < ms(b.return));
  if (clash.length) throw new DomainError("conflict", clash.map((b) => b.ref).join(", "));
  return { ...s, maintenance: [...s.maintenance, { ...m, id: newId("mnt"), status: "open" }] };
}

export function closeMaintenance(s: AdminState, id: string, costSen: number, now = new Date()): AdminState {
  const m = s.maintenance.find((x) => x.id === id);
  if (!m) throw new DomainError("not_found");
  if (m.status === "closed") throw new DomainError("locked");
  if (!Number.isInteger(costSen) || costSen < 0) throw new DomainError("invalid_amount");
  const nowLocal = toLocal(now);
  const end = m.end && m.end < nowLocal ? m.end : nowLocal > m.start ? nowLocal : m.start;
  return { ...s, maintenance: s.maintenance.map((x) => (x.id === id ? { ...x, status: "closed", costSen, end } : x)) };
}

export function updateCustomer(s: AdminState, c: Customer): AdminState {
  if (c.fullName.trim().length < 2) throw new DomainError("required");
  return { ...s, customers: s.customers.map((x) => (x.id === c.id ? { ...c, notes: c.notes.slice(0, 2000) } : x)) };
}

export function updateRules(s: AdminState, rules: AdminState["rules"]): AdminState {
  const okInt = (n: number, min: number, max: number) => Number.isFinite(n) && n >= min && n <= max;
  if (!okInt(rules.minRentalHours, 1, 168) || !okInt(rules.maxRentalDays, 1, 365) || !okInt(rules.minLeadHours, 0, 168) ||
    !okInt(rules.openHour, 0, 23) || !okInt(rules.closeHour, 1, 24) || rules.closeHour <= rules.openHour ||
    !okInt(rules.graceMinutes, 0, 240) || !okInt(rules.turnaroundMinutes, 0, 1440) || !okInt(rules.taxRate, 0, 0.2))
    throw new DomainError("invalid_rules");
  return { ...s, rules };
}

/** Import booking requests submitted on the public site (same browser, demo only). */
export interface WebRequest {
  ref: string; createdAt: string; vehicle: { slug: string }; pickup: string; return: string; locationId: string;
  customer: { fullName: string; phone: string; email: string }; notes: string; quote: AdminBooking["quote"];
  addOns?: SelectedAddOn[];
}
export function importWebRequests(s: AdminState, reqs: WebRequest[]): AdminState {
  let next = s;
  for (const r of reqs) {
    if (next.importedRefs.includes(r.ref) || next.bookings.some((b) => b.ref === r.ref)) continue;
    const v = next.vehicles.find((x) => x.slug === r.vehicle.slug);
    if (!v) continue;
    let customer = next.customers.find((c) => c.phone === r.customer.phone);
    const customers = [...next.customers];
    if (!customer) {
      customer = { id: newId("cus"), fullName: r.customer.fullName, phone: r.customer.phone, email: r.customer.email, notes: "", createdAt: r.createdAt };
      customers.push(customer);
    }
    const booking: AdminBooking = {
      id: newId("bk"), ref: r.ref, customerId: customer.id, vehicleId: v.id, pickup: r.pickup, return: r.return,
      locationId: r.locationId, addOns: r.quote.addOnLines.map((l) => ({ id: l.id, qty: l.qty })), status: "pending",
      quote: r.quote, extraCharges: [], source: "web", customerNotes: r.notes, internalNotes: "", createdAt: r.createdAt,
      history: [{ from: null, to: "pending", at: r.createdAt, by: "web" }],
    };
    next = { ...next, customers, bookings: [booking, ...next.bookings], importedRefs: [...next.importedRefs, r.ref] };
  }
  return next;
}

// ---------- dashboard ----------
export function isOnRoad(b: AdminBooking) { return b.status === "collected" || b.status === "active"; }

export function vehicleStateAt(s: AdminState, v: AdminVehicle, at: Date): "available" | "on_rent" | "maintenance" | "unavailable" {
  if (v.status !== "active") return "unavailable";
  const t = at.getTime();
  if (s.bookings.some((b) => b.vehicleId === v.id && isOnRoad(b))) return "on_rent";
  if (s.maintenance.some((m) => m.vehicleId === v.id && m.status === "open" && ms(m.start) <= t && (!m.end || ms(m.end) > t))) return "maintenance";
  return "available";
}

export function dashboardStats(s: AdminState, now = new Date()) {
  const count = (st: BookingStatus) => s.bookings.filter((b) => b.status === st).length;
  const t = now.getTime();
  const in48 = t + 48 * 3600_000;
  const todayLocal = toLocal(now).slice(0, 10);
  const monthKeys: string[] = [];
  const base = new Date(`${todayLocal.slice(0, 7)}-01T00:00:00Z`);
  for (let i = 5; i >= 0; i--) {
    const d = new Date(base); d.setUTCMonth(d.getUTCMonth() - i); monthKeys.push(d.toISOString().slice(0, 7));
  }
  const revenue = monthKeys.map((k) => ({
    month: k,
    sen: s.payments.filter((p) => toLocal(new Date(p.receivedAt)).slice(0, 7) === k)
      .reduce((tt, p) => tt + (p.kind === "rental" ? p.amountSen : p.kind === "refund" ? -p.amountSen : 0), 0),
  }));
  const open = s.bookings.filter((b) => OPEN.includes(b.status));
  return {
    total: s.bookings.length,
    pending: count("pending"),
    confirmed: count("confirmed"),
    onRoad: s.bookings.filter(isOnRoad).length,
    available: s.vehicles.filter((v) => vehicleStateAt(s, v, now) === "available").length,
    fleet: s.vehicles.filter((v) => v.status === "active").length,
    upcomingReturns: s.bookings.filter((b) => isOnRoad(b) && ms(b.return) <= in48).sort((a, b) => ms(a.return) - ms(b.return)),
    pickupsSoon: s.bookings.filter((b) => b.status === "confirmed" && ms(b.pickup) <= in48).sort((a, b) => ms(a.pickup) - ms(b.pickup)),
    overdue: s.bookings.filter((b) => isOnRoad(b) && ms(b.return) < t),
    revenue,
    revenueThisMonth: revenue[revenue.length - 1].sen,
    outstanding: open.reduce((tt, b) => tt + balanceOf(s, b).outstandingSen, 0),
    depositsHeld: s.bookings.reduce((tt, b) => tt + balanceOf(s, b).depositHeldSen, 0),
  };
}
