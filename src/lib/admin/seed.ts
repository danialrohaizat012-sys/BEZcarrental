/**
 * DEMO DATA for the admin console. Generated relative to "now" so the demo always has
 * current activity. Names and phone numbers are fictitious placeholders.
 */
import { bookingRules } from "../data/catalog";
import { blockSeeds } from "../data/repository";
import { vehicles } from "../data/vehicles";
import { addDaysLocal, fromLocal, todayLocal } from "../time";
import { calculateQuote } from "../pricing";
import { addOns, categories, locations, seasonalRules } from "../data/catalog";
import type { AdminBooking, AdminState, AdminVehicle, BookingStatus, Customer, MaintenanceRecord, Payment } from "./types";

const customerSeeds: [string, string, string][] = [
  ["Nur Aisyah (demo)", "+60120000101", "aisyah@example.com"],
  ["Mohd Faiz (demo)", "+60120000102", ""],
  ["Siti Hajar (demo)", "+60120000103", "hajar@example.com"],
  ["Lim Wei Jie (demo)", "+60120000104", "weijie@example.com"],
  ["Ahmad Danial (demo)", "+60120000105", ""],
  ["Kavitha R. (demo)", "+60120000106", "kavitha@example.com"],
  ["Hafiz Kamal (demo)", "+60120000107", ""],
  ["Farah Nadia (demo)", "+60120000108", "farah@example.com"],
];

