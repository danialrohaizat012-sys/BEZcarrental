"use client";

import Link from "next/link";
import { useMemo } from "react";
import { balanceOf, findBooking, findCustomer, OPEN } from "@/lib/admin/domain";
import { useAdmin } from "@/lib/admin/store";
import { formatRM } from "@/lib/money";
import { Button } from "../ui/button";
import { useAdminCtx } from "./context";
import { fmtIso } from "./format";
import { Card, Empty, PageHeader, StatTile, StatusBadge } from "./ui";

export function Finance() {
  const s = useAdmin()!;
  const { t, lang } = useAdminCtx();
  const base = `/${lang}/admin`;
  const data = useMemo(() => {
    const rows = s.bookings.map((b) => ({ b, bal: balanceOf(s, b), c: findCustomer(s, b.customerId) }));
    const open = rows.filter((r) => OPEN.includes(r.b.status));
    return {
      charges: open.reduce((x, r) => x + r.bal.dueSen, 0),
      deposits: rows.reduce((x, r) => x + r.bal.depositHeldSen, 0),
      outstanding: rows.reduce((x, r) => x + r.bal.outstandingSen, 0),
      refundsDue: rows.filter((r) => r.bal.refundStatus === "due"),
      balances: rows.filter((r) => r.bal.outstandingSen > 0 || r.bal.depositHeldSen > 0 || r.bal.refundStatus === "due").sort((a, b) => a.b.pickup.localeCompare(b.b.pickup)),
      ledger: [...s.payments].sort((a, b) => b.receivedAt.localeCompare(a.receivedAt)),
    };
  }, [s]);

  function exportCsv() {
    const head = ["received_at", "booking_ref", "customer", "kind", "method", "amount_rm", "reference"];
    const lines = data.ledger.map((p) => {
      const b = findBooking(s, p.bookingId); const c = b && findCustomer(s, b.customerId);
      return [p.receivedAt, b?.ref ?? "", c?.fullName ?? "", p.kind, p.method, (p.amountSen / 100).toFixed(2), p.reference].map((x) => `"${String(x).replace(/"/g, '""')}"`).join(",");
    });
    const blob = new Blob([[head.join(","), ...lines].join("\n")], { type: "text/csv" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "bez-demo-payments.csv"; a.click(); URL.revokeObjectURL(a.href);
  }

  return (
    <>
      <PageHeader title={t.finance.title} subtitle={t.finance.subtitle} actions={<Button variant="secondary" onClick={exportCsv}>{t.finance.export}</Button>} />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label={t.finance.charges} value={formatRM(data.charges, lang)} />
        <StatTile label={t.finance.outstanding} value={formatRM(data.outstanding, lang)} tone={data.outstanding ? "warn" : "default"} />
        <StatTile label={t.finance.deposits} value={formatRM(data.deposits, lang)} />
        <StatTile label={t.finance.refundsDue} value={data.refundsDue.length} tone={data.refundsDue.length ? "warn" : "default"} />
      </div>
      <div className="mt-5 grid gap-5 xl:grid-cols-2">
        <Card title={t.finance.balances} pad={false}>
          {data.balances.length === 0 ? <Empty>{t.common.empty}</Empty> : (
            <div className="overflow-x-auto"><table className="w-full text-sm">
              <thead className="border-b border-line text-left text-xs uppercase tracking-wide text-mist"><tr>
                <th className="px-4 py-2.5 font-semibold">{t.bookings.ref}</th><th className="px-4 py-2.5 font-semibold">{t.bookings.status}</th>
                <th className="px-4 py-2.5 text-right font-semibold">{t.booking.outstanding}</th><th className="px-4 py-2.5 text-right font-semibold">{t.booking.depositHeld}</th></tr></thead>
              <tbody className="divide-y divide-line">{data.balances.map(({ b, bal, c }) => (
                <tr key={b.id} className="hover:bg-ivory">
                  <td className="px-4 py-2.5"><Link href={`${base}/bookings/${b.id}`} className="font-mono text-[13px] font-semibold text-petrol">{b.ref}</Link><p className="text-xs text-mist">{c?.fullName}</p></td>
                  <td className="px-4 py-2.5"><StatusBadge status={b.status} />{bal.refundStatus === "due" && <p className="mt-1 text-xs font-semibold text-warn">{t.booking.refundStatus.due}</p>}</td>
                  <td className={`px-4 py-2.5 text-right tabular-nums ${bal.outstandingSen ? "font-semibold text-warn" : "text-mist"}`}>{bal.outstandingSen ? formatRM(bal.outstandingSen, lang) : "—"}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums">{bal.depositHeldSen ? formatRM(bal.depositHeldSen, lang) : "—"}</td>
                </tr>))}</tbody>
            </table></div>
          )}
        </Card>
        <Card title={t.finance.ledger} pad={false}>
          {data.ledger.length === 0 ? <Empty>{t.finance.noPayments}</Empty> : (
            <ul className="max-h-[520px] divide-y divide-line overflow-y-auto">{data.ledger.map((p) => {
              const b = findBooking(s, p.bookingId);
              return (
                <li key={p.id} className="flex items-center justify-between gap-3 px-5 py-2.5 text-sm">
                  <div className="min-w-0"><p className="font-medium">{t.booking.kind[p.kind]} · <Link href={`${base}/bookings/${p.bookingId}`} className="font-mono text-xs text-petrol">{b?.ref}</Link></p>
                    <p className="text-xs text-mist">{t.booking.methodNames[p.method]} · {fmtIso(p.receivedAt, lang)}</p></div>
                  <p className={`shrink-0 font-semibold tabular-nums ${p.kind.includes("refund") ? "text-bad" : ""}`}>{p.kind.includes("refund") ? "−" : ""}{formatRM(p.amountSen, lang)}</p>
                </li>
              );
            })}</ul>
          )}
        </Card>
      </div>
    </>
  );
}
