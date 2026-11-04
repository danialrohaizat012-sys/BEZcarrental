/**
 * Data access for the demo. Backed by in-memory mock data in Phase 2;
 * in Phase 4 these functions are reimplemented against Supabase with the same signatures.
 */
import { addOns, bookingRules, categories, locations, seasonalRules } from "./catalog";
import { vehicles } from "./vehicles";
import type { BusyRange, Vehicle } from "./types";
import { addDaysLocal, fromLocal, todayLocal } from "../time";

export const getVehicles = (): Vehicle[] => vehicles.filter((v) => v.status === "active");
export const getVehicleBySlug = (slug: string) => vehicles.find((v) => v.slug === slug && v.status === "active");
export const getCategories = () => [...categories].sort((a, b) => a.sort - b.sort);
export const getCategory = (id: string) => categories.find((c) => c.id === id);
export const getAddOns = () => addOns;
export const getLocations = () => locations;
export const getSeasonalRules = () => seasonalRules;
export const getBookingRules = () => bookingRules;

/**
 * Sample reservations and maintenance blocks, generated relative to "today" (MYT)
 * so the demo always has realistic upcoming activity. Contains no customer data.
 */
export type BlockSeed = [slug: string, fromDay: number, fromTime: string, toDay: number, toTime: string, kind: BusyRange["kind"]];
export const blockSeeds: BlockSeed[] = [
  ["perodua-myvi", 1, "09:00", 4, "09:00", "booking"],
  ["perodua-myvi", 9, "10:00", 12, "18:00", "booking"],
  ["honda-city", -2, "10:00", 2, "10:00", "booking"],
  ["honda-city", 6, "08:30", 8, "20:00", "booking"],
  ["perodua-alza", 0, "08:00", 3, "17:00", "maintenance"],
  ["perodua-alza", 7, "09:00", 11, "09:00", "booking"],
  ["proton-x70", 4, "12:00", 9, "12:00", "booking"],
  ["toyota-innova", 2, "10:00", 6, "10:00", "booking"],
  ["toyota-innova", 14, "10:00", 17, "10:00", "booking"],
  ["toyota-vios", 3, "15:00", 5, "15:00", "booking"],
  ["perodua-axia", 10, "09:00", 13, "09:00", "booking"],
  ["toyota-hilux", 1, "08:00", 2, "18:00", "maintenance"],
  ["toyota-hilux", 5, "07:00", 12, "07:00", "booking"],
  ["perodua-aruz", 0, "10:00", 1, "10:00", "booking"],
];

export function getBusyRanges(vehicleId?: string, now = new Date()): BusyRange[] {
  const today = todayLocal(now);
  return blockSeeds
    .map(([slug, fd, ft, td, tt, kind]) => {
      const v = vehicles.find((x) => x.slug === slug);
      if (!v) return null;
      return {
        vehicleId: v.id,
        start: fromLocal(`${addDaysLocal(today, fd)}T${ft}`).toISOString(),
        end: fromLocal(`${addDaysLocal(today, td)}T${tt}`).toISOString(),
        kind,
      } satisfies BusyRange;
    })
    .filter((r): r is BusyRange => r !== null && (!vehicleId || r.vehicleId === vehicleId));
}

/**
 * True when [pickup, return) does not overlap any busy range, including the
 * turnaround buffer for cleaning/inspection between rentals.
 * NOTE: in Phase 4 this is enforced by a Postgres exclusion constraint + locking trigger.
 */
export function isVehicleAvailable(vehicleId: string, pickup: Date, ret: Date, now = new Date()): boolean {
  const buffer = bookingRules.turnaroundMinutes * 60_000;
  return !getBusyRanges(vehicleId, now).some((r) => {
    const s = Date.parse(r.start) - buffer;
    const e = Date.parse(r.end) + buffer;
    return pickup.getTime() < e && s < ret.getTime();
  });
}

/** Context needed by the pricing engine for a vehicle. */
export function quoteContext(vehicle: Vehicle) {
  const category = getCategory(vehicle.categoryId);
  if (!category) throw new Error(`Unknown category ${vehicle.categoryId}`);
  return { rules: bookingRules, addOns, locations, seasonalRules, category };
}
