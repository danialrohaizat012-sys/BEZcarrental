"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import { logoutAction } from "@/lib/admin/actions";
import { useAdmin } from "@/lib/admin/store";
import type { Locale } from "@/lib/i18n";
import { getAdminDictionary } from "@/lib/i18n/admin";
import { IconCalendar, IconGlobe, IconMenu, IconX } from "../ui/icons";
import { Logo } from "../site/header";
import { AdminProvider } from "./context";
import { Skeleton } from "./ui";

const I = {
  overview: <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden><rect x="3.5" y="3.5" width="7" height="7" rx="1.5" /><rect x="13.5" y="3.5" width="7" height="4" rx="1.5" /><rect x="13.5" y="10.5" width="7" height="10" rx="1.5" /><rect x="3.5" y="13.5" width="7" height="7" rx="1.5" /></svg>,
  bookings: <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden><path d="M7 3.5h10a1.5 1.5 0 0 1 1.5 1.5v15l-3-2-3 2-3-2-3 2V5A1.5 1.5 0 0 1 7 3.5z" /><path d="M9 8h6M9 12h6" /></svg>,
  calendar: <IconCalendar className="size-5" />,
  fleet: <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden><path d="M4 15.5V12l2-4.5A2 2 0 0 1 7.8 6.5h8.4a2 2 0 0 1 1.8 1L20 12v3.5a1 1 0 0 1-1 1h-1M6 16.5H5a1 1 0 0 1-1-1M4 12h16" /><circle cx="7.5" cy="16.5" r="1.8" /><circle cx="16.5" cy="16.5" r="1.8" /></svg>,
  customers: <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden><circle cx="9" cy="8" r="3.5" /><path d="M3 20c.6-3.4 3-5.5 6-5.5s5.4 2.1 6 5.5M16 4.8a3.5 3.5 0 0 1 0 6.4M18 14.8c1.6.8 2.7 2.6 3 5.2" /></svg>,
  finance: <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden><rect x="3" y="6" width="18" height="13" rx="2" /><path d="M3 10h18M7 15h3" /></svg>,
  settings: <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden><circle cx="12" cy="12" r="3" /><path d="M12 3v2.5M12 18.5V21M3 12h2.5M18.5 12H21M5.6 5.6l1.8 1.8M16.6 16.6l1.8 1.8M5.6 18.4l1.8-1.8M16.6 7.4l1.8-1.8" /></svg>,
};
type Key = keyof typeof I;

