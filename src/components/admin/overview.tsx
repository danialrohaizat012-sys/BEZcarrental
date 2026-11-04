"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { dashboardStats, findCustomer, findVehicle } from "@/lib/admin/domain";
import { useAdmin } from "@/lib/admin/store";
import type { AdminBooking } from "@/lib/admin/types";
import { formatRM } from "@/lib/money";
import { SampleTag } from "../ui/badge";
import { useAdminCtx } from "./context";
import { fmtMonth, fmtShort } from "./format";
import { Card, Empty, PageHeader, StatTile, StatusBadge } from "./ui";

export function Overview() {
  const s = useAdmin()!;
  const { t, lang } = useAdminCtx();
  const st = useMemo(() => dashboardStats(s), [s]);
  const base = `/${lang}/admin`;
  const pending = s.bookings.filter((b) => b.status === "pending").sort((a, b) => a.pickup.localeCompare(b.pickup));

  const Row = ({ b, when }: { b: AdminBooking; when: string }) => {
    const v = findVehicle(s, b.vehicleId), c = findCustomer(s, b.customerId);
    return (
      <li>
        <Link href={`${base}/bookings/${b.id}`} className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-ivory">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{v?.make} {v?.model} <span className="font-normal text-mist">· {v?.plateNo}</span></p>
            <p className="truncate text-xs text-steel">{c?.fullName} · {b.ref}</p>
          </div>
          <div className="text-right">
            <p className="text-xs font-medium tabular-nums">{when}</p>
            <StatusBadge status={b.status} />
          </div>
        </Link>
      </li>
    );
  };

  return (
    <>
      <PageHeader title={t.overview.title} subtitle={t.overview.greeting} />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-6">
        <StatTile label={t.overview.total} value={st.total} />
        <StatTile label={t.overview.pending} value={st.pending} tone={st.pending ? "warn" : "default"} href={`${base}/bookings?status=pending`} />
        <StatTile label={t.overview.confirmed} value={st.confirmed} href={`${base}/bookings?status=confirmed`} />
        <StatTile label={t.overview.onRoad} value={st.onRoad} href={`${base}/bookings?status=active`} sub={st.overdue.length ? `${st.overdue.length} ${t.overview.overdue.toLowerCase()}` : undefined} />
        <StatTile label={t.overview.available} value={st.available} tone="good" sub={t.overview.ofFleet(st.fleet)} href={`${base}/calendar`} />
        <StatTile label={t.overview.upcomingReturns} value={st.upcomingReturns.length} />
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        <RevenueCard data={st.revenue} thisMonth={st.revenueThisMonth} outstanding={st.outstanding} deposits={st.depositsHeld} />
        <Card pad={false} title={<span className="flex items-center gap-2">{t.overview.needsAction}{pending.length > 0 && <span className="rounded-full bg-warn-soft px-2 text-xs text-warn">{pending.length}</span>}</span>}
          actions={<Link href={`${base}/bookings?status=pending`} className="text-sm font-semibold text-petrol">{t.overview.viewAll}</Link>}>
          {pending.length ? <ul className="divide-y divide-line">{pending.slice(0, 6).map((b) => <Row key={b.id} b={b} when={fmtShort(b.pickup, lang)} />)}</ul> : <Empty>{t.overview.noPending}</Empty>}
        </Card>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <Card pad={false} title={t.overview.pickups}>
          {st.pickupsSoon.length ? <ul className="divide-y divide-line">{st.pickupsSoon.map((b) => <Row key={b.id} b={b} when={fmtShort(b.pickup, lang)} />)}</ul> : <Empty>{t.overview.noPickups}</Empty>}
        </Card>
        <Card pad={false} title={t.overview.upcomingReturns}>
          {st.upcomingReturns.length ? <ul className="divide-y divide-line">{st.upcomingReturns.map((b) => <Row key={b.id} b={b} when={fmtShort(b.return, lang)} />)}</ul> : <Empty>{t.overview.noReturns}</Empty>}
        </Card>
      </div>
    </>
  );
}

