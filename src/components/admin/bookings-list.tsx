"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { balanceOf, findCustomer, findVehicle } from "@/lib/admin/domain";
import { useAdmin } from "@/lib/admin/store";
import type { BookingStatus } from "@/lib/admin/types";
import { formatRM } from "@/lib/money";
import { inputClass } from "../ui/field";
import { useAdminCtx } from "./context";
import { fmtRange } from "./format";
import { Empty, PageHeader, StatusBadge } from "./ui";

const FILTERS: (BookingStatus | "all" | "open")[] = ["open", "pending", "confirmed", "active", "returned", "completed", "cancelled", "rejected", "all"];

export function BookingsList() {
  const s = useAdmin()!;
  const { t, lang } = useAdminCtx();
  const sp = useSearchParams();
  const router = useRouter();
  const filter = (sp.get("status") as (typeof FILTERS)[number]) || "open";
  const [q, setQ] = useState("");
  const base = `/${lang}/admin`;

  const rows = useMemo(() => {
    const term = q.trim().toLowerCase();
    return s.bookings
      .filter((b) => filter === "all" ? true : filter === "open" ? !["completed", "cancelled", "rejected"].includes(b.status)
        : filter === "active" ? b.status === "active" || b.status === "collected" : b.status === filter)
      .map((b) => ({ b, v: findVehicle(s, b.vehicleId), c: findCustomer(s, b.customerId), bal: balanceOf(s, b) }))
      .filter(({ b, v, c }) => !term || [b.ref, c?.fullName, c?.phone, v?.plateNo, v?.model].some((x) => x?.toLowerCase().includes(term)))
      .sort((x, y) => (filter === "completed" || filter === "all" ? y.b.pickup.localeCompare(x.b.pickup) : x.b.pickup.localeCompare(y.b.pickup)));
  }, [s, filter, q]);

  const label = (f: (typeof FILTERS)[number]) => (f === "all" ? t.common.all : f === "open" ? `${t.common.all} — open` : t.status[f]);
  const count = (f: (typeof FILTERS)[number]) => f === "pending" ? s.bookings.filter((b) => b.status === "pending").length : null;

  return (
    <>
      <PageHeader title={t.bookings.title} />
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="-mx-4 flex gap-1.5 overflow-x-auto px-4 pb-1 lg:mx-0 lg:flex-wrap lg:px-0">
          {FILTERS.map((f) => (
            <button key={f} type="button" onClick={() => router.replace(`${base}/bookings?status=${f}`)}
              className={`shrink-0 rounded-full border px-3.5 py-1.5 text-sm font-semibold ${filter === f ? "border-ink bg-ink text-ivory" : "border-line bg-paper text-steel hover:text-ink"}`}>
              {f === "open" ? (lang === "ms" ? "Terbuka" : "Open") : label(f)}{count(f) ? <span className="ml-1.5 rounded-full bg-amber px-1.5 text-xs text-ink">{count(f)}</span> : null}
            </button>
          ))}
        </div>
        <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={t.bookings.searchHint} aria-label={t.common.search} className={`${inputClass} lg:max-w-xs`} />
      </div>

      <div className="overflow-hidden rounded-2xl border border-line bg-paper">
        {rows.length === 0 ? <Empty>{t.bookings.noResults}</Empty> : (
          <>
            <table className="hidden w-full text-sm md:table">
              <thead className="border-b border-line bg-ivory/60 text-left text-xs uppercase tracking-wide text-mist">
                <tr>
                  <th className="px-4 py-3 font-semibold">{t.bookings.ref}</th><th className="px-4 py-3 font-semibold">{t.bookings.customer}</th>
                  <th className="px-4 py-3 font-semibold">{t.bookings.vehicle}</th><th className="px-4 py-3 font-semibold">{t.bookings.period}</th>
                  <th className="px-4 py-3 font-semibold">{t.bookings.status}</th><th className="px-4 py-3 text-right font-semibold">{t.bookings.total}</th>
                  <th className="px-4 py-3 text-right font-semibold">{t.bookings.balance}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {rows.map(({ b, v, c, bal }) => (
                  <tr key={b.id} className="cursor-pointer transition-colors hover:bg-ivory" onClick={() => router.push(`${base}/bookings/${b.id}`)}>
                    <td className="px-4 py-3"><Link href={`${base}/bookings/${b.id}`} className="font-mono text-[13px] font-semibold text-petrol" onClick={(e) => e.stopPropagation()}>{b.ref}</Link>
                      <p className="text-xs text-mist">{t.bookings.source[b.source]}</p></td>
                    <td className="px-4 py-3"><p className="font-medium">{c?.fullName}</p><p className="text-xs text-mist">{c?.phone}</p></td>
                    <td className="px-4 py-3"><p>{v?.make} {v?.model}</p><p className="text-xs text-mist">{v?.plateNo}</p></td>
                    <td className="px-4 py-3 tabular-nums text-steel">{fmtRange(b.pickup, b.return, lang)}</td>
                    <td className="px-4 py-3"><StatusBadge status={b.status} /></td>
                    <td className="px-4 py-3 text-right tabular-nums">{formatRM(bal.dueSen, lang)}</td>
                    <td className={`px-4 py-3 text-right tabular-nums ${bal.outstandingSen > 0 ? "font-semibold text-warn" : "text-mist"}`}>{bal.outstandingSen > 0 ? formatRM(bal.outstandingSen, lang) : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <ul className="divide-y divide-line md:hidden">
              {rows.map(({ b, v, c, bal }) => (
                <li key={b.id}>
                  <Link href={`${base}/bookings/${b.id}`} className="block px-4 py-3.5 active:bg-ivory">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0"><p className="font-semibold">{c?.fullName}</p><p className="text-sm text-steel">{v?.make} {v?.model} · {v?.plateNo}</p></div>
                      <StatusBadge status={b.status} />
                    </div>
                    <div className="mt-1.5 flex justify-between text-xs text-mist">
                      <span className="tabular-nums">{fmtRange(b.pickup, b.return, lang)}</span>
                      <span className={bal.outstandingSen > 0 ? "font-semibold text-warn" : ""}>{formatRM(bal.dueSen, lang)}</span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </>
  );
}
