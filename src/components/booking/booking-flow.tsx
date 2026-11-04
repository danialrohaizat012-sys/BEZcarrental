"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { checkAvailability, submitBookingRequest } from "@/lib/booking/actions";
import { normaliseMyPhone, type BookingRequestInput } from "@/lib/booking/schema";
import { saveBooking } from "@/lib/booking/storage";
import type { AddOn, BookingRules, Location, SeasonalRule, Vehicle, VehicleCategory } from "@/lib/data/types";
import { getDictionary, type Locale } from "@/lib/i18n";
import { formatRM } from "@/lib/money";
import { calculateQuote, validatePeriod, type Quote } from "@/lib/pricing";
import { addDaysLocal, formatDateTime, timeSlots, todayLocal } from "@/lib/time";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Field, Select, inputClass } from "../ui/field";
import { IconAlert, IconCheck, IconChevronLeft, IconPin } from "../ui/icons";
import { VehicleMedia } from "../vehicle/vehicle-media";
import { PriceBreakdown } from "./price-breakdown";

interface Props {
  lang: Locale;
  vehicles: Vehicle[];
  categories: VehicleCategory[];
  addOns: AddOn[];
  locations: Location[];
  seasonalRules: SeasonalRule[];
  rules: BookingRules;
  initial: { slug: string; pickup: string; return: string };
}

type Avail = { state: "idle" | "checking" | "ok" | "no" } | { state: "error"; code: string };

