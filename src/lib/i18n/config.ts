export const locales = ["ms", "en"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "ms";

export const hasLocale = (value: string): value is Locale =>
  (locales as readonly string[]).includes(value);

/** Intl locale tag used for number/date formatting. */
export const intlLocale = (l: Locale) => (l === "ms" ? "ms-MY" : "en-MY");
