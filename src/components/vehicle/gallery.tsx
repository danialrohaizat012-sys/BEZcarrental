"use client";

import Image from "next/image";
import { useState } from "react";
import type { Vehicle } from "@/lib/data/types";
import type { Locale } from "@/lib/i18n";
import { VehicleMedia } from "./vehicle-media";

export function Gallery({ vehicle, lang, caption }: { vehicle: Vehicle; lang: Locale; caption: string }) {
  const [active, setActive] = useState(0);
  const images = vehicle.images;
  return (
    <figure>
      <VehicleMedia vehicle={vehicle} lang={lang} index={active} priority sizes="(min-width: 1024px) 60vw, 100vw"
        className="aspect-[16/10] rounded-2xl border border-line" idSuffix="-hero" />
      {images.length > 1 && (
        <div className="mt-3 grid grid-cols-4 gap-2">
          {images.map((img, i) => (
            <button key={img.src} type="button" onClick={() => setActive(i)} aria-label={img.alt[lang]} aria-pressed={i === active}
              className={`relative aspect-[4/3] overflow-hidden rounded-lg border-2 ${i === active ? "border-petrol" : "border-transparent opacity-80 hover:opacity-100"}`}>
              <Image src={img.src} alt="" fill sizes="20vw" className="object-cover" />
            </button>
          ))}
        </div>
      )}
      <figcaption className="mt-2 text-xs text-mist">{images[active]?.credit ?? caption}</figcaption>
    </figure>
  );
}
