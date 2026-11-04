import en, { type Dictionary } from "./dictionaries/en";
import ms from "./dictionaries/ms";
import type { Locale } from "./config";
import type { Bilingual } from "../data/types";

const dictionaries: Record<Locale, Dictionary> = { en, ms };

/** Synchronous so it works in both server and client components. */
export const getDictionary = (locale: Locale): Dictionary => dictionaries[locale];
export const pick = (b: Bilingual, locale: Locale) => b[locale];
export type { Dictionary };
export * from "./config";
