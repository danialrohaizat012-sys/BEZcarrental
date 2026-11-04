import { describe, expect, it } from "vitest";
import { getVehicleBySlug, isVehicleAvailable, getBusyRanges, quoteContext } from "@/lib/data/repository";
import { calculateQuote, QuoteError, validatePeriod } from "@/lib/pricing";
import { bookingRules } from "@/lib/data/catalog";
import { normaliseMyPhone } from "@/lib/booking/schema";
import { fromLocal, isLocalDateTime, toLocal } from "@/lib/time";

const myvi = getVehicleBySlug("perodua-myvi")!; // RM110/day, RM19/hour
const ctx = quoteContext(myvi);
const NOW = new Date("2026-11-04T02:00:00Z"); // 10:00 MYT

describe("time (Asia/Kuala_Lumpur)", () => {
  it("round-trips local wall-clock values", () => {
    expect(fromLocal("2026-11-05T10:00").toISOString()).toBe("2026-11-05T02:00:00.000Z");
    expect(toLocal(new Date("2026-11-05T02:00:00Z"))).toBe("2026-11-05T10:00");
  });
  it("rejects impossible dates", () => {
    expect(isLocalDateTime("2026-02-30T10:00")).toBe(false);
    expect(isLocalDateTime("2026-11-05 10:00")).toBe(false);
  });
});

describe("validatePeriod", () => {
  it("requires return after pickup", () => {
    expect(validatePeriod("2026-11-06T10:00", "2026-11-06T10:00", bookingRules, NOW)).toBe("return_before_pickup");
    expect(validatePeriod("2026-11-07T10:00", "2026-11-06T10:00", bookingRules, NOW)).toBe("return_before_pickup");
  });
  it("enforces minimum duration, lead time, opening hours and max length", () => {
    expect(validatePeriod("2026-11-06T10:00", "2026-11-06T20:00", bookingRules, NOW)).toBe("too_short");
    expect(validatePeriod("2026-11-04T11:00", "2026-11-05T11:00", bookingRules, NOW)).toBe("lead_time");
    expect(validatePeriod("2026-11-06T07:00", "2026-11-07T10:00", bookingRules, NOW)).toBe("outside_hours");
    expect(validatePeriod("2026-11-06T10:00", "2026-12-10T10:00", bookingRules, NOW)).toBe("too_long");
    expect(validatePeriod("2026-11-06T10:00", "2026-11-08T10:00", bookingRules, NOW)).toBeNull();
  });
});

describe("calculateQuote", () => {
  it("charges full days at the daily rate", () => {
    const q = calculateQuote(myvi, "2026-11-06T10:00", "2026-11-08T10:00", [], "office", ctx);
    expect(q.days).toBe(2);
    expect(q.tier).toBe("daily");
    expect(q.totalSen).toBe(22000);
    expect(q.depositSen).toBe(10000);
  });
  it("applies the grace period, then hourly charges", () => {
    expect(calculateQuote(myvi, "2026-11-06T10:00", "2026-11-08T11:00", [], "office", ctx).extraHours).toBe(0);
    const q = calculateQuote(myvi, "2026-11-06T10:00", "2026-11-08T13:00", [], "office", ctx);
    expect(q.extraHours).toBe(3);
    expect(q.extraHoursSen).toBe(3 * myvi.rates.hourly);
  });
  it("caps extra hours at one day", () => {
    const q = calculateQuote(myvi, "2026-11-06T10:00", "2026-11-08T20:00", [], "office", ctx);
    expect(q.days).toBe(3);
    expect(q.extraHours).toBe(0);
    expect(q.totalSen).toBe(3 * myvi.rates.daily);
  });
  it("switches to the weekly rate from 7 days", () => {
    const q = calculateQuote(myvi, "2026-11-06T10:00", "2026-11-13T10:00", [], "office", ctx);
    expect(q.tier).toBe("weekly");
    expect(q.baseSen).toBe(7 * myvi.rates.weekly);
  });
  it("adds per-day and per-booking extras and location fees", () => {
    const q = calculateQuote(myvi, "2026-11-06T10:00", "2026-11-08T10:00",
      [{ id: "child_seat", qty: 2 }, { id: "extra_driver", qty: 1 }], "airport", ctx);
    expect(q.addOnsSen).toBe(2 * 1000 * 2 + 2000);
    expect(q.locationFeeSen).toBe(2000);
    expect(q.totalSen).toBe(22000 + 6000 + 2000);
  });
  it("applies seasonal surcharge per day inside the window", () => {
    const q = calculateQuote(myvi, "2026-12-19T10:00", "2026-12-22T10:00", [], "office", ctx);
    expect(q.seasonal?.days).toBe(2); // 20th and 21st
    expect(q.seasonal?.amountSen).toBe(Math.round(2 * 11000 * 0.1));
  });
  it("rejects unknown or excessive add-ons", () => {
    expect(() => calculateQuote(myvi, "2026-11-06T10:00", "2026-11-08T10:00", [{ id: "x", qty: 1 }], "office", ctx)).toThrow(QuoteError);
    expect(() => calculateQuote(myvi, "2026-11-06T10:00", "2026-11-08T10:00", [{ id: "cover_plus", qty: 2 }], "office", ctx)).toThrow(QuoteError);
  });
});

describe("availability", () => {
  it("blocks overlapping periods including the turnaround buffer", () => {
    const [r] = getBusyRanges(myvi.id, NOW);
    const end = new Date(r.end);
    // starting right at the end of a booking falls inside the 2h buffer
    expect(isVehicleAvailable(myvi.id, end, new Date(end.getTime() + 86400_000), NOW)).toBe(false);
    const later = new Date(end.getTime() + 3 * 3600_000);
    expect(isVehicleAvailable(myvi.id, later, new Date(later.getTime() + 86400_000), NOW)).toBe(true);
  });
  it("blocks maintenance windows", () => {
    const alza = getVehicleBySlug("perodua-alza")!;
    const m = getBusyRanges(alza.id, NOW).find((b) => b.kind === "maintenance")!;
    const s = new Date(Date.parse(m.start) + 3600_000);
    expect(isVehicleAvailable(alza.id, s, new Date(s.getTime() + 86400_000), NOW)).toBe(false);
  });
});

describe("phone validation", () => {
  it("accepts common Malaysian mobile formats", () => {
    expect(normaliseMyPhone("012-345 6789")).toBe("+60123456789");
    expect(normaliseMyPhone("+6011-1234 5678")).toBe("+601112345678");
    expect(normaliseMyPhone("03-1234 5678")).toBeNull();
    expect(normaliseMyPhone("12345")).toBeNull();
  });
});
