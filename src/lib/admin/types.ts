import type { SelectedAddOn, Quote } from "../pricing";
import type { BookingRules, Vehicle } from "../data/types";

/** Mirrors `bookings.status` in the proposed schema (docs/PLAN.md §4). */
export type BookingStatus =
  | "pending"
  | "confirmed"
  | "collected"
  | "active"
  | "returned"
  | "completed"
  | "cancelled"
  | "rejected";

export interface StatusEvent {
  from: BookingStatus | null;
  to: BookingStatus;
  at: string; // ISO
  by: string;
  reason?: string;
}

export interface ExtraCharge {
  id: string;
  type: "late" | "fuel" | "damage" | "cleaning" | "other";
  amountSen: number;
  note: string;
  at: string;
}

export interface AdminBooking {
  id: string;
  ref: string;
  customerId: string;
  vehicleId: string;
  pickup: string; // local MYT "YYYY-MM-DDTHH:mm"
  return: string;
  locationId: string;
  addOns: SelectedAddOn[];
  status: BookingStatus;
  quote: Quote;
  extraCharges: ExtraCharge[];
  source: "web" | "phone" | "walk_in" | "seed";
  customerNotes: string;
  internalNotes: string;
  createdAt: string;
  history: StatusEvent[];
}

export type PaymentKind = "rental" | "deposit" | "deposit_refund" | "refund";
export type PaymentMethod = "cash" | "bank_transfer" | "duitnow" | "card_manual";

export interface Payment {
  id: string;
  bookingId: string;
  kind: PaymentKind;
  method: PaymentMethod;
  amountSen: number;
  reference: string;
  receivedAt: string; // ISO
  recordedBy: string;
}

export interface Customer {
  id: string;
  fullName: string;
  phone: string; // +60…
  email: string;
  notes: string;
  createdAt: string;
}

export interface MaintenanceRecord {
  id: string;
  vehicleId: string;
  type: "service" | "repair" | "inspection" | "tyres" | "cleaning" | "other";
  description: string;
  start: string; // local
  end: string | null; // local; null = until closed
  costSen: number;
  status: "open" | "closed";
}

export interface AdminVehicle extends Vehicle {
  plateNo: string;
  mileageKm: number;
}

export interface AdminState {
  version: 1;
  seededAt: string;
  vehicles: AdminVehicle[];
  customers: Customer[];
  bookings: AdminBooking[];
  payments: Payment[];
  maintenance: MaintenanceRecord[];
  rules: BookingRules;
  importedRefs: string[];
}

export interface Balance {
  dueSen: number;
  paidSen: number;
  refundedSen: number;
  outstandingSen: number;
  depositRequiredSen: number;
  depositHeldSen: number;
  depositRefundedSen: number;
  depositStatus: "not_collected" | "held" | "refunded" | "partial";
  refundStatus: "none" | "due" | "refunded";
}
