"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { addOns as addOnCatalog, locations, seasonalRules } from "@/lib/data/catalog";
import {
  addCharge, assignVehicle, balanceOf, canTransition, changeDates, conflictsFor, findBooking, findCustomer, findVehicle,
  pendingClashes, recordPayment, setInternalNotes, transition, TRANSITIONS,
} from "@/lib/admin/domain";
import { useAdmin } from "@/lib/admin/store";
import type { BookingStatus, ExtraCharge, PaymentKind, PaymentMethod } from "@/lib/admin/types";
import { formatRM } from "@/lib/money";
import { timeSlots } from "@/lib/time";
import { PriceBreakdown } from "../booking/price-breakdown";
import { Button } from "../ui/button";
import { Field, Select, inputClass } from "../ui/field";
import { IconAlert, IconChevronLeft, IconWhatsApp } from "../ui/icons";
import { VehicleMedia } from "../vehicle/vehicle-media";
import { useAdminCtx } from "./context";
import { fmtIso, fmtRange, fmtShort, parseRM } from "./format";
import { Card, Dialog, Empty, StatusBadge } from "./ui";

type DialogKind = null | "rejected" | "cancelled" | "dates" | "assign" | "payment" | "charge";

export function BookingDetail({ id }: { id: string }) {
  const s = useAdmin()!;
  const { t, lang, act, user } = useAdminCtx();
  const [dialog, setDialog] = useState<DialogKind>(null);
  const b = findBooking(s, id);
  const base = `/${lang}/admin`;

  const derived = useMemo(() => {
    if (!b) return null;
    return {
      v: findVehicle(s, b.vehicleId)!, c: findCustomer(s, b.customerId)!, bal: balanceOf(s, b),
      conflicts: b.status === "pending" ? conflictsFor(s, b.vehicleId, b.pickup, b.return, b.id) : [],
      clashes: b.status === "pending" || b.status === "confirmed" ? pendingClashes(s, b) : [],
      payments: s.payments.filter((p) => p.bookingId === b.id).sort((x, y) => y.receivedAt.localeCompare(x.receivedAt)),
    };
  }, [s, b]);

  if (!b || !derived) return <Empty>{t.errors.not_found} · <Link className="text-petrol" href={`${base}/bookings`}>{t.booking.back}</Link></Empty>;
  const { v, c, bal, conflicts, clashes, payments } = derived;
  const next = TRANSITIONS[b.status];
  const go = (to: BookingStatus, reason?: string) => act((st) => transition(st, b.id, to, { by: user, reason }), t.status[to]).ok;
  const wa = `https://wa.me/${c.phone.replace("+", "")}?text=${encodeURIComponent(`${lang === "ms" ? "Salam" : "Hi"} ${c.fullName.replace(" (demo)", "")}, ${b.ref}`)}`;
  const primary = next.filter((x) => x !== "rejected" && x !== "cancelled");

  return (
    <>
      <Link href={`${base}/bookings`} className="inline-flex items-center gap-1 text-sm font-medium text-steel hover:text-ink"><IconChevronLeft className="size-4" />{t.booking.back}</Link>
      <div className="mb-6 mt-3 flex flex-wrap items-center gap-3">
        <h1 className="font-mono text-2xl font-bold tracking-wide">{b.ref}</h1>
        <StatusBadge status={b.status} />
        <span className="text-sm text-mist">{t.bookings.source[b.source]} · {fmtIso(b.createdAt, lang)}</span>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
        <div className="space-y-5 lg:order-1">
          <Card title={t.booking.details}>
            <div className="flex flex-col gap-5 sm:flex-row">
              <Link href={`${base}/fleet/${v.id}`} className="shrink-0 sm:w-48">
                <VehicleMedia vehicle={v} lang={lang} className="aspect-[16/10] rounded-xl" idSuffix="-adm" sizes="200px" />
                <p className="mt-2 font-semibold">{v.make} {v.model}</p><p className="text-xs text-mist">{v.plateNo} · {v.variant}</p>
              </Link>
              <dl className="grid flex-1 grid-cols-1 gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
                <div><dt className="text-xs text-mist">{t.booking.pickup}</dt><dd className="font-medium">{fmtShort(b.pickup, lang)}</dd></div>
                <div><dt className="text-xs text-mist">{t.booking.return}</dt><dd className="font-medium">{fmtShort(b.return, lang)}</dd></div>
                <div><dt className="text-xs text-mist">{t.booking.location}</dt><dd className="font-medium">{locations.find((l) => l.id === b.locationId)?.name[lang]}</dd></div>
                <div><dt className="text-xs text-mist">{t.booking.extras}</dt><dd className="font-medium">{b.addOns.length ? b.addOns.map((a) => `${addOnCatalog.find((x) => x.id === a.id)?.name[lang]}${a.qty > 1 ? ` ×${a.qty}` : ""}`).join(", ") : "—"}</dd></div>
                <div className="sm:col-span-2"><dt className="text-xs text-mist">{t.booking.customer}</dt>
                  <dd className="flex flex-wrap items-center gap-x-3 gap-y-1"><Link href={`${base}/customers/${c.id}`} className="font-semibold text-petrol">{c.fullName}</Link>
                    <a href={`tel:${c.phone}`} className="text-steel underline-offset-2 hover:underline">{c.phone}</a>
                    <a href={wa} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[#1f8f4e]"><IconWhatsApp className="size-4" />{t.booking.whatsapp}</a>
                    {c.email && <span className="text-steel">{c.email}</span>}</dd></div>
                {b.customerNotes && <div className="sm:col-span-2"><dt className="text-xs text-mist">{t.booking.customerNotes}</dt><dd className="rounded-lg bg-ivory px-3 py-2">{b.customerNotes}</dd></div>}
              </dl>
            </div>
            {["pending", "confirmed"].includes(b.status) && (
              <div className="mt-5 flex flex-wrap gap-2 border-t border-line pt-4">
                <Button size="sm" variant="secondary" onClick={() => setDialog("dates")}>{t.booking.changeDates}</Button>
                <Button size="sm" variant="secondary" onClick={() => setDialog("assign")}>{t.booking.assign}</Button>
              </div>
            )}
          </Card>

          <PriceBreakdown quote={b.quote} lang={lang} addOns={addOnCatalog} locations={locations} seasonalRules={seasonalRules} locationId={b.locationId} />

          <Card title={t.booking.timeline}>
            <ol className="relative space-y-4 border-l border-line pl-5">
              {[...b.history].reverse().map((h, i) => (
                <li key={i} className="relative">
                  <span className={`absolute -left-[26px] top-1 size-3 rounded-full border-2 border-paper ${i === 0 ? "bg-petrol" : "bg-line"}`} />
                  <p className="text-sm font-medium">{h.from === h.to ? h.reason : t.status[h.to]}</p>
                  <p className="text-xs text-mist">{fmtIso(h.at, lang)} · {t.booking.by} {h.by}{h.from !== h.to && h.reason ? ` — ${h.reason}` : ""}</p>
                </li>
              ))}
            </ol>
          </Card>

          <Card title={t.booking.internalNotes}>
            <NotesEditor key={b.id} initial={b.internalNotes} hint={t.booking.internalHint} onSave={(n) => act((st) => setInternalNotes(st, b.id, n), t.common.saved)} />
          </Card>
        </div>

        <div className="space-y-5 lg:order-2">
          <Card title={t.booking.actions}>
            {conflicts.length > 0 && (
              <div className="mb-4 rounded-xl bg-bad-soft px-3.5 py-3 text-sm text-bad">
                <p className="flex items-center gap-2 font-semibold"><IconAlert className="size-4" />{t.booking.conflictWarning}</p>
                <ul className="mt-1.5 space-y-1">{conflicts.map((x) => (
                  <li key={x.id}>{x.kind === "booking" ? <Link className="underline" href={`${base}/bookings/${x.id}`}>{x.label}</Link> : t.fleet.mntTypes[x.label] ?? x.label} · {fmtRange(x.start, x.end ?? x.start, lang)}</li>
                ))}</ul>
              </div>
            )}
            {clashes.length > 0 && (
              <div className="mb-4 rounded-xl bg-warn-soft px-3.5 py-3 text-sm text-warn">
                <p>{t.booking.clashWarning(clashes.length)}</p>
                <p className="mt-1">{clashes.map((x) => <Link key={x.id} className="mr-2 font-mono underline" href={`${base}/bookings/${x.id}`}>{x.ref}</Link>)}</p>
              </div>
            )}
            {next.length === 0 ? <p className="text-sm text-mist">—</p> : (
              <div className="flex flex-col gap-2">
                {primary.map((to) => (
                  <Button key={to} onClick={() => go(to)} disabled={to === "confirmed" && conflicts.length > 0}>{t.actions[to]}</Button>
                ))}
                {canTransition(b.status, "rejected") && <Button variant="secondary" className="text-bad!" onClick={() => setDialog("rejected")}>{t.actions.rejected}</Button>}
                {canTransition(b.status, "cancelled") && <Button variant="ghost" className="text-bad!" onClick={() => setDialog("cancelled")}>{t.actions.cancelled}</Button>}
              </div>
            )}
          </Card>

          <Card title={t.booking.summary}>
            <dl className="space-y-2 text-sm">
              {[
                [t.booking.due, formatRM(bal.dueSen, lang)],
                [t.booking.paid, formatRM(bal.paidSen, lang)],
                ...(bal.refundedSen ? [[t.booking.refunded, formatRM(bal.refundedSen, lang)]] : []),
              ].map(([k, val]) => <div key={k} className="flex justify-between"><dt className="text-steel">{k}</dt><dd className="tabular-nums">{val}</dd></div>)}
              <div className="flex justify-between border-t border-line pt-2 font-semibold">
                <dt>{t.booking.outstanding}</dt><dd className={`tabular-nums ${bal.outstandingSen ? "text-warn" : "text-good"}`}>{formatRM(bal.outstandingSen, lang)}</dd>
              </div>
              <div className="flex justify-between pt-2"><dt className="text-steel">{t.booking.deposit} ({formatRM(bal.depositRequiredSen, lang)})</dt>
                <dd>{t.booking.depositStatus[bal.depositStatus]}{bal.depositHeldSen > 0 && <span className="tabular-nums"> · {formatRM(bal.depositHeldSen, lang)}</span>}</dd></div>
              {bal.refundStatus !== "none" && <div className="flex justify-between"><dt className="text-steel">{t.booking.refunded}</dt><dd className={bal.refundStatus === "due" ? "font-semibold text-warn" : ""}>{t.booking.refundStatus[bal.refundStatus]}</dd></div>}
            </dl>
            {b.extraCharges.length > 0 && (
              <div className="mt-4 border-t border-line pt-3">
                <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-mist">{t.booking.charges}</p>
                {b.extraCharges.map((ch) => <p key={ch.id} className="flex justify-between text-sm"><span>{t.booking.chargeTypes[ch.type]}{ch.note && <span className="text-mist"> · {ch.note}</span>}</span><span className="tabular-nums">{formatRM(ch.amountSen, lang)}</span></p>)}
              </div>
            )}
            <div className="mt-4 flex flex-wrap gap-2">
              <Button size="sm" onClick={() => setDialog("payment")}>{t.booking.recordPayment}</Button>
              {!["cancelled", "rejected", "completed"].includes(b.status) && <Button size="sm" variant="secondary" onClick={() => setDialog("charge")}>{t.booking.addCharge}</Button>}
            </div>
            <p className="mt-3 text-xs text-mist">{t.booking.paymentNote}</p>
          </Card>

          <Card title={t.booking.payments} pad={false}>
            {payments.length === 0 ? <Empty>{t.booking.noPayments}</Empty> : (
              <ul className="divide-y divide-line">{payments.map((p) => (
                <li key={p.id} className="flex items-start justify-between gap-3 px-5 py-3 text-sm">
                  <div><p className="font-medium">{t.booking.kind[p.kind]}</p><p className="text-xs text-mist">{t.booking.methodNames[p.method]}{p.reference && ` · ${p.reference}`} · {fmtIso(p.receivedAt, lang)}</p></div>
                  <p className={`tabular-nums font-semibold ${p.kind.includes("refund") ? "text-bad" : ""}`}>{p.kind.includes("refund") ? "−" : ""}{formatRM(p.amountSen, lang)}</p>
                </li>
              ))}</ul>
            )}
          </Card>
        </div>
      </div>

      {(dialog === "rejected" || dialog === "cancelled") && <ReasonDialog open kind={dialog === "rejected" ? "rejected" : "cancelled"}
        onClose={() => setDialog(null)} onSubmit={(r) => { if (go(dialog as BookingStatus, r)) setDialog(null); }} />}
      {dialog === "dates" && <DatesDialog open booking={b} onClose={() => setDialog(null)}
        onSubmit={(p, r) => { if (act((st) => changeDates(st, b.id, p, r, user), t.common.saved).ok) setDialog(null); }} />}
      {dialog === "assign" && <AssignDialog open bookingId={b.id} onClose={() => setDialog(null)}
        onSubmit={(vid) => { if (act((st) => assignVehicle(st, b.id, vid, user), t.common.saved).ok) setDialog(null); }} />}
      {dialog === "payment" && <PaymentDialog open suggested={bal.outstandingSen} deposit={bal.depositRequiredSen - bal.depositHeldSen > 0 ? bal.depositRequiredSen - bal.depositHeldSen : 0}
        depositHeld={bal.depositHeldSen} onClose={() => setDialog(null)}
        onSubmit={(p) => { if (act((st) => recordPayment(st, { ...p, bookingId: b.id, receivedAt: new Date().toISOString(), recordedBy: user }), t.common.saved).ok) setDialog(null); }} />}
      {dialog === "charge" && <ChargeDialog open onClose={() => setDialog(null)}
        onSubmit={(ch) => { if (act((st) => addCharge(st, b.id, ch), t.common.saved).ok) setDialog(null); }} />}
    </>
  );
}

function NotesEditor({ initial, hint, onSave }: { initial: string; hint: string; onSave: (n: string) => void }) {
  const { t } = useAdminCtx();
  const [v, setV] = useState(initial);
  return (
    <div>
      <textarea value={v} onChange={(e) => setV(e.target.value)} rows={3} maxLength={2000} placeholder={hint} className={`${inputClass} h-auto py-2.5`} aria-label={hint} />
      <div className="mt-2 flex justify-end"><Button size="sm" variant="secondary" disabled={v === initial} onClick={() => onSave(v)}>{t.common.save}</Button></div>
    </div>
  );
}

function ReasonDialog({ open, kind, onClose, onSubmit }: { open: boolean; kind: "rejected" | "cancelled"; onClose: () => void; onSubmit: (r: string) => void }) {
  const { t } = useAdminCtx();
  const [r, setR] = useState("");
  return (
    <Dialog open={open} onClose={onClose} title={t.actions[kind]}
      footer={<><Button variant="secondary" onClick={onClose}>{t.common.cancel}</Button><Button className="bg-bad! text-white! hover:brightness-110" disabled={kind === "rejected" && !r.trim()} onClick={() => onSubmit(r)}>{t.actions[kind]}</Button></>}>
      <Field label={kind === "rejected" ? t.booking.rejectPrompt : t.booking.cancelPrompt} htmlFor="reason">
        <textarea id="reason" rows={3} value={r} onChange={(e) => setR(e.target.value)} maxLength={500} className={`${inputClass} h-auto py-2.5`} />
      </Field>
    </Dialog>
  );
}

function DatesDialog({ open, booking, onClose, onSubmit }: { open: boolean; booking: { pickup: string; return: string }; onClose: () => void; onSubmit: (p: string, r: string) => void }) {
  const { t } = useAdminCtx();
  const s = useAdmin()!;
  const [pd, setPd] = useState(booking.pickup.slice(0, 10)), [pt, setPt] = useState(booking.pickup.slice(11));
  const [rd, setRd] = useState(booking.return.slice(0, 10)), [rt, setRt] = useState(booking.return.slice(11));
  const slots = timeSlots(s.rules.openHour, s.rules.closeHour);
  const withCurrent = (cur: string) => (slots.includes(cur) ? slots : [cur, ...slots]);
  return (
    <Dialog open={open} onClose={onClose} title={t.booking.changeDates}
      footer={<><Button variant="secondary" onClick={onClose}>{t.common.cancel}</Button><Button onClick={() => onSubmit(`${pd}T${pt}`, `${rd}T${rt}`)}>{t.common.save}</Button></>}>
      <div className="grid grid-cols-2 gap-3">
        <Field label={t.booking.pickup} htmlFor="d-pd"><input id="d-pd" type="date" value={pd} onChange={(e) => setPd(e.target.value)} className={inputClass} /></Field>
        <Field label="&nbsp;" htmlFor="d-pt"><Select id="d-pt" value={pt} onChange={(e) => setPt(e.target.value)}>{withCurrent(pt).map((x) => <option key={x}>{x}</option>)}</Select></Field>
        <Field label={t.booking.return} htmlFor="d-rd"><input id="d-rd" type="date" value={rd} onChange={(e) => setRd(e.target.value)} className={inputClass} /></Field>
        <Field label="&nbsp;" htmlFor="d-rt"><Select id="d-rt" value={rt} onChange={(e) => setRt(e.target.value)}>{withCurrent(rt).map((x) => <option key={x}>{x}</option>)}</Select></Field>
      </div>
    </Dialog>
  );
}

function AssignDialog({ open, bookingId, onClose, onSubmit }: { open: boolean; bookingId: string; onClose: () => void; onSubmit: (vehicleId: string) => void }) {
  const { t, lang } = useAdminCtx();
  const s = useAdmin()!;
  const b = findBooking(s, bookingId)!;
  const free = s.vehicles.filter((v) => v.id !== b.vehicleId && v.status === "active" && conflictsFor(s, v.id, b.pickup, b.return, b.id).length === 0);
  return (
    <Dialog open={open} onClose={onClose} title={t.booking.assign}>
      <p className="mb-3 text-sm text-steel">{t.booking.assignHint}</p>
      {free.length === 0 ? <Empty>{t.booking.noAlternatives}</Empty> : (
        <ul className="divide-y divide-line rounded-xl border border-line">{free.map((v) => (
          <li key={v.id}><button type="button" onClick={() => onSubmit(v.id)} className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-ivory">
            <span><span className="font-medium">{v.make} {v.model}</span> <span className="text-sm text-mist">· {v.plateNo}</span></span>
            <span className="text-sm tabular-nums text-steel">{formatRM(v.rates.daily, lang)}/{lang === "ms" ? "hari" : "day"}</span>
          </button></li>
        ))}</ul>
      )}
    </Dialog>
  );
}

function PaymentDialog({ open, suggested, deposit, depositHeld, onClose, onSubmit }: {
  open: boolean; suggested: number; deposit: number; depositHeld: number; onClose: () => void;
  onSubmit: (p: { kind: PaymentKind; method: PaymentMethod; amountSen: number; reference: string }) => void;
}) {
  const { t } = useAdminCtx();
  const [kind, setKind] = useState<PaymentKind>(suggested > 0 ? "rental" : deposit > 0 ? "deposit" : "deposit_refund");
  const [method, setMethod] = useState<PaymentMethod>("cash");
  const preset = kind === "rental" ? suggested : kind === "deposit" ? deposit : kind === "deposit_refund" ? depositHeld : 0;
  const [amount, setAmount] = useState<string | null>(null);
  const [ref, setRef] = useState("");
  const value = amount ?? (preset ? (preset / 100).toFixed(2) : "");
  const sen = parseRM(value);
  return (
    <Dialog open={open} onClose={onClose} title={t.booking.recordPayment}
      footer={<><Button variant="secondary" onClick={onClose}>{t.common.cancel}</Button><Button disabled={!(sen > 0)} onClick={() => onSubmit({ kind, method, amountSen: sen, reference: ref.trim() })}>{t.common.save}</Button></>}>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label={t.common.type} htmlFor="p-kind"><Select id="p-kind" value={kind} onChange={(e) => { setKind(e.target.value as PaymentKind); setAmount(null); }}>
          {(["rental", "deposit", "deposit_refund", "refund"] as PaymentKind[]).map((k) => <option key={k} value={k}>{t.booking.kind[k]}</option>)}</Select></Field>
        <Field label={t.common.method} htmlFor="p-method"><Select id="p-method" value={method} onChange={(e) => setMethod(e.target.value as PaymentMethod)}>
          {(["cash", "bank_transfer", "duitnow", "card_manual"] as PaymentMethod[]).map((k) => <option key={k} value={k}>{t.booking.methodNames[k]}</option>)}</Select></Field>
        <Field label={t.common.amount} htmlFor="p-amt" error={value && !(sen > 0) ? t.errors.invalid_amount : null}>
          <input id="p-amt" inputMode="decimal" value={value} onChange={(e) => setAmount(e.target.value)} className={`${inputClass} tabular-nums`} /></Field>
        <Field label={<>{t.common.reference} <span className="font-normal text-mist">({t.common.optional})</span></>} htmlFor="p-ref">
          <input id="p-ref" value={ref} onChange={(e) => setRef(e.target.value)} maxLength={60} className={inputClass} /></Field>
      </div>
      <p className="mt-3 text-xs text-mist">{t.booking.paymentNote}</p>
    </Dialog>
  );
}

function ChargeDialog({ open, onClose, onSubmit }: { open: boolean; onClose: () => void; onSubmit: (c: Omit<ExtraCharge, "id" | "at">) => void }) {
  const { t } = useAdminCtx();
  const [type, setType] = useState<ExtraCharge["type"]>("fuel");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const sen = parseRM(amount);
  return (
    <Dialog open={open} onClose={onClose} title={t.booking.addCharge}
      footer={<><Button variant="secondary" onClick={onClose}>{t.common.cancel}</Button><Button disabled={!(sen > 0)} onClick={() => onSubmit({ type, amountSen: sen, note: note.trim() })}>{t.common.add}</Button></>}>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label={t.common.type} htmlFor="c-type"><Select id="c-type" value={type} onChange={(e) => setType(e.target.value as ExtraCharge["type"])}>
          {(["late", "fuel", "damage", "cleaning", "other"] as const).map((k) => <option key={k} value={k}>{t.booking.chargeTypes[k]}</option>)}</Select></Field>
        <Field label={t.common.amount} htmlFor="c-amt"><input id="c-amt" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} className={`${inputClass} tabular-nums`} /></Field>
        <Field label={t.common.notes} htmlFor="c-note" className="sm:col-span-2"><input id="c-note" value={note} onChange={(e) => setNote(e.target.value)} maxLength={200} className={inputClass} /></Field>
      </div>
    </Dialog>
  );
}
