import { describe, expect, it } from "vitest";
import { buildSeed } from "@/lib/admin/seed";
import {
  addMaintenance, assignVehicle, balanceOf, changeDates, conflictsFor, dashboardStats, DomainError,
  importWebRequests, pendingClashes, recordPayment, transition,
} from "@/lib/admin/domain";
import { addDaysLocal, todayLocal } from "@/lib/time";

const NOW = new Date("2026-11-04T02:00:00Z");
const today = todayLocal(NOW);
const fresh = () => buildSeed(NOW);
const by = { by: "test", now: NOW };
const code = (fn: () => unknown) => { try { fn(); } catch (e) { return (e as DomainError).code; } return null; };

describe("seed", () => {
  it("has no overlapping blocking bookings", () => {
    const s = fresh();
    for (const b of s.bookings.filter((x) => ["confirmed", "collected", "active"].includes(x.status))) {
      expect(conflictsFor(s, b.vehicleId, b.pickup, b.return, b.id).filter((c) => c.kind === "booking")).toEqual([]);
    }
  });
});

describe("status machine", () => {
  it("follows Pending → Confirmed → Collected → Active → Returned → Completed", () => {
    let s = fresh();
    const b = s.bookings.find((x) => x.status === "pending" && x.vehicleId === s.vehicles.find((v) => v.slug === "proton-saga")!.id)!;
    s = transition(s, b.id, "confirmed", by);
    s = transition(s, b.id, "collected", by);
    s = transition(s, b.id, "active", by);
    s = transition(s, b.id, "returned", by);
    expect(code(() => transition(s, b.id, "completed", by))).toBe("outstanding_balance");
    s = recordPayment(s, { bookingId: b.id, kind: "rental", method: "cash", amountSen: balanceOf(s, b).outstandingSen, reference: "", receivedAt: NOW.toISOString(), recordedBy: "t" });
    s = transition(s, b.id, "completed", by);
    const done = s.bookings.find((x) => x.id === b.id)!;
    expect(done.status).toBe("completed");
    expect(done.history.map((h) => h.to)).toEqual(["pending", "confirmed", "collected", "active", "returned", "completed"]);
  });
  it("rejects invalid transitions and requires a reason to reject", () => {
    const s = fresh();
    const p = s.bookings.find((x) => x.status === "pending")!;
    expect(code(() => transition(s, p.id, "active", by))).toBe("invalid_transition");
    expect(code(() => transition(s, p.id, "rejected", by))).toBe("reason_required");
    const done = s.bookings.find((x) => x.status === "completed")!;
    expect(code(() => transition(s, done.id, "cancelled", by))).toBe("invalid_transition");
  });
});

