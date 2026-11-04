/**
 * SAMPLE FLEET for the demo. These are common Malaysian-market models with
 * illustrative prices. They are NOT BEZ Car Rental's actual fleet or rates.
 */
import type { Vehicle } from "./types";

const rm = (n: number) => Math.round(n * 100);

type Seed = Omit<Vehicle, "id" | "isDemo" | "status" | "images" | "rates"> & {
  daily: number;
  status?: Vehicle["status"];
};

/** Derive hourly/weekly/monthly from the daily price (sample pricing rules). */
function rates(daily: number) {
  return {
    hourly: rm(Math.ceil(daily / 6)),
    daily: rm(daily),
    weekly: rm(Math.round(daily * 0.88)),
    monthly: rm(Math.round(daily * 0.72)),
  };
}

const seeds: Seed[] = [
  {
    slug: "perodua-axia", make: "Perodua", model: "Axia", variant: "1.0 AV", year: 2024, categoryId: "hatchback", body: "hatchback",
    transmission: "auto", seats: 5, luggage: 1, fuel: "petrol", engine: "1.0L", color: "#b8433a", daily: 90,
    features: ["ac", "bluetooth", "usb", "reverse_camera", "safety_assist"],
  },
  {
    slug: "perodua-myvi", make: "Perodua", model: "Myvi", variant: "1.5 AV", year: 2024, categoryId: "hatchback", body: "hatchback",
    transmission: "auto", seats: 5, luggage: 2, fuel: "petrol", engine: "1.5L", color: "#2d4f7c", daily: 110,
    features: ["ac", "bluetooth", "usb", "reverse_camera", "keyless", "safety_assist"],
  },
  {
    slug: "perodua-bezza", make: "Perodua", model: "Bezza", variant: "1.3 AV", year: 2023, categoryId: "sedan", body: "sedan",
    transmission: "auto", seats: 5, luggage: 3, fuel: "petrol", engine: "1.3L", color: "#c9ccd1", daily: 110,
    features: ["ac", "bluetooth", "usb", "reverse_camera", "keyless", "safety_assist"],
  },
  {
    slug: "proton-saga", make: "Proton", model: "Saga", variant: "1.3 Premium", year: 2024, categoryId: "sedan", body: "sedan",
    transmission: "auto", seats: 5, luggage: 3, fuel: "petrol", engine: "1.3L", color: "#e9e7e2", daily: 100,
    features: ["ac", "bluetooth", "usb", "reverse_camera"],
  },
  {
    slug: "honda-city", make: "Honda", model: "City", variant: "1.5 V", year: 2024, categoryId: "sedan", body: "sedan",
    transmission: "auto", seats: 5, luggage: 3, fuel: "petrol", engine: "1.5L i-VTEC", color: "#1c1f24", daily: 160,
    features: ["ac", "bluetooth", "carplay", "reverse_camera", "cruise", "keyless", "safety_assist", "airbags"],
  },
  {
    slug: "toyota-vios", make: "Toyota", model: "Vios", variant: "1.5 G", year: 2024, categoryId: "sedan", body: "sedan",
    transmission: "auto", seats: 5, luggage: 3, fuel: "petrol", engine: "1.5L", color: "#8d9399", daily: 150,
    features: ["ac", "bluetooth", "carplay", "reverse_camera", "keyless", "safety_assist", "airbags"],
  },
  {
    slug: "perodua-alza", make: "Perodua", model: "Alza", variant: "1.5 AV", year: 2024, categoryId: "mpv", body: "mpv",
    transmission: "auto", seats: 7, luggage: 3, fuel: "petrol", engine: "1.5L", color: "#6b2a2f", daily: 180,
    features: ["ac", "rear_ac", "bluetooth", "carplay", "reverse_camera", "keyless", "safety_assist"],
  },
  {
    slug: "perodua-aruz", make: "Perodua", model: "Aruz", variant: "1.5 AV", year: 2023, categoryId: "suv", body: "suv",
    transmission: "auto", seats: 7, luggage: 3, fuel: "petrol", engine: "1.5L", color: "#e4e1da", daily: 190,
    features: ["ac", "rear_ac", "bluetooth", "reverse_camera", "keyless", "roof_rails", "safety_assist"],
  },
  {
    slug: "proton-x50", make: "Proton", model: "X50", variant: "1.5T Executive", year: 2024, categoryId: "suv", body: "suv",
    transmission: "auto", seats: 5, luggage: 3, fuel: "petrol", engine: "1.5L Turbo", color: "#3e5a4a", daily: 200,
    features: ["ac", "bluetooth", "carplay", "reverse_camera", "cruise", "keyless", "safety_assist", "airbags"],
  },
  {
    slug: "proton-x70", make: "Proton", model: "X70", variant: "1.5 TGDi Premium", year: 2024, categoryId: "suv", body: "suv",
    transmission: "auto", seats: 5, luggage: 4, fuel: "petrol", engine: "1.5L Turbo", color: "#22313f", daily: 240,
    features: ["ac", "bluetooth", "carplay", "reverse_camera", "cruise", "keyless", "safety_assist", "airbags", "roof_rails"],
  },
  {
    slug: "toyota-innova", make: "Toyota", model: "Innova", variant: "2.0 G", year: 2023, categoryId: "mpv", body: "mpv",
    transmission: "auto", seats: 8, luggage: 4, fuel: "petrol", engine: "2.0L", color: "#a7abb0", daily: 260,
    features: ["ac", "rear_ac", "bluetooth", "reverse_camera", "cruise", "airbags"],
  },
  {
    slug: "toyota-hilux", make: "Toyota", model: "Hilux", variant: "2.4 V 4x4", year: 2023, categoryId: "pickup", body: "pickup",
    transmission: "auto", seats: 5, luggage: 6, fuel: "diesel", engine: "2.4L Diesel", color: "#7a2420", daily: 280,
    features: ["ac", "bluetooth", "reverse_camera", "cruise", "four_wd", "tow_hook", "airbags"],
  },
];

export const vehicles: Vehicle[] = seeds.map(({ daily, status, ...s }, i) => ({
  ...s,
  id: `v${String(i + 1).padStart(2, "0")}`,
  status: status ?? "active",
  images: [], // real photos to be added once a photo source is approved/reachable
  rates: rates(daily),
  isDemo: true,
}));
