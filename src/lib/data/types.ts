/**
 * Domain types. These mirror the proposed Supabase schema (docs/PLAN.md §5)
 * so the mock repository can be swapped for a database in Phase 4.
 */

export type Bilingual = { ms: string; en: string };

export type CategoryId = "hatchback" | "sedan" | "mpv" | "suv" | "pickup";
export type BodyStyle = "hatchback" | "sedan" | "mpv" | "suv" | "pickup";

export interface VehicleCategory {
  id: CategoryId;
  name: Bilingual;
  sort: number;
  /** Refundable security deposit, in sen */
  depositSen: number;
}

export interface VehicleImage {
  src: string;
  alt: Bilingual;
  /** Attribution for licensed photos, e.g. "Photo: Jane Doe / CC BY-SA 4.0" */
  credit?: string;
}

export interface Vehicle {
  id: string;
  slug: string;
  make: string;
  model: string;
  variant: string;
  year: number;
  categoryId: CategoryId;
  body: BodyStyle;
  transmission: "auto" | "manual";
  seats: number;
  /** Number of medium suitcases */
  luggage: number;
  fuel: "petrol" | "diesel" | "hybrid";
  engine: string;
  /** Paint colour used for the illustration fallback */
  color: string;
  features: string[]; // keys into dictionary.features
  images: VehicleImage[];
  rates: VehicleRates;
  status: "active" | "unavailable";
  isDemo: true;
}

/** All amounts in sen per day / per hour. Weekly & monthly are per-day prices for long rentals. */
export interface VehicleRates {
  hourly: number;
  daily: number;
  weekly: number;
  monthly: number;
}

export interface AddOn {
  id: string;
  name: Bilingual;
  description: Bilingual;
  pricing: "per_day" | "per_booking";
  priceSen: number;
  maxQty: number;
}

export interface Location {
  id: string;
  name: Bilingual;
  type: "office" | "airport" | "delivery";
  feeSen: number;
}

export interface SeasonalRule {
  id: string;
  name: Bilingual;
  /** Inclusive local dates "YYYY-MM-DD" */
  from: string;
  to: string;
  /** Surcharge on the base daily rate, e.g. 0.2 = +20% */
  surcharge: number;
}

export interface BookingRules {
  minRentalHours: number;
  maxRentalDays: number;
  minLeadHours: number;
  openHour: number;
  closeHour: number;
  graceMinutes: number;
  turnaroundMinutes: number;
  weeklyFromDays: number;
  monthlyFromDays: number;
  taxRate: number; // e.g. 0.08; 0 = off
}

/** A time range during which a vehicle cannot be booked. Never carries customer data. */
export interface BusyRange {
  vehicleId: string;
  /** ISO instants */
  start: string;
  end: string;
  kind: "booking" | "maintenance";
}
