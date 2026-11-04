"use client";

import { useActionState } from "react";
import { loginAction, type LoginState } from "@/lib/admin/actions";
import type { Locale } from "@/lib/i18n";
import { getAdminDictionary } from "@/lib/i18n/admin";
import { Button } from "../ui/button";
import { Field, inputClass } from "../ui/field";
import { IconAlert } from "../ui/icons";

export function LoginForm({ lang, demo }: { lang: Locale; demo: { email: string; password: string } }) {
  const t = getAdminDictionary(lang).login;
  const [state, action, pending] = useActionState<LoginState, FormData>(loginAction, { error: null });
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="lang" value={lang} />
      <Field label={t.email} htmlFor="email">
        <input id="email" name="email" type="email" autoComplete="username" required className={inputClass} defaultValue={demo.email} />
      </Field>
      <Field label={t.password} htmlFor="password">
        <input id="password" name="password" type="password" autoComplete="current-password" required className={inputClass} />
      </Field>
      {state.error && <p role="alert" className="flex items-center gap-2 text-sm font-medium text-bad"><IconAlert className="size-4" />{t.invalid}</p>}
      <Button type="submit" size="lg" className="w-full" disabled={pending}>{pending ? t.submitting : t.submit}</Button>
      <div className="rounded-xl border border-dashed border-amber/50 bg-amber-soft/50 px-4 py-3 text-sm text-amber-2">
        <p className="font-semibold">{t.demo}</p>
        <p className="mt-1 font-mono text-[13px]">{demo.email} · {demo.password}</p>
      </div>
    </form>
  );
}
