import Image from "next/image";
import type { Vehicle } from "@/lib/data/types";
import type { Locale } from "@/lib/i18n";
import { CarIllustration } from "./car-illustration";

/** Photo when available, otherwise the studio illustration. */
export function VehicleMedia({
  vehicle, lang, index = 0, className = "", sizes = "(min-width: 1024px) 33vw, 100vw", priority = false, idSuffix = "",
}: { vehicle: Vehicle; lang: Locale; index?: number; className?: string; sizes?: string; priority?: boolean; idSuffix?: string }) {
  const img = vehicle.images[index];
  const name = `${vehicle.make} ${vehicle.model}`;
  return (
    <div className={`relative overflow-hidden bg-gradient-to-b from-[#efebe3] to-[#e2ddd2] ${className}`}>
      {img ? (
        <Image src={img.src} alt={img.alt[lang]} fill sizes={sizes} priority={priority} className="object-cover" />
      ) : (
        <>
          <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/[0.06] to-transparent" aria-hidden />
          <CarIllustration
            body={vehicle.body}
            color={vehicle.color}
            id={`${vehicle.id}${idSuffix}`}
            title={name}
            className="absolute inset-x-[7%] bottom-[10%] w-[86%] drop-shadow-[0_8px_10px_rgba(17,20,24,0.12)]"
          />
        </>
      )}
    </div>
  );
}
