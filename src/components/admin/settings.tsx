"use client";

import { useState } from "react";
import { updateRules } from "@/lib/admin/domain";
import { resetDemo, useAdmin } from "@/lib/admin/store";
import { Button } from "../ui/button";
import { Field, inputClass } from "../ui/field";
import { useAdminCtx } from "./context";
import { fmtIso } from "./format";
import { Card, PageHeader } from "./ui";

type RuleKey = "minRentalHours" | "maxRentalDays" | "minLeadHours" | "openHour" | "closeHour" | "graceMinutes" | "turnaroundMinutes";

export function Settings() {
  const s = useAdmin()!;
  const { t, lang, act, toast, user } = useAdminCtx();
  const [rules, setRules] = useState(s.rules);
  const keys: RuleKey[] = ["minRentalHours", "maxRentalDays", "minLeadHours", "openHour", "closeHour", "graceMinutes", "turnaroundMinutes"];
  return (
    <>
      <PageHeader title={t.settings.title} />
      <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        <Card title={t.settings.rules}>
          <p className="mb-4 text-sm text-steel">{t.settings.rulesNote}</p>
          <div className="grid gap-3 sm:grid-cols-2">
            {keys.map((k) => (
              <Field key={k} label={t.settings[k]} htmlFor={`r-${k}`}>
                <input id={`r-${k}`} type="number" inputMode="numeric" value={rules[k]} onChange={(e) => setRules({ ...rules, [k]: Number(e.target.value) })} className={`${inputClass} tabular-nums`} />
              </Field>
            ))}
            <Field label={t.settings.taxRate} htmlFor="r-tax">
              <input id="r-tax" type="number" step="0.5" value={Math.round(rules.taxRate * 1000) / 10} onChange={(e) => setRules({ ...rules, taxRate: Number(e.target.value) / 100 })} className={`${inputClass} tabular-nums`} />
            </Field>
          </div>
          <div className="mt-5 flex justify-end"><Button disabled={JSON.stringify(rules) === JSON.stringify(s.rules)} onClick={() => act((x) => updateRules(x, rules), t.common.saved)}>{t.common.save}</Button></div>
        </Card>
        <div className="space-y-5">
          <Card title={t.settings.demo}>
            <p className="text-sm text-steel">{t.settings.demoNote}</p>
            <p className="mt-3 text-xs text-mist">{t.settings.seeded}: {fmtIso(s.seededAt, lang)}</p>
            <Button className="mt-4 bg-bad! text-white! hover:brightness-110" onClick={() => { if (window.confirm(t.settings.resetConfirm)) { resetDemo(); setRules(s.rules); toast(t.settings.resetDone); } }}>{t.settings.reset}</Button>
          </Card>
          <Card title={t.settings.account}><p className="font-mono text-sm">{user}</p></Card>
        </div>
      </div>
    </>
  );
}
