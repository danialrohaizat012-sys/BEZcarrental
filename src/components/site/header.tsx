"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { getDictionary, type Locale } from "@/lib/i18n";
import { buttonClass } from "../ui/button";
import { IconGlobe, IconMenu, IconX } from "../ui/icons";

export function Logo({ light = false }: { light?: boolean }) {
  return (
    <span className="flex items-center gap-2.5">
      <span className={`grid h-8 place-items-center rounded-md px-2 font-display text-[15px] font-extrabold tracking-[0.18em] ${light ? "bg-ivory text-ink" : "bg-ink text-ivory"}`}>BEZ</span>
      <span className={`whitespace-nowrap font-display text-[15px] font-semibold leading-none max-[380px]:hidden ${light ? "text-ivory" : "text-ink"}`}>
        Car Rental
      </span>
    </span>
  );
}

export function Header({ lang }: { lang: Locale }) {
  const t = getDictionary(lang);
  const pathname = usePathname();
  const search = useSearchParams();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const other: Locale = lang === "ms" ? "en" : "ms";
  const qs = search.toString();
  const switchHref = `/${other}${pathname.replace(/^\/(ms|en)/, "")}${qs ? `?${qs}` : ""}`;
  const links = [
    { href: `/${lang}/vehicles`, label: t.nav.vehicles },
    { href: `/${lang}#how`, label: t.nav.how },
    { href: `/${lang}#faq`, label: t.nav.faq },
  ];
  const isActive = (href: string) => !href.includes("#") && pathname.startsWith(href);

  return (
    <>
      <div className="bg-ink px-4 py-1.5 text-center text-[11px] leading-snug text-ivory/75 sm:text-xs">{t.ribbon}</div>
      <header className="sticky top-0 z-40 border-b border-line/80 bg-ivory/90 backdrop-blur supports-[backdrop-filter]:bg-ivory/75">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-6 px-4 sm:px-6">
          <Link href={`/${lang}`} aria-label="BEZ Car Rental"><Logo /></Link>
          <nav className="ml-6 hidden items-center gap-1 md:flex" aria-label="Main">
            {links.map((l) => (
              <Link key={l.href} href={l.href}
                className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${isActive(l.href) ? "text-petrol" : "text-steel hover:text-ink"}`}>
                {l.label}
              </Link>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <Link href={switchHref} hrefLang={other} className="hidden items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-steel hover:text-ink sm:flex">
              <IconGlobe className="size-4" />{t.nav.language}
            </Link>
            <Link href={`/${lang}/vehicles`} className={buttonClass("primary", "sm")}>{t.nav.book}</Link>
            <button type="button" onClick={() => setOpen(true)} className="grid size-10 place-items-center rounded-lg text-ink md:hidden" aria-label={t.nav.menu} aria-expanded={open}>
              <IconMenu />
            </button>
          </div>
        </div>
      </header>

      {open && (
        <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true" aria-label={t.nav.menu}>
          <div className="absolute inset-0 bg-ink/40 animate-[rise_.2s_ease-out]" onClick={() => setOpen(false)} />
          <div className="absolute inset-x-0 top-0 rounded-b-3xl bg-ivory px-4 pb-6 pt-3 shadow-lift animate-rise">
            <div className="flex h-12 items-center justify-between">
              <Logo />
              <button type="button" onClick={() => setOpen(false)} className="grid size-10 place-items-center rounded-lg" aria-label={t.nav.close}><IconX /></button>
            </div>
            <nav className="mt-4 flex flex-col" aria-label="Mobile">
              {[{ href: `/${lang}`, label: t.nav.home }, ...links].map((l) => (
                <Link key={l.href} href={l.href} onClick={() => setOpen(false)} className="border-b border-line py-3.5 font-display text-lg font-semibold">{l.label}</Link>
              ))}
              <Link href={switchHref} hrefLang={other} className="flex items-center gap-2 py-3.5 text-steel"><IconGlobe className="size-4" />{t.nav.language}</Link>
            </nav>
            <Link href={`/${lang}/vehicles`} onClick={() => setOpen(false)} className={buttonClass("primary", "lg", "mt-2 w-full")}>{t.nav.book}</Link>
          </div>
        </div>
      )}
    </>
  );
}
