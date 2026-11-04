import { intlLocale, type Locale } from "./i18n/config";

/** Money is always stored as integer sen (1 RM = 100 sen). */
export function formatRM(sen: number, locale: Locale = "ms", opts: { decimals?: boolean } = {}): string {
  const decimals = opts.decimals ?? sen % 100 !== 0;
  return new Intl.NumberFormat(intlLocale(locale), {
    style: "currency",
    currency: "MYR",
    currencyDisplay: "code",
    minimumFractionDigits: decimals ? 2 : 0,
    maximumFractionDigits: decimals ? 2 : 0,
  })
    .format(sen / 100)
    .replace("MYR", "RM")
    .replace(/RM\s?/, "RM ");
}