export function BookingFlow({ lang, vehicles, categories, addOns, locations, seasonalRules, rules, initial }: Props) {
  const t = getDictionary(lang);
  const tb = t.booking;
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [slug, setSlug] = useState(vehicles.some((v) => v.slug === initial.slug) ? initial.slug : "");
  const [pDate, setPDate] = useState(initial.pickup.slice(0, 10));
  const [pTime, setPTime] = useState(initial.pickup.slice(11, 16));
  const [rDate, setRDate] = useState(initial.return.slice(0, 10));
  const [rTime, setRTime] = useState(initial.return.slice(11, 16));
  const [checked, setChecked] = useState<{ key: string; value: Avail } | null>(null);
  const [locationId, setLocationId] = useState(locations[0].id);
  const [qty, setQty] = useState<Record<string, number>>({});
  const [form, setForm] = useState({ fullName: "", phone: "", email: "", notes: "", website: "" });
  const [consent, setConsent] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, startSubmit] = useTransition();
  const topRef = useRef<HTMLDivElement>(null);

  const vehicle = vehicles.find((v) => v.slug === slug);
  const category = vehicle && categories.find((c) => c.id === vehicle.categoryId);
  const pickup = `${pDate}T${pTime}`;
  const ret = `${rDate}T${rTime}`;
  const periodError = validatePeriod(pickup, ret, rules);
  const slots = timeSlots(rules.openHour, rules.closeHour);
  const selectedAddOns = useMemo(() => Object.entries(qty).filter(([, q]) => q > 0).map(([id, q]) => ({ id, qty: q })), [qty]);

  const quote: Quote | null = useMemo(() => {
    if (!vehicle || !category || periodError) return null;
    try {
      return calculateQuote(vehicle, pickup, ret, selectedAddOns, locationId, { rules, addOns, locations, seasonalRules, category });
    } catch { return null; }
  }, [vehicle, category, periodError, pickup, ret, selectedAddOns, locationId, rules, addOns, locations, seasonalRules]);

  // Live availability check (server action), debounced. Result is keyed by the selection it belongs to.
  const availKey = vehicle && !periodError ? `${vehicle.slug}|${pickup}|${ret}` : "";
  const avail: Avail = !availKey ? { state: "idle" } : checked?.key === availKey ? checked.value : { state: "checking" };
  const setAvail = (value: Avail) => setChecked({ key: availKey, value });
  useEffect(() => {
    if (!availKey) return;
    const [s, p, r] = availKey.split("|");
    let cancelled = false;
    const id = setTimeout(async () => {
      const res = await checkAvailability(s, p, r);
      if (cancelled) return;
      const value: Avail = res.ok ? { state: res.available ? "ok" : "no" } : { state: "error", code: res.error === "period" ? (res.detail ?? "invalid") : res.error };
      setChecked({ key: availKey, value });
    }, 250);
    return () => { cancelled = true; clearTimeout(id); };
  }, [availKey]);

  // Keep the URL shareable as the selection changes.
  useEffect(() => {
    const qs = new URLSearchParams();
    if (slug) qs.set("vehicle", slug);
    qs.set("pickup", pickup);
    qs.set("return", ret);
    window.history.replaceState(null, "", `?${qs}`);
  }, [slug, pickup, ret]);

  const go = (n: number) => {
    setStep(n);
    requestAnimationFrame(() => topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
  };

  function validateDetails(): boolean {
    const e: Record<string, string> = {};
    if (form.fullName.trim().length < 3) e.fullName = tb.errors.name;
    if (!normaliseMyPhone(form.phone)) e.phone = tb.errors.phone;
    if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(form.email.trim())) e.email = tb.errors.email;
    if (form.notes.length > 500) e.notes = tb.errors.notes;
    setFieldErrors(e);
    return Object.keys(e).length === 0;
  }

  function submit() {
    if (!consent) { setFieldErrors((f) => ({ ...f, consent: tb.errors.consent })); return; }
    if (!vehicle) return;
    setSubmitError(null);
    const payload: BookingRequestInput = {
      vehicleSlug: vehicle.slug, pickup, return: ret, locationId, addOns: selectedAddOns,
      fullName: form.fullName, phone: form.phone, email: form.email, notes: form.notes, consent: true, website: form.website,
    };
    startSubmit(async () => {
      const r = await submitBookingRequest(payload);
      if (r.ok) {
        saveBooking(r.booking);
        router.push(`/${lang}/book/confirmed/${r.booking.ref}`);
        return;
      }
      if (r.error === "validation") {
        const map: Record<string, string> = { fullName: tb.errors.name, phone: tb.errors.phone, email: tb.errors.email, notes: tb.errors.notes, consent: tb.errors.consent };
        const fe: Record<string, string> = {};
        r.fields.forEach((f) => { if (map[f]) fe[f] = map[f]; });
        setFieldErrors(fe);
        if (fe.fullName || fe.phone || fe.email || fe.notes) go(2);
        setSubmitError(tb.errors.generic);
      } else if (r.error === "unavailable") {
        setAvail({ state: "no" });
        setSubmitError(tb.errors.unavailable);
      } else if (r.error === "period") {
        setSubmitError(tb.errors[r.detail ?? "invalid"] ?? tb.errors.invalid);
      } else {
        setSubmitError(tb.errors[r.error] ?? tb.errors.server);
      }
    });
  }

  const canStep1 = Boolean(vehicle) && !periodError && avail.state === "ok";
  const durationLabel = quote ? [t.common.days(quote.days), quote.extraHours ? t.common.hours(quote.extraHours) : ""].filter(Boolean).join(" ") : "";

  // ---------- UI ----------
  return (
    <div ref={topRef} className="scroll-mt-24">
      <ol className="mb-8 grid grid-cols-4 gap-2" aria-label={tb.title}>
        {tb.steps.map((label, i) => (
          <li key={label} aria-current={i === step ? "step" : undefined}>
            <div className={`h-1 rounded-full ${i <= step ? "bg-petrol" : "bg-line"}`} />
            <p className={`mt-2 text-xs font-semibold sm:text-sm ${i === step ? "text-ink" : "text-mist"}`}>
              <span className="tabular-nums">{i + 1}.</span> <span className="max-sm:sr-only">{label}</span>
            </p>
          </li>
        ))}
      </ol>
      <p className="sr-only" aria-live="polite">{tb.stepOf(step + 1, 4)}: {tb.steps[step]}</p>

      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        <div className="min-w-0 animate-rise" key={step}>
          {step === 0 && (
            <section className="space-y-6">
              <div className="rounded-2xl border border-line bg-paper p-5">
                <h2 className="font-display text-lg font-bold">{tb.vehicle}</h2>
                <div className="mt-4">
                  <Field label={tb.chooseVehicle} htmlFor="b-vehicle">
                    <Select id="b-vehicle" value={slug} onChange={(e) => setSlug(e.target.value)}>
                      <option value="" disabled>{tb.chooseVehicle}</option>
                      {categories.map((c) => (
                        <optgroup key={c.id} label={c.name[lang]}>
                          {vehicles.filter((v) => v.categoryId === c.id).map((v) => (
                            <option key={v.slug} value={v.slug}>{v.make} {v.model} — {formatRM(v.rates.daily, lang)}{t.common.perDay}</option>
                          ))}
                        </optgroup>
                      ))}
                    </Select>
                  </Field>
                </div>
              </div>

              <div className="rounded-2xl border border-line bg-paper p-5">
                <h2 className="font-display text-lg font-bold">{tb.period}</h2>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <Field label={t.search.pickupDate} htmlFor="b-pdate">
                    <input id="b-pdate" type="date" className={inputClass} min={todayLocal()} value={pDate}
                      onChange={(e) => { setPDate(e.target.value); if (e.target.value >= rDate) setRDate(addDaysLocal(e.target.value, 1)); }} />
                  </Field>
                  <Field label={t.search.pickupTime} htmlFor="b-ptime">
                    <Select id="b-ptime" value={pTime} onChange={(e) => setPTime(e.target.value)}>{slots.map((s) => <option key={s}>{s}</option>)}</Select>
                  </Field>
                  <Field label={t.search.returnDate} htmlFor="b-rdate">
                    <input id="b-rdate" type="date" className={inputClass} min={pDate} value={rDate} onChange={(e) => setRDate(e.target.value)} />
                  </Field>
                  <Field label={t.search.returnTime} htmlFor="b-rtime">
                    <Select id="b-rtime" value={rTime} onChange={(e) => setRTime(e.target.value)}>{slots.map((s) => <option key={s}>{s}</option>)}</Select>
                  </Field>
                </div>
                <div className="mt-4 min-h-6 text-sm" aria-live="polite">
                  {periodError ? (
                    <p className="flex items-center gap-2 font-medium text-bad"><IconAlert className="size-4 shrink-0" />{tb.errors[periodError]}</p>
                  ) : !vehicle ? null : avail.state === "checking" ? (
                    <p className="text-steel">{tb.checking}</p>
                  ) : avail.state === "ok" ? (
                    <p className="flex flex-wrap items-center gap-2"><Badge tone="good">{tb.available}</Badge><span className="text-steel">{tb.duration}: {durationLabel}</span></p>
                  ) : avail.state === "no" ? (
                    <p className="flex items-start gap-2 font-medium text-bad"><IconAlert className="mt-0.5 size-4 shrink-0" />{tb.unavailable}{" "}
                      <Link className="underline" href={`/${lang}/vehicles?${new URLSearchParams({ pickup, return: ret })}`}>{t.catalogue.title}</Link></p>
                  ) : avail.state === "error" ? (
                    <p className="font-medium text-bad">{tb.errors[avail.code] ?? tb.errors.server}</p>
                  ) : null}
                </div>
              </div>
              <StepNav lang={lang} onNext={() => go(1)} nextDisabled={!canStep1} />
            </section>
          )}

          {step === 1 && quote && (
            <section className="space-y-6">
              <div className="rounded-2xl border border-line bg-paper p-5">
                <h2 className="font-display text-lg font-bold">{tb.location}</h2>
                <div className="mt-4 grid gap-2" role="radiogroup" aria-label={tb.location}>
                  {locations.map((l) => (
                    <label key={l.id} className={`flex cursor-pointer items-center gap-3 rounded-xl border p-4 transition-colors ${locationId === l.id ? "border-petrol bg-petrol-soft/50" : "border-line hover:border-steel/40"}`}>
                      <input type="radio" name="location" value={l.id} checked={locationId === l.id} onChange={() => setLocationId(l.id)} className="size-4 accent-[#0e4d57]" />
                      <IconPin className="size-4 text-petrol" />
                      <span className="flex-1 text-[15px] font-medium">{l.name[lang]}</span>
                      <span className="text-sm tabular-nums text-steel">{l.feeSen ? `+${formatRM(l.feeSen, lang)}` : "—"}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-line bg-paper p-5">
                <h2 className="font-display text-lg font-bold">{tb.extras}</h2>
                <ul className="mt-4 divide-y divide-line">
                  {addOns.map((a) => {
                    const q = qty[a.id] ?? 0;
                    const set = (n: number) => setQty((s) => ({ ...s, [a.id]: Math.max(0, Math.min(a.maxQty, n)) }));
                    return (
                      <li key={a.id} className="flex items-center gap-4 py-3.5">
                        <div className="flex-1">
                          <p className="font-medium">{a.name[lang]}</p>
                          <p className="text-sm text-steel">{a.description[lang]} · <span className="tabular-nums">{formatRM(a.priceSen, lang)}</span> {a.pricing === "per_day" ? tb.perDay : tb.perBooking}</p>
                        </div>
                        {a.maxQty === 1 ? (
                          <input type="checkbox" checked={q === 1} onChange={(e) => set(e.target.checked ? 1 : 0)} className="size-5 accent-[#0e4d57]" aria-label={a.name[lang]} />
                        ) : (
                          <div className="flex items-center rounded-xl border border-line" role="group" aria-label={`${a.name[lang]} — ${tb.qty}`}>
                            <button type="button" className="grid size-9 place-items-center text-lg disabled:opacity-30" onClick={() => set(q - 1)} disabled={q === 0} aria-label="−">−</button>
                            <span className="w-6 text-center tabular-nums" aria-live="polite">{q}</span>
                            <button type="button" className="grid size-9 place-items-center text-lg disabled:opacity-30" onClick={() => set(q + 1)} disabled={q >= a.maxQty} aria-label="+">+</button>
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
              <div className="lg:hidden">
                <PriceBreakdown quote={quote} lang={lang} addOns={addOns} locations={locations} seasonalRules={seasonalRules} locationId={locationId} />
              </div>
              <StepNav lang={lang} onBack={() => go(0)} onNext={() => go(2)} />
            </section>
          )}

          {step === 2 && (
            <section className="space-y-6">
              <form className="rounded-2xl border border-line bg-paper p-5" noValidate onSubmit={(e) => { e.preventDefault(); if (validateDetails()) go(3); }}>
                <h2 className="font-display text-lg font-bold">{tb.details}</h2>
                <p className="mt-1 text-sm text-steel">{tb.privacyNote}</p>
                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <Field label={tb.fullName} htmlFor="b-name" error={fieldErrors.fullName} className="sm:col-span-2">
                    <input id="b-name" autoComplete="name" className={inputClass} value={form.fullName} maxLength={100}
                      aria-invalid={!!fieldErrors.fullName} aria-describedby={fieldErrors.fullName ? "b-name-error" : undefined}
                      onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
                  </Field>
                  <Field label={tb.phone} htmlFor="b-phone" hint={tb.phoneHint} error={fieldErrors.phone}>
                    <input id="b-phone" type="tel" inputMode="tel" autoComplete="tel" className={inputClass} value={form.phone} maxLength={20}
                      aria-invalid={!!fieldErrors.phone} aria-describedby={fieldErrors.phone ? "b-phone-error" : undefined}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                  </Field>
                  <Field label={<>{tb.email} <span className="font-normal text-mist">({t.common.optional})</span></>} htmlFor="b-email" error={fieldErrors.email}>
                    <input id="b-email" type="email" autoComplete="email" className={inputClass} value={form.email} maxLength={120}
                      aria-invalid={!!fieldErrors.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                  </Field>
                  <Field label={<>{tb.notes} <span className="font-normal text-mist">({t.common.optional})</span></>} htmlFor="b-notes" error={fieldErrors.notes} className="sm:col-span-2">
                    <textarea id="b-notes" rows={3} maxLength={500} placeholder={tb.notesHint} className={`${inputClass} h-auto py-2.5`} value={form.notes}
                      onChange={(e) => setForm({ ...form, notes: e.target.value })} />
                  </Field>
                  {/* honeypot */}
                  <div className="hidden" aria-hidden>
                    <label htmlFor="b-website">Website</label>
                    <input id="b-website" tabIndex={-1} autoComplete="off" value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} />
                  </div>
                </div>
                <div className="mt-6"><StepNav lang={lang} onBack={() => go(1)} submit /></div>
              </form>
            </section>
          )}

          {step === 3 && vehicle && quote && (
            <section className="space-y-6">
              <div className="rounded-2xl border border-line bg-paper p-5">
                <h2 className="font-display text-lg font-bold">{tb.review}</h2>
                <dl className="mt-4 divide-y divide-line text-[15px]">
                  <ReviewRow label={tb.vehicle} value={`${vehicle.make} ${vehicle.model} ${vehicle.variant}`} onEdit={() => go(0)} lang={lang} />
                  <ReviewRow label={tb.pickup} value={formatDateTime(pickup, lang)} onEdit={() => go(0)} lang={lang} />
                  <ReviewRow label={tb.return} value={formatDateTime(ret, lang)} onEdit={() => go(0)} lang={lang} />
                  <ReviewRow label={tb.location} value={locations.find((l) => l.id === locationId)?.name[lang] ?? ""} onEdit={() => go(1)} lang={lang} />
                  <ReviewRow label={tb.details} value={[form.fullName, normaliseMyPhone(form.phone), form.email].filter(Boolean).join(" · ")} onEdit={() => go(2)} lang={lang} />
                  {form.notes && <ReviewRow label={tb.notes} value={form.notes} onEdit={() => go(2)} lang={lang} />}
                </dl>
              </div>
              <div className="lg:hidden">
                <PriceBreakdown quote={quote} lang={lang} addOns={addOns} locations={locations} seasonalRules={seasonalRules} locationId={locationId} />
              </div>
              <label className="flex items-start gap-3 rounded-2xl border border-line bg-paper p-4 text-[15px]">
                <input type="checkbox" checked={consent} onChange={(e) => { setConsent(e.target.checked); setFieldErrors((f) => ({ ...f, consent: "" })); }}
                  className="mt-0.5 size-5 shrink-0 accent-[#0e4d57]" aria-invalid={!!fieldErrors.consent} />
                <span>{tb.consent}{fieldErrors.consent && <span className="mt-1 block text-sm font-medium text-bad">{fieldErrors.consent}</span>}</span>
              </label>
              {submitError && (
                <p role="alert" className="flex items-start gap-2 rounded-xl bg-bad-soft px-4 py-3 text-sm font-medium text-bad"><IconAlert className="mt-0.5 size-4 shrink-0" />{submitError}</p>
              )}
              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
                <Button variant="secondary" onClick={() => go(2)} disabled={submitting}><IconChevronLeft className="size-4" />{t.common.back}</Button>
                <Button size="lg" onClick={submit} disabled={submitting} aria-busy={submitting}>
                  {submitting ? tb.submitting : <><IconCheck className="size-4" />{tb.submit}</>}
                </Button>
              </div>
            </section>
          )}
        </div>

        {/* Summary */}
        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          {vehicle ? (
            <div className="overflow-hidden rounded-2xl border border-line bg-paper">
              <VehicleMedia vehicle={vehicle} lang={lang} className="aspect-[16/9]" idSuffix="-summary" sizes="360px" />
              <div className="p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-petrol">{category?.name[lang]}</p>
                <p className="font-display text-lg font-bold">{vehicle.make} {vehicle.model}</p>
                {!periodError && (
                  <p className="mt-2 text-sm text-steel">{formatDateTime(pickup, lang)}<br />→ {formatDateTime(ret, lang)}</p>
                )}
                {quote && step === 0 && (
                  <p className="mt-4 flex items-baseline justify-between border-t border-line pt-4">
                    <span className="text-sm text-steel">{tb.estimate}</span>
                    <span className="font-display text-xl font-bold tabular-nums">{formatRM(quote.totalSen, lang)}</span>
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-line p-6 text-center text-sm text-steel">
              {tb.chooseVehicle} · <Link className="font-semibold text-petrol" href={`/${lang}/vehicles`}>{t.catalogue.title}</Link>
            </div>
          )}
          {quote && step > 0 && (
            <div className="hidden lg:block">
              <PriceBreakdown quote={quote} lang={lang} addOns={addOns} locations={locations} seasonalRules={seasonalRules} locationId={locationId} />
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

function StepNav({ lang, onBack, onNext, nextDisabled, submit }: { lang: Locale; onBack?: () => void; onNext?: () => void; nextDisabled?: boolean; submit?: boolean }) {
  const t = getDictionary(lang).common;
  return (
    <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
      {onBack ? <Button type="button" variant="secondary" onClick={onBack}><IconChevronLeft className="size-4" />{t.back}</Button> : <span />}
      <Button type={submit ? "submit" : "button"} size="lg" onClick={onNext} disabled={nextDisabled}>{t.continue}</Button>
    </div>
  );
}

function ReviewRow({ label, value, onEdit, lang }: { label: string; value: string; onEdit: () => void; lang: Locale }) {
  return (
    <div className="flex items-start justify-between gap-4 py-3">
      <div className="min-w-0">
        <dt className="text-xs font-semibold uppercase tracking-wide text-mist">{label}</dt>
        <dd className="mt-0.5 break-words">{value}</dd>
      </div>
      <button type="button" onClick={onEdit} className="shrink-0 text-sm font-semibold text-petrol hover:underline">{getDictionary(lang).common.edit}</button>
    </div>
  );
}