describe("conflict prevention", () => {
  it("blocks approving a request that overlaps a confirmed booking", () => {
    const s = fresh();
    const city = s.vehicles.find((v) => v.slug === "honda-city")!;
    const clash = s.bookings.find((b) => b.vehicleId === city.id && b.status === "pending")!;
    expect(code(() => transition(s, clash.id, "confirmed", by))).toBe("conflict");
  });
  it("lists other pending requests that clash", () => {
    let s = fresh();
    const saga = s.vehicles.find((v) => v.slug === "proton-saga")!;
    const p = s.bookings.find((b) => b.vehicleId === saga.id && b.status === "pending")!;
    s = { ...s, bookings: [...s.bookings, { ...p, id: "dup", ref: "BEZ-DUP001" }] };
    expect(pendingClashes(s, p).map((b) => b.id)).toEqual(["dup"]);
    s = transition(s, p.id, "confirmed", by);
    expect(code(() => transition(s, "dup", "confirmed", by))).toBe("conflict");
  });
  it("blocks bookings during maintenance and maintenance over confirmed bookings", () => {
    let s = fresh();
    const axia = s.vehicles.find((v) => v.slug === "perodua-axia")!;
    s = addMaintenance(s, { vehicleId: axia.id, type: "repair", description: "", start: `${addDaysLocal(today, 1)}T08:00`, end: `${addDaysLocal(today, 3)}T08:00`, costSen: 0 });
    expect(conflictsFor(s, axia.id, `${addDaysLocal(today, 2)}T10:00`, `${addDaysLocal(today, 4)}T10:00`)).toHaveLength(1);
    const x70 = s.vehicles.find((v) => v.slug === "proton-x70")!;
    expect(code(() => addMaintenance(s, { vehicleId: x70.id, type: "service", description: "", start: `${addDaysLocal(today, 5)}T08:00`, end: `${addDaysLocal(today, 6)}T08:00`, costSen: 0 }))).toBe("conflict");
  });
  it("re-checks conflicts when changing dates or vehicle of a confirmed booking", () => {
    const s = fresh();
    const x70 = s.vehicles.find((v) => v.slug === "proton-x70")!;
    const city = s.vehicles.find((v) => v.slug === "honda-city")!;
    const bezza = s.vehicles.find((v) => v.slug === "perodua-bezza")!;
    const b = s.bookings.find((x) => x.vehicleId === x70.id && x.status === "confirmed")!;
    const cityConfirmed = s.bookings.find((x) => x.vehicleId === city.id && x.status === "confirmed")!;
    expect(code(() => assignVehicle(s, b.id, bezza.id, "t"))).toBeNull();
    expect(code(() => assignVehicle(s, b.id, city.id, "t"))).toBe("conflict");
    // moving the City booking onto its own active rental's dates must fail
    const cityActive = s.bookings.find((x) => x.vehicleId === city.id && x.status === "active")!;
    expect(code(() => changeDates(s, cityConfirmed.id, cityActive.pickup, cityActive.return, "t"))).toBe("conflict");
    expect(code(() => changeDates(s, cityConfirmed.id, `${addDaysLocal(today, 20)}T10:00`, `${addDaysLocal(today, 22)}T10:00`, "t"))).toBeNull();
  });
});

describe("money", () => {
  it("tracks outstanding balance, deposits and refund limits", () => {
    let s = fresh();
    const b = s.bookings.find((x) => x.status === "pending")!;
    expect(balanceOf(s, b).outstandingSen).toBe(b.quote.totalSen);
    s = recordPayment(s, { bookingId: b.id, kind: "deposit", method: "cash", amountSen: b.quote.depositSen, reference: "", receivedAt: NOW.toISOString(), recordedBy: "t" });
    expect(balanceOf(s, b).depositStatus).toBe("held");
    expect(code(() => recordPayment(s, { bookingId: b.id, kind: "deposit_refund", method: "cash", amountSen: b.quote.depositSen + 1, reference: "", receivedAt: NOW.toISOString(), recordedBy: "t" }))).toBe("exceeds_deposit");
    expect(code(() => recordPayment(s, { bookingId: b.id, kind: "refund", method: "cash", amountSen: 100, reference: "", receivedAt: NOW.toISOString(), recordedBy: "t" }))).toBe("exceeds_paid");
  });
  it("adds a late charge automatically on late return", () => {
    let s = fresh();
    const b = s.bookings.find((x) => x.status === "active")!;
    const late = new Date(new Date(`${b.return}:00+08:00`).getTime() + 5 * 3600_000);
    s = transition(s, b.id, "returned", { by: "t", now: late });
    const after = s.bookings.find((x) => x.id === b.id)!;
    expect(after.extraCharges.find((c) => c.type === "late")?.note).toBe("4h late");
  });
});

describe("web request import + stats", () => {
  it("imports a public booking request once, as pending", () => {
    const s = fresh();
    const q = s.bookings[0].quote;
    const req = { ref: "BEZ-WEB001", createdAt: NOW.toISOString(), vehicle: { slug: "perodua-bezza" }, pickup: `${addDaysLocal(today, 3)}T10:00`,
      return: `${addDaysLocal(today, 5)}T10:00`, locationId: "office", customer: { fullName: "Web User", phone: "+60129999999", email: "" }, notes: "", quote: q };
    const once = importWebRequests(s, [req]);
    const twice = importWebRequests(once, [req]);
    expect(twice.bookings.filter((b) => b.ref === "BEZ-WEB001")).toHaveLength(1);
    expect(twice.bookings.find((b) => b.ref === "BEZ-WEB001")!.status).toBe("pending");
    expect(dashboardStats(twice, NOW).pending).toBe(dashboardStats(s, NOW).pending + 1);
  });
});