function RevenueCard({ data, thisMonth, outstanding, deposits }: { data: { month: string; sen: number }[]; thisMonth: number; outstanding: number; deposits: number }) {
  const { t, lang } = useAdminCtx();
  const [hover, setHover] = useState<number | null>(null);
  const [table, setTable] = useState(false);
  const max = Math.max(1, ...data.map((d) => d.sen));
  const niceMax = Math.ceil(max / 100000) * 100000; // round up to RM 1,000
  const W = 560, H = 200, padL = 52, padB = 24, padT = 10;
  const bw = (W - padL) / data.length;
  const y = (v: number) => padT + (H - padT - padB) * (1 - v / niceMax);
  const ticks = [0, 0.5, 1].map((f) => Math.round(niceMax * f));

  return (
    <Card title={<span className="flex items-center gap-2">{t.overview.revenue}<SampleTag>{t.common.demoData}</SampleTag></span>}
      actions={<button type="button" onClick={() => setTable((x) => !x)} className="shrink-0 whitespace-nowrap text-sm font-semibold text-petrol">{table ? (lang === "ms" ? "Papar graf" : "Show chart") : t.overview.table}</button>}>
      <div className="mb-4 flex flex-wrap gap-x-8 gap-y-2">
        <div><p className="text-xs text-mist">{t.overview.thisMonth}</p><p className="font-display text-xl font-bold tabular-nums">{formatRM(thisMonth, lang)}</p></div>
        <div><p className="text-xs text-mist">{t.overview.outstanding}</p><p className="font-display text-xl font-bold tabular-nums">{formatRM(outstanding, lang)}</p></div>
        <div><p className="text-xs text-mist">{t.overview.depositsHeld}</p><p className="font-display text-xl font-bold tabular-nums">{formatRM(deposits, lang)}</p></div>
      </div>
      {table ? (
        <table className="w-full text-sm">
          <thead><tr className="text-left text-xs text-mist"><th className="py-1.5 font-medium">{t.overview.month}</th><th className="py-1.5 text-right font-medium">{t.overview.revenue}</th></tr></thead>
          <tbody className="divide-y divide-line">{data.map((d) => <tr key={d.month}><td className="py-2">{fmtMonth(d.month, lang)} {d.month.slice(0, 4)}</td><td className="py-2 text-right tabular-nums">{formatRM(d.sen, lang)}</td></tr>)}</tbody>
        </table>
      ) : (
        <div className="relative">
          <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label={t.overview.revenueNote} onMouseLeave={() => setHover(null)}>
            {ticks.map((v) => (
              <g key={v}>
                <line x1={padL} x2={W} y1={y(v)} y2={y(v)} stroke="#e2ded5" strokeWidth="1" />
                <text x={padL - 8} y={y(v) + 4} textAnchor="end" fontSize="11" fill="#8b939d">{v >= 100000 ? `${v / 100000}k` : v / 100}</text>
              </g>
            ))}
            {data.map((d, i) => {
              const x = padL + i * bw + bw * 0.28, w = bw * 0.44, top = y(Math.max(0, d.sen)), h = H - padB - top;
              const r = Math.min(4, h / 2, w / 2);
              return (
                <g key={d.month} onMouseEnter={() => setHover(i)} onFocus={() => setHover(i)} tabIndex={0} aria-label={`${fmtMonth(d.month, lang)}: ${formatRM(d.sen, lang)}`}>
                  <rect x={padL + i * bw} y={padT} width={bw} height={H - padT - padB} fill="transparent" />
                  {h > 0 && <path d={`M${x},${H - padB} V${top + r} Q${x},${top} ${x + r},${top} H${x + w - r} Q${x + w},${top} ${x + w},${top + r} V${H - padB} Z`}
                    fill={i === data.length - 1 ? "#0e4d57" : "#5e8f97"} opacity={hover === null || hover === i ? 1 : 0.55} />}
                  <text x={padL + i * bw + bw / 2} y={H - 6} textAnchor="middle" fontSize="11" fill="#5b6470">{fmtMonth(d.month, lang)}</text>
                </g>
              );
            })}
          </svg>
          {hover !== null && (
            <div className="pointer-events-none absolute -translate-x-1/2 -translate-y-full rounded-lg bg-ink px-2.5 py-1.5 text-xs text-ivory shadow-lift"
              style={{ left: `${((padL + hover * bw + bw / 2) / W) * 100}%`, top: `${(y(Math.max(0, data[hover].sen)) / H) * 100}%` }}>
              <span className="font-semibold tabular-nums">{formatRM(data[hover].sen, lang)}</span> · {fmtMonth(data[hover].month, lang)}
            </div>
          )}
        </div>
      )}
      <p className="mt-2 text-xs text-mist">{t.overview.revenueNote}</p>
    </Card>
  );
}
