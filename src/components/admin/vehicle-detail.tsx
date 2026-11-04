"use client";

import Link from "next/link";
import { useState } from "react";
import { addMaintenance, balanceOf, closeMaintenance, findCustomer, findVehicle, upsertVehicle, vehicleStateAt } from "@/lib/admin/domain";
import { useAdmin } from "@/lib/admin/store";
import type { MaintenanceRecord } from "@/lib/admin/types";
import { formatRM } from "@/lib/money";
import { addDaysLocal, timeSlots, todayLocal } from "@/lib/time";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Field, Select, inputClass } from "../ui/field";
import { IconChevronLeft } from "../ui/icons";
import { Gallery } from "../vehicle/gallery";
import { useAdminCtx } from "./context";
import { stateTone } from "./fleet";
import { fmtRange, parseRM } from "./format";
import { Card, Dialog, Empty, StatusBadge } from "./ui";
import { VehicleEditor } from "./vehicle-editor";

export function VehicleDetail({ id }: { id: string }) {
  const s = useAdmin()!;
  const { t, lang, act } = useAdminCtx();
  const [editing, setEditing] = useState(false);
  const [mnt, setMnt] = useState(false);
  const [closing, setClosing] = useState<MaintenanceRecord | null>(null);
  const v = findVehicle(s, id);
  const base = `/${lang}/admin`;
  if (!v) return <Empty>{t.errors.not_found}</Empty>;
  const st = vehicleStateAt(s, v, new Date());
  const bookings = s.bookings.filter((b) => b.vehicleId === v.id).sort((a, b) => b.pickup.localeCompare(a.pickup));
  const completed = bookings.filter((b) => b.status === "completed");
  const revenue = completed.reduce((x, b) => x + balanceOf(s, b).paidSen, 0);
  const records = s.maintenance.filter((m) => m.vehicleId === v.id).sort((a, b) => b.start.localeCompare(a.start));
  const f = t.fleet;

  return (
    <>
      <Link href={`${base}/fleet`} className="inline-flex items-center gap-1 text-sm font-medium text-steel hover:text-ink"><IconChevronLeft className="size-4" />{f.title}</Link>
      <div className="mb-6 mt-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold">{v.make} {v.model} <span className="font-normal text-steel">{v.variant}</span></h1>
          <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-steel"><span className="font-mono">{v.plateNo}</span> · {v.year} · {v.mileageKm.toLocaleString()} km <Badge tone={stateTone[st]}>{t.vehicleState[st]}</Badge></p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={() => act((x) => upsertVehicle(x, { ...v, status: v.status === "active" ? "unavailable" : "active" }), t.common.saved)}>
            {v.status === "active" ? f.setUnavailable : f.setAvailable}</Button>
          <Button variant="secondary" onClick={() => setMnt(true)}>{f.addMaintenance}</Button>
          <Button onClick={() => setEditing(true)}>{t.common.edit}</Button>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_380px]">
        <div className="space-y-5">
          <Card pad><Gallery vehicle={v} lang={lang} caption={lang === "ms" ? "Ilustrasi — muat naik gambar melalui Ubah" : "Illustration — upload photos via Edit"} /></Card>
          <Card title={f.history} pad={false}>
            {bookings.length === 0 ? <Empty>{f.noHistory}</Empty> : (
              <ul className="divide-y divide-line">{bookings.map((b) => (
                <li key={b.id}><Link href={`${base}/bookings/${b.id}`} className="flex items-center justify-between gap-3 px-5 py-3 hover:bg-ivory">
                  <div className="min-w-0"><p className="font-mono text-[13px] font-semibold text-petrol">{b.ref}</p>
                    <p className="truncate text-xs text-steel">{findCustomer(s, b.customerId)?.fullName} · {fmtRange(b.pickup, b.return, lang)}</p></div>
                  <StatusBadge status={b.status} />
                </Link></li>
              ))}</ul>
            )}
          </Card>
        </div>
        <div className="space-y-5">
          <Card title={f.rates}>
            <dl className="space-y-2 text-sm">{(["daily", "weekly", "monthly", "hourly"] as const).map((k) => (
              <div key={k} className="flex justify-between"><dt className="text-steel">{f[k]}</dt><dd className="font-semibold tabular-nums">{formatRM(v.rates[k], lang)}</dd></div>))}</dl>
          </Card>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-line bg-paper p-4"><p className="text-xs text-mist">{f.rentals}</p><p className="font-display text-2xl font-bold tabular-nums">{completed.length}</p></div>
            <div className="rounded-2xl border border-line bg-paper p-4"><p className="text-xs text-mist">{f.revenue}</p><p className="font-display text-2xl font-bold tabular-nums">{formatRM(revenue, lang)}</p></div>
          </div>
          <Card title={f.maintenance} pad={false}>
            {records.length === 0 ? <Empty>{t.common.empty}</Empty> : (
              <ul className="divide-y divide-line">{records.map((m) => (
                <li key={m.id} className="px-5 py-3 text-sm">
                  <div className="flex items-center justify-between gap-2"><p className="font-semibold">{f.mntTypes[m.type]}</p>
                    <Badge tone={m.status === "open" ? "amber" : "neutral"}>{m.status === "open" ? f.open : f.closed}</Badge></div>
                  {m.description && <p className="text-steel">{m.description}</p>}
                  <p className="text-xs text-mist">{m.end ? fmtRange(m.start, m.end, lang) : `${fmtRange(m.start, m.start, lang).split(" → ")[0]} → ${f.untilClosed}`} · {formatRM(m.costSen, lang)}</p>
                  {m.status === "open" && <Button size="sm" variant="secondary" className="mt-2" onClick={() => setClosing(m)}>{f.closeMaintenance}</Button>}
                </li>
              ))}</ul>
            )}
          </Card>
        </div>
      </div>

      {editing && <VehicleEditor initial={v} onClose={() => setEditing(false)} onSave={(nv) => act((x) => upsertVehicle(x, nv), t.common.saved).ok} />}
      {mnt && <MaintenanceDialog onClose={() => setMnt(false)} onSave={(m) => act((x) => addMaintenance(x, { ...m, vehicleId: v.id }), t.common.saved).ok} />}
      {closing && <CloseDialog record={closing} onClose={() => setClosing(null)} onSave={(cost) => act((x) => closeMaintenance(x, closing.id, cost), t.common.saved).ok} />}
    </>
  );
}

