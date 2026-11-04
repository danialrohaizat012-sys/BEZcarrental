import type { AddOn, Location, SeasonalRule } from "@/lib/data/types";
import { getDictionary, type Locale } from "@/lib/i18n";
import { formatRM } from "@/lib/money";
import type { Quote } from "@/lib/pricing";
import { SampleTag } from "../ui/badge";

export function PriceBreakdown({
  quote, lang, addOns, locations, seasonalRules, locationId, compact = false,
}: {
  quote: Quote; lang: Locale; addOns: AddOn[]; locations: Location[]; seasonalRules: SeasonalRule[]; locationId: string; compact?: boolean;
}) {
  const t = getDictionary(lang).booking;
  const tier = quote.tier === "monthly" ? t.tierMonthly : quote.tier === "weekly" ? t.tierWeekly : t.tierDaily;
  const loc = locations.find((l) => l.id === locationId);
  const lines: { label: string; sen: number; sub?: string }[] = [
    { label: t.base(quote.days, tier), sen: quote.baseSen, sub: `${quote.days} × ${formatRM(quote.dayRateSen, lang)}` },
  ];
  if (quote.extraHours) lines.push({ label: t.extraHours(quote.extraHours), sen: quote.extraHoursSen });
  if (quote.seasonal) {
    const rule = seasonalRules.find((r) => r.id === quote.seasonal!.id);
    lines.push({ label: t.seasonal, sen: quote.seasonal.amountSen, sub: rule ? `${rule.name[lang]} · +${Math.round(rule.surcharge * 100)}%` : undefined });
  }
  for (const l of quote.addOnLines) {
    const a = addOns.find((x) => x.id === l.id);
    lines.push({ label: `${a?.name[lang] ?? l.id}${l.qty > 1 ? ` × ${l.qty}` : ""}`, sen: l.amountSen,
      sub: `${formatRM(l.unitSen, lang)} ${l.pricing === "per_day" ? t.perDay : t.perBooking}` });
  }
  if (quote.locationFeeSen) lines.push({ label: `${t.locationFee}${loc ? ` — ${loc.name[lang]}` : ""}`, sen: quote.locationFeeSen });
  if (quote.taxSen) lines.push({ label: t.tax, sen: quote.taxSen });

  return (
    <div className={compact ? "" : "rounded-2xl border border-line bg-paper p-5"}>
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="font-display font-bold">{t.price}</h3>
        <SampleTag>{getDictionary(lang).common.sample}</SampleTag>
      </div>
      <dl className="space-y-2.5 text-sm">
        {lines.map((l) => (
          <div key={l.label} className="flex justify-between gap-4">
            <dt className="text-steel">{l.label}{l.sub && <span className="block text-xs text-mist tabular-nums">{l.sub}</span>}</dt>
            <dd className="shrink-0 font-medium tabular-nums">{formatRM(l.sen, lang)}</dd>
          </div>
        ))}
        <div className="flex items-baseline justify-between gap-4 border-t border-line pt-3">
          <dt className="font-semibold">{t.total}</dt>
          <dd className="font-display text-xl font-bold tabular-nums">{formatRM(quote.totalSen, lang)}</dd>
        </div>
        <div className="flex justify-between gap-4 rounded-xl bg-amber-soft/60 px-3 py-2.5">
          <dt className="text-amber-2">{t.deposit}</dt>
          <dd className="shrink-0 font-semibold tabular-nums text-amber-2">{formatRM(quote.depositSen, lang)}</dd>
        </div>
      </dl>
      <p className="mt-3 text-xs leading-relaxed text-mist">{t.depositNote} {t.priceNote}</p>
    </div>
  );
}
