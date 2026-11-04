/**
 * DEMO configuration. Every value here is a placeholder for the sales prototype
 * and must be replaced with details verified by the business before go-live.
 */
import type { AddOn, BookingRules, Location, SeasonalRule, VehicleCategory } from "./types";

export const business = {
  name: "BEZ Car Rental",
  area: "Pengkalan Chepa, Kota Bharu, Kelantan",
  /** Placeholder — set the verified WhatsApp number (digits only, e.g. "60123456789"). */
  whatsappNumber: null as string | null,
  hours: { ms: "Setiap hari, 8:00 pagi – 9:00 malam (contoh)", en: "Daily, 8:00 am – 9:00 pm (sample)" },
  developer: "BinaLab",
};

export const categories: VehicleCategory[] = [
  { id: "hatchback", name: { ms: "Hatchback", en: "Hatchback" }, sort: 1, depositSen: 10000 },
  { id: "sedan", name: { ms: "Sedan", en: "Sedan" }, sort: 2, depositSen: 15000 },
  { id: "mpv", name: { ms: "MPV", en: "MPV" }, sort: 3, depositSen: 20000 },
  { id: "suv", name: { ms: "SUV", en: "SUV" }, sort: 4, depositSen: 30000 },
  { id: "pickup", name: { ms: "Pikap", en: "Pickup" }, sort: 5, depositSen: 30000 },
];

export const addOns: AddOn[] = [
  {
    id: "child_seat",
    name: { ms: "Kerusi keselamatan kanak-kanak", en: "Child safety seat" },
    description: { ms: "Untuk kanak-kanak 9–36 kg", en: "For children 9–36 kg" },
    pricing: "per_day",
    priceSen: 1000,
    maxQty: 2,
  },
  {
    id: "extra_driver",
    name: { ms: "Pemandu tambahan", en: "Additional driver" },
    description: { ms: "Seorang pemandu berdaftar tambahan", en: "One extra registered driver" },
    pricing: "per_booking",
    priceSen: 2000,
    maxQty: 2,
  },
  {
    id: "cover_plus",
    name: { ms: "Perlindungan Plus", en: "Cover Plus" },
    description: { ms: "Kurangkan liabiliti kerosakan (contoh)", en: "Reduced damage liability (sample)" },
    pricing: "per_day",
    priceSen: 1500,
    maxQty: 1,
  },
  {
    id: "phone_holder",
    name: { ms: "Pemegang telefon & pengecas", en: "Phone holder & charger" },
    description: { ms: "Pemegang dashboard dan kabel USB", en: "Dashboard mount and USB cable" },
    pricing: "per_booking",
    priceSen: 500,
    maxQty: 1,
  },
];

export const locations: Location[] = [
  { id: "office", name: { ms: "Pejabat BEZ, Pengkalan Chepa", en: "BEZ office, Pengkalan Chepa" }, type: "office", feeSen: 0 },
  { id: "airport", name: { ms: "Lapangan Terbang Sultan Ismail Petra", en: "Sultan Ismail Petra Airport" }, type: "airport", feeSen: 2000 },
  { id: "kb_delivery", name: { ms: "Hantar ke alamat di Kota Bharu", en: "Delivery within Kota Bharu" }, type: "delivery", feeSen: 3000 },
];

/** Sample festive-season rule (dates are illustrative). */
export const seasonalRules: SeasonalRule[] = [
  {
    id: "raya_2027",
    name: { ms: "Musim perayaan (contoh)", en: "Festive season (sample)" },
    from: "2027-03-06",
    to: "2027-03-16",
    surcharge: 0.2,
  },
  {
    id: "year_end_2026",
    name: { ms: "Cuti hujung tahun (contoh)", en: "Year-end holidays (sample)" },
    from: "2026-12-20",
    to: "2027-01-02",
    surcharge: 0.1,
  },
];

export const bookingRules: BookingRules = {
  minRentalHours: 24,
  maxRentalDays: 30,
  minLeadHours: 3,
  openHour: 8,
  closeHour: 21,
  graceMinutes: 60,
  turnaroundMinutes: 120,
  weeklyFromDays: 7,
  monthlyFromDays: 28,
  taxRate: 0,
};