function MaintenanceDialog({ onClose, onSave }: { onClose: () => void; onSave: (m: Omit<MaintenanceRecord, "id" | "status" | "vehicleId">) => boolean }) {
  const { t, lang } = useAdminCtx();
  const today = todayLocal();
  const [type, setType] = useState<MaintenanceRecord["type"]>("service");
  const [desc, setDesc] = useState("");
  const [sd, setSd] = useState(addDaysLocal(today, 1)), [stime, setStime] = useState("09:00");
  const [ed, setEd] = useState(addDaysLocal(today, 2)), [etime, setEtime] = useState("17:00");
  const [open, setOpen] = useState(false);
  const [cost, setCost] = useState("0");
  const slots = timeSlots(0, 23);
  const f = t.fleet;
  const submit = () => { if (onSave({ type, description: desc.trim(), start: `${sd}T${stime}`, end: open ? null : `${ed}T${etime}`, costSen: parseRM(cost) || 0 })) onClose(); };
  return (
    <Dialog open onClose={onClose} title={f.addMaintenance}
      footer={<><Button variant="secondary" onClick={onClose}>{t.common.cancel}</Button><Button onClick={submit}>{t.common.save}</Button></>}>
      <div className="grid grid-cols-2 gap-3">
        <Field label={t.common.type} htmlFor="m-type" className="col-span-2"><Select id="m-type" value={type} onChange={(e) => setType(e.target.value as MaintenanceRecord["type"])}>
          {Object.entries(f.mntTypes).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</Select></Field>
        <Field label={t.common.description} htmlFor="m-desc" className="col-span-2"><input id="m-desc" value={desc} onChange={(e) => setDesc(e.target.value)} maxLength={200} className={inputClass} /></Field>
        <Field label={t.common.from} htmlFor="m-sd"><input id="m-sd" type="date" value={sd} onChange={(e) => setSd(e.target.value)} className={inputClass} /></Field>
        <Field label="&nbsp;" htmlFor="m-st"><Select id="m-st" value={stime} onChange={(e) => setStime(e.target.value)}>{slots.map((x) => <option key={x}>{x}</option>)}</Select></Field>
        {!open && <>
          <Field label={t.common.to} htmlFor="m-ed"><input id="m-ed" type="date" value={ed} onChange={(e) => setEd(e.target.value)} className={inputClass} /></Field>
          <Field label="&nbsp;" htmlFor="m-et"><Select id="m-et" value={etime} onChange={(e) => setEtime(e.target.value)}>{slots.map((x) => <option key={x}>{x}</option>)}</Select></Field>
        </>}
        <label className="col-span-2 flex items-center gap-2 text-sm"><input type="checkbox" checked={open} onChange={(e) => setOpen(e.target.checked)} className="size-4 accent-[#0e4d57]" />{f.untilClosed}</label>
        <Field label={t.common.cost} htmlFor="m-cost"><input id="m-cost" inputMode="decimal" value={cost} onChange={(e) => setCost(e.target.value)} className={inputClass} /></Field>
      </div>
      <p className="mt-3 text-xs text-mist">{lang === "ms" ? "Blok penyelenggaraan tidak boleh bertindih dengan tempahan yang telah disahkan." : "Maintenance cannot overlap a confirmed booking."}</p>
    </Dialog>
  );
}

function CloseDialog({ record, onClose, onSave }: { record: MaintenanceRecord; onClose: () => void; onSave: (cost: number) => boolean }) {
  const { t } = useAdminCtx();
  const [cost, setCost] = useState((record.costSen / 100).toString());
  return (
    <Dialog open onClose={onClose} title={t.fleet.closeMaintenance}
      footer={<><Button variant="secondary" onClick={onClose}>{t.common.cancel}</Button><Button onClick={() => { if (onSave(parseRM(cost) || 0)) onClose(); }}>{t.common.confirm}</Button></>}>
      <Field label={t.common.cost} htmlFor="mc-cost"><input id="mc-cost" inputMode="decimal" value={cost} onChange={(e) => setCost(e.target.value)} className={inputClass} /></Field>
    </Dialog>
  );
}