export function buildSeed(now = new Date()): AdminState {
  const today = todayLocal(now);
  const t = now.getTime();
  const createdBase = new Date(t - 200 * 86400_000).toISOString();

  const fleet: AdminVehicle[] = vehicles.map((v, i) => ({
    ...v,
    plateNo: `DEMO ${String(i + 1).padStart(2, "0")}`,
    mileageKm: 8000 + ((i * 7919) % 42000),
  }));
  const customers: Customer[] = customerSeeds.map(([fullName, phone, email], i) => ({
    id: `cus_${i + 1}`, fullName, phone, email, notes: i === 3 ? "Pelanggan korporat — invois bulanan (contoh)." : "", createdAt: createdBase,
  }));

  const bookings: AdminBooking[] = [];
  const payments: Payment[] = [];
  const maintenance: MaintenanceRecord[] = [];
  let n = 0;
  const ctx = (v: AdminVehicle) => ({ rules: bookingRules, addOns, locations, seasonalRules, category: categories.find((c) => c.id === v.categoryId)! });

  const add = (v: AdminVehicle, pickup: string, ret: string, status: BookingStatus, opts: { pay?: "full" | "deposit" | "none"; loc?: string; addOn?: boolean } = {}) => {
    n++;
    const sel = opts.addOn ? [{ id: "child_seat", qty: 1 }] : [];
    const loc = opts.loc ?? (n % 3 === 0 ? "airport" : "office");
    const quote = calculateQuote(v, pickup, ret, sel, loc, ctx(v));
    const created = new Date(fromLocal(pickup).getTime() - (3 + (n % 5)) * 86400_000).toISOString();
    const path: BookingStatus[] =
      status === "completed" ? ["pending", "confirmed", "collected", "active", "returned", "completed"]
      : status === "active" ? ["pending", "confirmed", "collected", "active"]
      : status === "confirmed" ? ["pending", "confirmed"]
      : status === "cancelled" ? ["pending", "cancelled"]
      : status === "rejected" ? ["pending", "rejected"] : ["pending"];
    const id = `bk_${n}`;
    bookings.push({
      id, ref: `BEZ-D${String(n).padStart(5, "0")}`, customerId: customers[n % customers.length].id, vehicleId: v.id,
      pickup, return: ret, locationId: loc, addOns: sel, status, quote, extraCharges: [], source: n % 4 === 0 ? "phone" : "seed",
      customerNotes: n % 5 === 0 ? "Penerbangan tiba 9:40 pagi (contoh)." : "", internalNotes: "", createdAt: created,
      history: path.map((to, i) => ({
        from: i === 0 ? null : path[i - 1], to, by: i === 0 ? "web" : "admin",
        at: new Date(Math.min(t, new Date(created).getTime() + i * 86400_000)).toISOString(),
        reason: to === "rejected" ? "Kenderaan tidak sesuai untuk tarikh diminta (contoh)" : to === "cancelled" ? "Pelanggan membatalkan (contoh)" : undefined,
      })),
    });
    const payAt = (local: string) => fromLocal(local).toISOString();
    if (opts.pay === "full" || opts.pay === "deposit") {
      payments.push({ id: `pay_${n}_d`, bookingId: id, kind: "deposit", method: "cash", amountSen: quote.depositSen, reference: "", receivedAt: payAt(pickup), recordedBy: "admin" });
    }
    if (opts.pay === "full") {
      payments.push({ id: `pay_${n}_r`, bookingId: id, kind: "rental", method: n % 2 ? "duitnow" : "bank_transfer", amountSen: quote.totalSen, reference: `TRX${1000 + n}`, receivedAt: payAt(pickup), recordedBy: "admin" });
    }
    if (status === "completed") {
      payments.push({ id: `pay_${n}_dr`, bookingId: id, kind: "deposit_refund", method: "cash", amountSen: quote.depositSen, reference: "", receivedAt: payAt(ret), recordedBy: "admin" });
    }
  };

  // History: completed rentals spread over the past ~5 months (drives revenue figures).
  for (let i = 0; i < 22; i++) {
    const v = fleet[(i * 5) % fleet.length];
    const startDay = -150 + i * 6 + (i % 3);
    const len = 2 + (i % 4);
    if (startDay + len >= -1) continue;
    add(v, `${addDaysLocal(today, startDay)}T10:00`, `${addDaysLocal(today, startDay + len)}T10:00`, "completed", { pay: "full", addOn: i % 4 === 1 });
  }

  // Current & upcoming activity, mirroring the public site's busy ranges.
  for (const [slug, fd, ft, td, tt, kind] of blockSeeds) {
    const v = fleet.find((x) => x.slug === slug)!;
    const pickup = `${addDaysLocal(today, fd)}T${ft}`, ret = `${addDaysLocal(today, td)}T${tt}`;
    if (kind === "maintenance") {
      maintenance.push({ id: `mnt_${maintenance.length + 1}`, vehicleId: v.id, type: fd === 0 ? "service" : "repair",
        description: fd === 0 ? "Servis berkala 40,000 km (contoh)" : "Tukar pad brek (contoh)", start: pickup, end: ret, costSen: fd === 0 ? 45000 : 32000, status: "open" });
      continue;
    }
    const started = fromLocal(pickup).getTime() <= t;
    const status: BookingStatus = started ? "active" : fd >= 9 ? "pending" : "confirmed";
    add(v, pickup, ret, status, { pay: status === "active" ? "full" : status === "confirmed" && fd % 2 === 0 ? "deposit" : "none" });
  }

  // A clashing pending request (to demonstrate conflict detection on approval) + closed outcomes.
  const city = fleet.find((x) => x.slug === "honda-city")!;
  add(city, `${addDaysLocal(today, 7)}T09:00`, `${addDaysLocal(today, 9)}T09:00`, "pending");
  const saga = fleet.find((x) => x.slug === "proton-saga")!;
  add(saga, `${addDaysLocal(today, 2)}T10:00`, `${addDaysLocal(today, 4)}T10:00`, "pending", { loc: "kb_delivery", addOn: true });
  add(saga, `${addDaysLocal(today, -20)}T10:00`, `${addDaysLocal(today, -18)}T10:00`, "cancelled");
  add(fleet[10], `${addDaysLocal(today, 20)}T10:00`, `${addDaysLocal(today, 23)}T10:00`, "rejected");

  maintenance.push({ id: `mnt_${maintenance.length + 1}`, vehicleId: fleet[2].id, type: "tyres", description: "Tukar 4 tayar (contoh)",
    start: `${addDaysLocal(today, -40)}T09:00`, end: `${addDaysLocal(today, -40)}T17:00`, costSen: 88000, status: "closed" });

  return {
    version: 1, seededAt: now.toISOString(), vehicles: fleet, customers, bookings, payments, maintenance,
    rules: { ...bookingRules }, importedRefs: [],
  };
}
