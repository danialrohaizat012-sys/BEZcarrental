import Link from "next/link";
import type { Vehicle } from "@/lib/data/types";
import { getDictionary, type Locale } from "@/lib/i18n";
import { getCategory } from "@/lib/data/repository";
import { formatRM } from "@/lib/money";
import { Badge } from "../ui/badge";
import { IconBag, IconGear, IconSeat, IconArrow } from "../ui/icons";
import { VehicleMedia } from "./vehicle-media";

export function VehicleCard({
  vehicle, lang, available, totalSen, query = "",
}: { vehicle: Vehicle; lang: Locale; available?: boolean; totalSen?: number; query?: string }) {
  const t = getDictionary(lang);
  const category = getCategory(vehicle.categoryId);
  const href = `/${lang}/vehicles/${vehicle.slug}${query ? `?${query}` : ""}`;
  const dim = available === false;
  return (
    <article className={`group relative flex flex-col overflow-hidden rounded-2xl border border-line bg-paper shadow-card transition duration-200 hover:-translate-y-0.5 hover:shadow-lift ${dim ? "opacity-75" : ""}`}>
      <VehicleMedia vehicle={vehicle} lang={lang} className="aspect-[16/10]" idSuffix="-card" />
      <div className="absolute left-3 top-3">
        {available === undefined ? null : available ? (
          <Badge tone="good">{t.common.available}</Badge>
        ) : (
          <Badge tone="bad">{t.catalogue.notAvailable}</Badge>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-4 p-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-petrol">{category?.name[lang]}</p>
          <h3 className="mt-1 font-display text-lg font-bold leading-tight">
            <Link href={href} className="after:absolute after:inset-0 focus-visible:outline-none">
              {vehicle.make} {vehicle.model}
            </Link>
          </h3>
          <p className="text-sm text-steel">{vehicle.variant} · {vehicle.year}</p>
        </div>
        <ul className="flex flex-wrap gap-x-4 gap-y-1.5 text-sm text-steel">
          <li className="flex items-center gap-1.5"><IconGear className="size-4" />{vehicle.transmission === "auto" ? t.common.auto : t.common.manual}</li>
          <li className="flex items-center gap-1.5"><IconSeat className="size-4" />{vehicle.seats} {t.common.seats}</li>
          <li className="flex items-center gap-1.5"><IconBag className="size-4" />{vehicle.luggage} {t.common.bags}</li>
        </ul>
        <div className="mt-auto flex items-end justify-between gap-3 border-t border-line pt-4">
          <div>
            <p className="text-xs text-mist">{t.common.from}</p>
            <p className="font-display text-xl font-bold tabular-nums">
              {formatRM(vehicle.rates.daily, lang)}<span className="text-sm font-medium text-steel">{t.common.perDay}</span>
            </p>
            {totalSen !== undefined && available && (
              <p className="text-xs text-steel tabular-nums">{formatRM(totalSen, lang)} {t.catalogue.total}</p>
            )}
          </div>
          <span className="inline-flex items-center gap-1 text-sm font-semibold text-petrol">
            {t.common.viewDetails}
            <IconArrow className="size-4 transition-transform group-hover:translate-x-0.5" />
          </span>
        </div>
      </div>
    </article>
  );
}
