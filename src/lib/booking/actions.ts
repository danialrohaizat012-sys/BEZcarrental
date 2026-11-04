"use server";

import { randomBytes } from "node:crypto";
import {
  getAddOns,
  getBookingRules,
  getCategory,
  getLocations,
  getSeasonalRules,
  getVehicleBySlug,
  isVehicleAvailable,
} from "../data/repository";
import { calculateQuote, QuoteError, validatePeriod } from "../pricing";
import { fromLocal } from "../time";
import { bookingRequestSchema, normaliseMyPhone, type BookingResult, type DemoBooking } from "./schema";

const REF_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O/1/I

function newRef(): string {
  const bytes = randomBytes(6);
  return "BEZ-" + Array.from(bytes, (b) => REF_ALPHABET[b % REF_ALPHABET.length]).join("");
}

/** Live availability check for the booking form. Returns no customer data. */
export async function checkAvailability(vehicleSlug: string, pickup: string, ret: string) {
  const vehicle = getVehicleBySlug(String(vehicleSlug));
  if (!vehicle) return { ok: false as const, error: "not_found" as const };
  const periodError = validatePeriod(String(pickup), String(ret), getBookingRules());
  if (periodError) return { ok: false as const, error: "period" as const, detail: periodError };
  return { ok: true as const, available: isVehicleAvailable(vehicle.id, fromLocal(pickup), fromLocal(ret)) };
}

/**
 * Submit a booking request. Everything is re-validated and re-priced on the server;
 * the client's estimate is never trusted. Bookings always start as "pending".
 *
 * DEMO NOTE: nothing is persisted in Phase 2 — the result is returned to the browser
 * only. Phase 4 replaces this with a Supabase RPC that inserts inside a transaction
 * guarded by the exclusion constraint.
 */
export async function submitBookingRequest(raw: unknown): Promise<BookingResult> {
  const parsed = bookingRequestSchema.safeParse(raw);
  if (!parsed.success) {
    const fields = [...new Set(parsed.error.issues.map((i) => String(i.path[0] ?? "form")))];
    return { ok: false, error: "validation", fields };
  }
  const input = parsed.data;

  const vehicle = getVehicleBySlug(input.vehicleSlug);
  const category = vehicle && getCategory(vehicle.categoryId);
  if (!vehicle || !category) return { ok: false, error: "not_found" };
  if (!getLocations().some((l) => l.id === input.locationId)) return { ok: false, error: "validation", fields: ["locationId"] };

  const rules = getBookingRules();
  const periodError = validatePeriod(input.pickup, input.return, rules);
  if (periodError) return { ok: false, error: "period", detail: periodError };

  if (!isVehicleAvailable(vehicle.id, fromLocal(input.pickup), fromLocal(input.return))) {
    return { ok: false, error: "unavailable" };
  }

  try {
    const quote = calculateQuote(vehicle, input.pickup, input.return, input.addOns, input.locationId, {
      rules,
      addOns: getAddOns(),
      locations: getLocations(),
      seasonalRules: getSeasonalRules(),
      category,
    });
    const booking: DemoBooking = {
      ref: newRef(),
      status: "pending",
      createdAt: new Date().toISOString(),
      vehicle: { slug: vehicle.slug, make: vehicle.make, model: vehicle.model, variant: vehicle.variant },
      pickup: input.pickup,
      return: input.return,
      locationId: input.locationId,
      customer: { fullName: input.fullName, phone: normaliseMyPhone(input.phone)!, email: input.email },
      notes: input.notes,
      quote,
      isDemo: true,
    };
    return { ok: true, booking };
  } catch (e) {
    if (e instanceof QuoteError) return { ok: false, error: "validation", fields: ["addOns"] };
    console.error(e);
    return { ok: false, error: "server" };
  }
}
