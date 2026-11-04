"use client";

import Link from "next/link";
import { useState } from "react";
import { categories } from "@/lib/data/catalog";
import { upsertVehicle, vehicleStateAt } from "@/lib/admin/domain";
import { useAdmin } from "@/lib/admin/store";
import { formatRM } from "@/lib/money";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { VehicleMedia } from "../vehicle/vehicle-media";
import { useAdminCtx } from "./context";
import { PageHeader } from "./ui";
import { blankVehicle, VehicleEditor } from "./vehicle-editor";

export const stateTone = { available: "good", on_rent: "petrol", maintenance: "amber", unavailable: "neutral" } as const;

export function FleetList() {
  const s = useAdmin()!;
  const { t, lang, act } = useAdminCtx();
  const [adding, setAdding] = useState(false);
  const [cat, setCat] = useState("");
  const now = new Date();
  const list = s.vehicles.filter((v) => !cat || v.categoryId === cat);
  const base = `/${lang}/admin`;
  return (
    <>
      <PageHeader title={t.fleet.title} subtitle={`${s.vehicles.length} · ${t.common.demoData}`} actions={<Button onClick={() => setAdding(true)}>+ {t.fleet.add}</Button>} />
      <div className="-mx-4 mb-4 flex gap-1.5 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        {[{ id: "", name: t.common.all }, ...categories.map((c) => ({ id: c.id, name: c.name[lang] }))].map((c) => (
          <button key={c.id} type="button" onClick={() => setCat(c.id)} className={`shrink-0 rounded-full border px-3.5 py-1.5 text-sm font-semibold ${cat === c.id ? "border-ink bg-ink text-ivory" : "border-line bg-paper text-steel"}`}>{c.name}</button>
        ))}
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {list.map((v) => {
          const st = vehicleStateAt(s, v, now);
          return (
            <Link key={v.id} href={`${base}/fleet/${v.id}`} className="group overflow-hidden rounded-2xl border border-line bg-paper transition-shadow hover:shadow-card">
              <div className="relative"><VehicleMedia vehicle={v} lang={lang} className="aspect-[16/9]" idSuffix="-fl" sizes="400px" />
                <div className="absolute left-3 top-3"><Badge tone={stateTone[st]}>{t.vehicleState[st]}</Badge></div></div>
              <div className="flex items-end justify-between gap-3 p-4">
                <div className="min-w-0"><p className="truncate font-semibold">{v.make} {v.model} <span className="font-normal text-mist">{v.variant}</span></p>
                  <p className="font-mono text-xs text-steel">{v.plateNo} · {v.mileageKm.toLocaleString()} km</p></div>
                <p className="shrink-0 text-right text-sm font-semibold tabular-nums">{formatRM(v.rates.daily, lang)}<span className="font-normal text-mist">/{lang === "ms" ? "hari" : "day"}</span></p>
              </div>
            </Link>
          );
        })}
      </div>
      {adding && <VehicleEditor initial={blankVehicle()} onClose={() => setAdding(false)} onSave={(v) => act((st) => upsertVehicle(st, v), t.common.saved).ok} />}
    </>
  );
}
