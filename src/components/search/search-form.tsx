"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { getDictionary, type Locale } from "@/lib/i18n";
import { fromLocal, timeSlots, todayLocal } from "@/lib/time";
import { Button } from "../ui/button";
import { Field, Select, inputClass } from "../ui/field";
import { IconAlert } from "../ui/icons";

export interface SearchDefaults { pickup: string; return: string; category: string }

export function SearchForm({
  lang, defaults, categories, openHour, closeHour, variant = "card",
}: {
  lang: Locale; defaults: SearchDefaults; categories: { id: string; name: string }[];
  openHour: number; closeHour: number; variant?: "card" | "bar";
}) {
  const t = getDictionary(lang).search;
  const router = useRouter();
  const [pDate, setPDate] = useState(defaults.pickup.slice(0, 10));
  const [pTime, setPTime] = useState(defaults.pickup.slice(11, 16));
  const [rDate, setRDate] = useState(defaults.return.slice(0, 10));
  const [rTime, setRTime] = useState(defaults.return.slice(11, 16));
  const [category, setCategory] = useState(defaults.category);
  const [error, setError] = useState<string | null>(null);
  const slots = timeSlots(openHour, closeHour);
  const today = todayLocal();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const pickup = `${pDate}T${pTime}`, ret = `${rDate}T${rTime}`;
    if (!pDate || !rDate || fromLocal(ret) <= fromLocal(pickup)) { setError(t.invalid); return; }
    setError(null);
    const qs = new URLSearchParams({ pickup, return: ret });
    if (category) qs.set("category", category);
    router.push(`/${lang}/vehicles?${qs}`);
  }

  const bar = variant === "bar";
  return (
    <form onSubmit={submit} noValidate
      className={`text-ink ${bar ? "rounded-2xl border border-line bg-paper p-4 shadow-card" : "rounded-3xl bg-paper p-5 shadow-lift ring-1 ring-black/5 sm:p-6"}`}>
      {!bar && <h2 className="mb-4 font-display text-lg font-bold">{t.title}</h2>}
      <div className={`grid gap-3 ${bar ? "sm:grid-cols-2 lg:grid-cols-[1fr_.7fr_1fr_.7fr_1fr_auto] lg:items-end" : "grid-cols-2"}`}>
        <Field label={t.pickupDate} htmlFor="s-pdate">
          <input id="s-pdate" type="date" min={today} value={pDate} required className={inputClass}
            onChange={(e) => { setPDate(e.target.value); if (e.target.value >= rDate) setRDate(e.target.value); }} />
        </Field>
        <Field label={t.pickupTime} htmlFor="s-ptime">
          <Select id="s-ptime" value={pTime} onChange={(e) => setPTime(e.target.value)}>
            {slots.map((s) => <option key={s} value={s}>{s}</option>)}
          </Select>
        </Field>
        <Field label={t.returnDate} htmlFor="s-rdate">
          <input id="s-rdate" type="date" min={pDate || today} value={rDate} required className={inputClass} onChange={(e) => setRDate(e.target.value)} />
        </Field>
        <Field label={t.returnTime} htmlFor="s-rtime">
          <Select id="s-rtime" value={rTime} onChange={(e) => setRTime(e.target.value)}>
            {slots.map((s) => <option key={s} value={s}>{s}</option>)}
          </Select>
        </Field>
        <Field label={t.category} htmlFor="s-cat" className={bar ? "" : "col-span-2"}>
          <Select id="s-cat" value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="">{t.allCategories}</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </Select>
        </Field>
        <Button type="submit" size="lg" variant={bar ? "primary" : "accent"} className={bar ? "w-full lg:w-auto" : "col-span-2 mt-1 w-full"}>
          {t.submit}
        </Button>
      </div>
      {error && <p role="alert" className="mt-3 flex items-center gap-2 text-sm font-medium text-bad"><IconAlert className="size-4" />{error}</p>}
    </form>
  );
}