export function AdminShell({ lang, user, children }: { lang: Locale; user: string; children: ReactNode }) {
  const t = getAdminDictionary(lang);
  const pathname = usePathname();
  const state = useAdmin();
  const [more, setMore] = useState(false);
  const base = `/${lang}/admin`;
  const items: { key: Key; href: string }[] = [
    { key: "overview", href: base }, { key: "bookings", href: `${base}/bookings` }, { key: "calendar", href: `${base}/calendar` },
    { key: "fleet", href: `${base}/fleet` }, { key: "customers", href: `${base}/customers` }, { key: "finance", href: `${base}/finance` },
    { key: "settings", href: `${base}/settings` },
  ];
  const active = (href: string) => (href === base ? pathname === base : pathname.startsWith(href));
  const pending = state?.bookings.filter((b) => b.status === "pending").length ?? 0;
  const other: Locale = lang === "ms" ? "en" : "ms";
  const switchHref = pathname.replace(/^\/(ms|en)/, `/${other}`);

  const navLink = (it: { key: Key; href: string }, onClick?: () => void) => (
    <Link key={it.key} href={it.href} onClick={onClick} aria-current={active(it.href) ? "page" : undefined}
      className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${active(it.href) ? "bg-ivory/10 text-ivory" : "text-ivory/60 hover:bg-ivory/5 hover:text-ivory"}`}>
      {I[it.key]}<span className="flex-1">{t.nav[it.key]}</span>
      {it.key === "bookings" && pending > 0 && <span className="rounded-full bg-amber px-2 py-0.5 text-xs font-bold text-ink tabular-nums">{pending}</span>}
    </Link>
  );

  return (
    <AdminProvider lang={lang} user={user}>
      <div className="flex min-h-screen bg-[#f3f1ec]">
        {/* Desktop sidebar */}
        <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col bg-ink px-4 py-5 lg:flex">
          <Link href={base} className="flex items-center gap-2 px-2"><Logo light /><span className="rounded bg-amber/20 px-1.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-amber">{t.brand}</span></Link>
          <nav className="mt-8 flex flex-col gap-1" aria-label="Admin">{items.map((it) => navLink(it))}</nav>
          <div className="mt-auto space-y-1 border-t border-ivory/10 pt-4 text-sm">
            <Link href={switchHref} className="flex items-center gap-3 rounded-xl px-3 py-2 text-ivory/60 hover:text-ivory"><IconGlobe className="size-5" />{other === "en" ? "English" : "Bahasa Melayu"}</Link>
            <Link href={`/${lang}`} target="_blank" className="flex items-center gap-3 rounded-xl px-3 py-2 text-ivory/60 hover:text-ivory">↗ <span>{t.nav.site}</span></Link>
            <p className="truncate px-3 pt-2 text-xs text-ivory/40">{user}</p>
            <form action={logoutAction}><input type="hidden" name="lang" value={lang} />
              <button className="w-full rounded-xl px-3 py-2 text-left text-ivory/60 hover:text-ivory">{t.nav.logout}</button></form>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <div className="bg-amber-soft px-4 py-1.5 text-center text-xs font-medium text-amber-2">{t.demoBanner}</div>
          {/* Mobile top bar */}
          <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-line bg-ink px-4 lg:hidden">
            <Link href={base} className="flex items-center gap-2"><Logo light /></Link>
            <Link href={switchHref} className="text-sm font-medium text-ivory/70">{other.toUpperCase()}</Link>
          </header>
          <main className="mx-auto w-full max-w-7xl flex-1 px-4 pb-28 pt-6 sm:px-6 lg:pb-12 lg:pt-8">
            {state ? children : <Skeleton />}
          </main>
        </div>

        {/* Mobile bottom tabs */}
        <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-line bg-paper pb-[env(safe-area-inset-bottom)] lg:hidden" aria-label="Admin">
          {items.slice(0, 4).map((it) => (
            <Link key={it.key} href={it.href} aria-current={active(it.href) ? "page" : undefined}
              className={`relative flex flex-col items-center gap-0.5 py-2 text-[11px] font-semibold ${active(it.href) ? "text-petrol" : "text-mist"}`}>
              {I[it.key]}{t.nav[it.key]}
              {it.key === "bookings" && pending > 0 && <span className="absolute right-[22%] top-1 rounded-full bg-amber px-1.5 text-[10px] font-bold text-ink">{pending}</span>}
            </Link>
          ))}
          <button type="button" onClick={() => setMore(true)} className={`flex flex-col items-center gap-0.5 py-2 text-[11px] font-semibold ${items.slice(4).some((i) => active(i.href)) ? "text-petrol" : "text-mist"}`}>
            <IconMenu className="size-5" />{t.nav.more}
          </button>
        </nav>
        {more && (
          <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true">
            <div className="absolute inset-0 bg-ink/40" onClick={() => setMore(false)} />
            <div className="absolute inset-x-0 bottom-0 animate-rise rounded-t-3xl bg-ink p-4 pb-8">
              <div className="mb-2 flex justify-end"><button onClick={() => setMore(false)} className="grid size-9 place-items-center text-ivory/70" aria-label={t.common.close}><IconX /></button></div>
              <nav className="flex flex-col gap-1">{items.slice(4).map((it) => navLink(it, () => setMore(false)))}</nav>
              <div className="mt-3 border-t border-ivory/10 pt-3 text-sm">
                <Link href={`/${lang}`} className="block rounded-xl px-3 py-2.5 text-ivory/60">↗ {t.nav.site}</Link>
                <form action={logoutAction}><input type="hidden" name="lang" value={lang} /><button className="w-full rounded-xl px-3 py-2.5 text-left text-ivory/60">{t.nav.logout} · <span className="text-ivory/40">{user}</span></button></form>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminProvider>
  );
}
