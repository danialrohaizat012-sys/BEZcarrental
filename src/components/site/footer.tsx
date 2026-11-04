import Link from "next/link";
import { business } from "@/lib/data/catalog";
import { getDictionary, type Locale } from "@/lib/i18n";
import { whatsappLink } from "@/lib/whatsapp";
import { Logo } from "./header";

export function Footer({ lang }: { lang: Locale }) {
  const t = getDictionary(lang);
  return (
    <footer className="mt-auto bg-ink text-ivory/80">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <Logo light />
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-ivory/60">{t.footer.tagline}</p>
        </div>
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-ivory/50">{t.footer.explore}</h2>
          <ul className="mt-4 space-y-2.5 text-sm">
            <li><Link className="hover:text-ivory" href={`/${lang}/vehicles`}>{t.nav.vehicles}</Link></li>
            <li><Link className="hover:text-ivory" href={`/${lang}#how`}>{t.nav.how}</Link></li>
            <li><Link className="hover:text-ivory" href={`/${lang}#faq`}>{t.nav.faq}</Link></li>
          </ul>
        </div>
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-ivory/50">{t.footer.contact}</h2>
          <ul className="mt-4 space-y-2.5 text-sm">
            <li><span className="text-ivory/50">{t.footer.address}: </span>{business.area}</li>
            <li><span className="text-ivory/50">{t.footer.hours}: </span>{business.hours[lang]}</li>
            <li><a className="hover:text-ivory" href={whatsappLink(t.whatsapp.message)} target="_blank" rel="noopener noreferrer">{t.whatsapp.label}</a></li>
          </ul>
        </div>
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-ivory/50">{t.footer.legal}</h2>
          <ul className="mt-4 space-y-2.5 text-sm">
            <li><Link className="hover:text-ivory" href={`/${lang}/terms`}>{t.footer.terms}</Link></li>
            <li><Link className="hover:text-ivory" href={`/${lang}/privacy`}>{t.footer.privacy}</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-ivory/10">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-6 text-xs leading-relaxed text-ivory/45 sm:px-6 md:flex-row md:justify-between">
          <p className="max-w-3xl">{t.footer.disclaimer}</p>
          <p className="shrink-0">{t.footer.rights}</p>
        </div>
      </div>
    </footer>
  );
}
