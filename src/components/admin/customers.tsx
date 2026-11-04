"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { balanceOf, findCustomer, findVehicle, updateCustomer } from "@/lib/admin/domain";
import { useAdmin } from "@/lib/admin/store";
import { formatRM } from "@/lib/money";
import { Button } from "../ui/button";
import { Field, inputClass } from "../ui/field";
import { IconChevronLeft, IconWhatsApp } from "../ui/icons";
import { useAdminCtx } from "./context";
import { fmtIso, fmtRange } from "./format";
import { Card, Empty, PageHeader, StatusBadge } from "./ui";

export function CustomersList() {
  const s = useAdmin()!;
  const { t, lang } = useAdminCtx();
  const [q, setQ] = useState("");
  const rows = useMemo(() => s.customers.map((c) => {
    const bs = s.bookings.filter((b) => b.customerId === c.id);
    const bal = bs.map((b) => balanceOf(s, b));
    return { c, count: bs.length, paid: bal.reduce((x, b) => x + b.paidSen - b.refundedSen, 0), outstanding: bal.reduce((x, b) => x + b.outstandingSen, 0),
      last: bs.map((b) => b.pickup).sort().at(-1) };
  }).filter(({ c }) => !q.trim() || `${c.fullName} ${c.phone} ${c.email}`.toLowerCase().includes(q.trim().toLowerCase()))
    .sort((a, b) => (b.last ?? "").localeCompare(a.last ?? "")), [s, q]);
  const base = `/${lang}/admin`;
  return (
    <>
      <PageHeader title={t.customers.title} subtitle={`${s.customers.length} · ${t.common.demoData}`} />
      <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={t.common.search} aria-label={t.common.search} className={`${inputClass} mb-4 sm:max-w-xs`} />
      <div className="overflow-hidden rounded-2xl border border-line bg-paper">
        {rows.length === 0 ? <Empty>{t.common.empty}</Empty> : (
          <ul className="divide-y divide-line">
            {rows.map(({ c, count, paid, outstanding }) => (
              <li key={c.id}><Link href={`${base}/customers/${c.id}`} className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-1 px-5 py-3.5 hover:bg-ivory md:grid-cols-[2fr_1.3fr_.6fr_1fr_1fr]">
                <div className="min-w-0"><p className="truncate font-semibold">{c.fullName}</p><p className="truncate text-xs text-mist md:hidden">{c.phone}</p></div>
                <p className="hidden text-sm text-steel md:block">{c.phone}</p>
                <p className="text-right text-sm tabular-nums md:text-left">{count} <span className="text-mist">{t.customers.bookings.toLowerCase()}</span></p>
                <p className="hidden text-sm tabular-nums md:block">{formatRM(paid, lang)}</p>
                <p className={`hidden text-sm tabular-nums md:block ${outstanding ? "font-semibold text-warn" : "text-mist"}`}>{outstanding ? formatRM(outstanding, lang) : "—"}</p>
              </Link></li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}

export function CustomerDetail({ id }: { id: string }) {
  const s = useAdmin()!;
  const { t, lang, act } = useAdminCtx();
  const c = findCustomer(s, id);
  const [form, setForm] = useState(c);
  if (!c || !form) return <Empty>{t.errors.not_found}</Empty>;
  const base = `/${lang}/admin`;
  const bookings = s.bookings.filter((b) => b.customerId === c.id).sort((a, b) => b.pickup.localeCompare(a.pickup));
  const ids = new Set(bookings.map((b) => b.id));
  const payments = s.payments.filter((p) => ids.has(p.bookingId)).sort((a, b) => b.receivedAt.localeCompare(a.receivedAt));
  const dirty = JSON.stringify(form) !== JSON.stringify(c);
  return (
    <>
      <Link href={`${base}/customers`} className="inline-flex items-center gap-1 text-sm font-medium text-steel hover:text-ink"><IconChevronLeft className="size-4" />{t.customers.title}</Link>
      <div className="mb-6 mt-3 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-bold">{c.fullName}</h1>
        <div className="flex gap-2">
          <a href={`tel:${c.phone}`} className="inline-flex h-9 items-center rounded-lg border border-line bg-paper px-3.5 text-sm font-semibold">{c.phone}</a>
          <a href={`https://wa.me/${c.phone.replace("+", "")}`} target="_blank" rel="noopener noreferrer" className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#1f8f4e] px-3.5 text-sm font-semibold text-white"><IconWhatsApp className="size-4" />WhatsApp</a>
        </div>
      </div>
      <div className="grid gap-5 lg:grid-cols-[380px_1fr]">
        <Card title={t.customers.profile}>
          <div className="space-y-3">
            <Field label={t.customers.name} htmlFor="c-name"><input id="c-name" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} className={inputClass} /></Field>
            <Field label={t.customers.phone} htmlFor="c-phone"><input id="c-phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={inputClass} /></Field>
            <Field label={t.customers.email} htmlFor="c-email"><input id="c-email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={inputClass} /></Field>
            <Field label={t.customers.notes} htmlFor="c-notes" hint={t.customers.notesHint}>
              <textarea id="c-notes" rows={4} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className={`${inputClass} h-auto py-2.5`} /></Field>
            <div className="flex justify-end"><Button disabled={!dirty} onClick={() => act((x) => updateCustomer(x, form), t.common.saved)}>{t.common.save}</Button></div>
          </div>
        </Card>
        <div className="space-y-5">
          <Card title={t.customers.history} pad={false}>
            {bookings.length === 0 ? <Empty>{t.common.empty}</Empty> : <ul className="divide-y divide-line">{bookings.map((b) => {
              const v = findVehicle(s, b.vehicleId); const bal = balanceOf(s, b);
              return (
                <li key={b.id}><Link href={`${base}/bookings/${b.id}`} className="flex items-center justify-between gap-3 px-5 py-3 hover:bg-ivory">
                  <div className="min-w-0"><p className="text-sm font-semibold">{v?.make} {v?.model} <span className="font-mono text-xs font-normal text-mist">{b.ref}</span></p>
                    <p className="text-xs text-steel">{fmtRange(b.pickup, b.return, lang)} · {formatRM(bal.dueSen, lang)}{bal.outstandingSen ? ` · ${t.booking.outstanding} ${formatRM(bal.outstandingSen, lang)}` : ""}</p></div>
                  <StatusBadge status={b.status} />
                </Link></li>
              );
            })}</ul>}
          </Card>
          <Card title={t.customers.payments} pad={false}>
            {payments.length === 0 ? <Empty>{t.booking.noPayments}</Empty> : <ul className="divide-y divide-line">{payments.map((p) => (
              <li key={p.id} className="flex justify-between gap-3 px-5 py-3 text-sm">
                <div><p className="font-medium">{t.booking.kind[p.kind]}</p><p className="text-xs text-mist">{t.booking.methodNames[p.method]} · {fmtIso(p.receivedAt, lang)}</p></div>
                <p className={`font-semibold tabular-nums ${p.kind.includes("refund") ? "text-bad" : ""}`}>{p.kind.includes("refund") ? "−" : ""}{formatRM(p.amountSen, lang)}</p>
              </li>))}</ul>}
          </Card>
        </div>
      </div>
    </>
  );
}
