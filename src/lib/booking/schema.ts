import { z } from "zod";
import type { Quote } from "../pricing";

/** Malaysian mobile numbers: 01X-XXXXXXX(X), with optional +60 / 60 prefix. */
export function normaliseMyPhone(input: string): string | null {
  const digits = input.replace(/[\s\-()]/g, "");
  const m = /^(?:\+?60|0)(1[0-9])(\d{7,8})$/.exec(digits);
  return m ? `+60${m[1]}${m[2]}` : null;
}

export const bookingRequestSchema = z.object({
  vehicleSlug: z.string().min(1).max(80),
  pickup: z.string(),
  return: z.string(),
  locationId: z.string().min(1).max(40),
  addOns: z.array(z.object({ id: z.string().max(40), qty: z.number().int().min(0).max(5) })).max(10),
  fullName: z.string().trim().min(3, "name").max(100, "name"),
  phone: z.string().trim().max(20).refine((v) => normaliseMyPhone(v) !== null, "phone"),
  email: z
    .string()
    .trim()
    .max(120)
    .refine((v) => v === "" || z.email().safeParse(v).success, "email")
    .optional()
    .default(""),
  notes: z.string().trim().max(500, "notes").optional().default(""),
  consent: z.literal(true, { error: "consent" }),
  /** Honeypot — must stay empty */
  website: z.string().max(0).optional().default(""),
});

export type BookingRequestInput = z.input<typeof bookingRequestSchema>;

export interface DemoBooking {
  ref: string;
  status: "pending";
  createdAt: string;
  vehicle: { slug: string; make: string; model: string; variant: string };
  pickup: string;
  return: string;
  locationId: string;
  customer: { fullName: string; phone: string; email: string };
  notes: string;
  quote: Quote;
  isDemo: true;
}

export type BookingResult =
  | { ok: true; booking: DemoBooking }
  | { ok: false; error: "validation"; fields: string[] }
  | { ok: false; error: "unavailable" | "period" | "not_found" | "server"; detail?: string };
