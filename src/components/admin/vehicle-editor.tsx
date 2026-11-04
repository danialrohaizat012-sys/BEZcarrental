"use client";

import Image from "next/image";
import { useState } from "react";
import { categories } from "@/lib/data/catalog";
import type { AdminVehicle } from "@/lib/admin/types";
import type { BodyStyle, CategoryId } from "@/lib/data/types";
import { Button } from "../ui/button";
import { Field, Select, inputClass } from "../ui/field";
import { useAdminCtx } from "./context";
import { parseRM } from "./format";
import { Dialog } from "./ui";

const bodyFor: Record<CategoryId, BodyStyle> = { hatchback: "hatchback", sedan: "sedan", mpv: "mpv", suv: "suv", pickup: "pickup" };
const MAX_IMAGES = 4;

/** Resize an uploaded image in the browser (max 1280px, JPEG) to keep demo storage small. */
async function resize(file: File): Promise<string> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((res, rej) => { const i = new window.Image(); i.onload = () => res(i); i.onerror = rej; i.src = url; });
    const scale = Math.min(1, 1280 / img.width);
    const c = document.createElement("canvas");
    c.width = Math.round(img.width * scale); c.height = Math.round(img.height * scale);
    c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
    return c.toDataURL("image/jpeg", 0.78);
  } finally { URL.revokeObjectURL(url); }
}

export function blankVehicle(): AdminVehicle {
  return {
    id: `v_${Date.now().toString(36)}`, slug: "", make: "", model: "", variant: "", year: new Date().getFullYear(), categoryId: "sedan", body: "sedan",
    transmission: "auto", seats: 5, luggage: 2, fuel: "petrol", engine: "", color: "#8d9399", features: ["ac", "bluetooth"], images: [],
    rates: { hourly: 2000, daily: 12000, weekly: 10500, monthly: 8600 }, status: "active", isDemo: true, plateNo: "", mileageKm: 0,
  };
}

export function VehicleEditor({ initial, onClose, onSave }: { initial: AdminVehicle; onClose: () => void; onSave: (v: AdminVehicle) => boolean }) {
  const { t, lang } = useAdminCtx();
  const [v, setV] = useState(initial);
  const [rates, setRates] = useState({
    hourly: (initial.rates.hourly / 100).toString(), daily: (initial.rates.daily / 100).toString(),
    weekly: (initial.rates.weekly / 100).toString(), monthly: (initial.rates.monthly / 100).toString(),
  });
  const [busy, setBusy] = useState(false);
  const set = <K extends keyof AdminVehicle>(k: K, val: AdminVehicle[K]) => setV((x) => ({ ...x, [k]: val }));
  const f = t.fleet;

  async function upload(files: FileList | null) {
    if (!files?.length) return;
    setBusy(true);
    try {
      const add = await Promise.all([...files].filter((x) => x.type.startsWith("image/")).slice(0, MAX_IMAGES - v.images.length).map(resize));
      set("images", [...v.images, ...add.map((src) => ({ src, alt: { ms: `${v.make} ${v.model}`, en: `${v.make} ${v.model}` } }))]);
    } finally { setBusy(false); }
  }

  function save() {
    const r = { hourly: parseRM(rates.hourly), daily: parseRM(rates.daily), weekly: parseRM(rates.weekly), monthly: parseRM(rates.monthly) };
    if (onSave({ ...v, rates: r, body: bodyFor[v.categoryId] })) onClose();
  }

  const num = (k: "year" | "seats" | "luggage" | "mileageKm") => (
    <input id={`v-${k}`} type="number" inputMode="numeric" value={v[k]} onChange={(e) => set(k, Number(e.target.value))} className={inputClass} />
  );

  return (
    <Dialog open onClose={onClose} title={initial.make ? f.edit : f.add}
      footer={<><Button variant="secondary" onClick={onClose}>{t.common.cancel}</Button><Button onClick={save} disabled={busy}>{t.common.save}</Button></>}>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label={f.plate} htmlFor="v-plate"><input id="v-plate" value={v.plateNo} onChange={(e) => set("plateNo", e.target.value)} className={`${inputClass} uppercase`} maxLength={12} /></Field>
        <Field label={f.category} htmlFor="v-cat"><Select id="v-cat" value={v.categoryId} onChange={(e) => set("categoryId", e.target.value as CategoryId)}>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name[lang]}</option>)}</Select></Field>
        <Field label={f.make} htmlFor="v-make"><input id="v-make" value={v.make} onChange={(e) => set("make", e.target.value)} className={inputClass} maxLength={40} /></Field>
        <Field label={f.model} htmlFor="v-model"><input id="v-model" value={v.model} onChange={(e) => set("model", e.target.value)} className={inputClass} maxLength={40} /></Field>
        <Field label={f.variant} htmlFor="v-variant"><input id="v-variant" value={v.variant} onChange={(e) => set("variant", e.target.value)} className={inputClass} maxLength={40} /></Field>
        <Field label={f.year} htmlFor="v-year">{num("year")}</Field>
        <Field label={f.transmission} htmlFor="v-tr"><Select id="v-tr" value={v.transmission} onChange={(e) => set("transmission", e.target.value as AdminVehicle["transmission"])}>
          <option value="auto">Auto</option><option value="manual">Manual</option></Select></Field>
        <Field label={f.fuel} htmlFor="v-fuel"><Select id="v-fuel" value={v.fuel} onChange={(e) => set("fuel", e.target.value as AdminVehicle["fuel"])}>
          <option value="petrol">Petrol</option><option value="diesel">Diesel</option><option value="hybrid">Hybrid</option></Select></Field>
        <Field label={f.seats} htmlFor="v-seats">{num("seats")}</Field>
        <Field label={f.luggage} htmlFor="v-luggage">{num("luggage")}</Field>
        <Field label={f.mileage} htmlFor="v-mileageKm">{num("mileageKm")}</Field>
        <Field label={f.color} htmlFor="v-color"><input id="v-color" type="color" value={v.color} onChange={(e) => set("color", e.target.value)} className={`${inputClass} p-1`} /></Field>
      </div>

      <fieldset className="mt-5">
        <legend className="mb-2 font-display text-sm font-bold">{f.rates}</legend>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {(["daily", "weekly", "monthly", "hourly"] as const).map((k) => (
            <Field key={k} label={f[k]} htmlFor={`r-${k}`}>
              <input id={`r-${k}`} inputMode="decimal" value={rates[k]} onChange={(e) => setRates((r) => ({ ...r, [k]: e.target.value }))} className={`${inputClass} tabular-nums`} />
            </Field>
          ))}
        </div>
      </fieldset>

      <label className="mt-5 flex items-start gap-3 rounded-xl border border-line p-3">
        <input type="checkbox" checked={v.status === "active"} onChange={(e) => set("status", e.target.checked ? "active" : "unavailable")} className="mt-0.5 size-5 accent-[#0e4d57]" />
        <span><span className="font-medium">{f.available}</span><span className="block text-xs text-mist">{f.unavailableHint}</span></span>
      </label>

      <fieldset className="mt-5">
        <legend className="mb-2 font-display text-sm font-bold">{f.images}</legend>
        <div className="grid grid-cols-4 gap-2">
          {v.images.map((img, i) => (
            <div key={i} className="group relative aspect-[4/3] overflow-hidden rounded-lg border border-line">
              <Image src={img.src} alt="" fill sizes="120px" className="object-cover" unoptimized />
              <button type="button" onClick={() => set("images", v.images.filter((_, j) => j !== i))}
                className="absolute inset-x-1 bottom-1 rounded bg-ink/80 py-0.5 text-[11px] font-semibold text-ivory">{f.removeImage}</button>
            </div>
          ))}
          {v.images.length < MAX_IMAGES && (
            <label className="grid aspect-[4/3] cursor-pointer place-items-center rounded-lg border-2 border-dashed border-line text-center text-xs font-semibold text-steel hover:border-petrol hover:text-petrol">
              {busy ? t.common.loading : `+ ${f.upload}`}
              <input type="file" accept="image/*" multiple className="sr-only" onChange={(e) => upload(e.target.files)} />
            </label>
          )}
        </div>
        <p className="mt-2 text-xs text-mist">{f.uploadHint}</p>
      </fieldset>
    </Dialog>
  );
}
