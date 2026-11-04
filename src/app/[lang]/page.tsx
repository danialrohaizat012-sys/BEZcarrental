import { connection } from "next/server";
import { notFound } from "next/navigation";
import { SearchForm } from "@/components/search/search-form";
import { SampleTag } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { IconArrow, IconCheck, IconChat, IconPin, IconShield, IconTag } from "@/components/ui/icons";
import { CarIllustration } from "@/components/vehicle/car-illustration";
import { VehicleCard } from "@/components/vehicle/vehicle-card";
import { getBookingRules, getCategories, getVehicles } from "@/lib/data/repository";
import { getDictionary, hasLocale } from "@/lib/i18n";
import { defaultPeriod } from "@/lib/time";

const featured = ["perodua-myvi", "perodua-bezza", "honda-city", "perodua-alza", "proton-x70", "toyota-innova"];

export default async function Home({ params }: PageProps<"/[lang]">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  await connection(); // default dates depend on "today"
  const t = getDictionary(lang);
  const rules = getBookingRules();
  const period = defaultPeriod();
  const cats = getCategories().map((c) => ({ id: c.id, name: c.name[lang] }));
  const cars = featured.map((s) => getVehicles().find((v) => v.slug === s)!).filter(Boolean);
  const whyIcons = [IconTag, IconShield, IconPin, IconChat];

  return (
    <>
      {/* HERO */}
      <section className="relative overflow-hidden bg-ink text-ivory">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_70%_at_25%_100%,rgba(14,77,87,0.55),transparent_70%)]" aria-hidden />
        <div className="relative mx-auto grid max-w-7xl gap-7 px-4 pb-10 pt-8 sm:px-6 sm:pt-12 lg:grid-cols-[1.15fr_0.85fr] lg:items-center lg:gap-14 lg:pb-20 lg:pt-16">
          <div className="animate-rise">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber">{t.hero.eyebrow}</p>
            <h1 className="mt-4 max-w-xl font-display text-[2.3rem] font-extrabold leading-[1.05] tracking-tight sm:text-6xl">{t.hero.title}</h1>
            <p className="mt-4 max-w-lg text-[15px] leading-relaxed text-ivory/70 sm:mt-5 sm:text-lg">{t.hero.subtitle}</p>
            <ul className="mt-6 hidden flex-wrap gap-x-6 gap-y-2 text-sm text-ivory/80 sm:flex">
              {t.hero.points.map((p) => (
                <li key={p} className="flex items-center gap-2"><IconCheck className="size-4 text-amber" />{p}</li>
              ))}
            </ul>
            <div className="relative mt-8 hidden lg:block" aria-hidden>
              <div className="absolute inset-x-0 bottom-3 h-px bg-gradient-to-r from-transparent via-ivory/25 to-transparent" />
              <CarIllustration body="suv" color="#c9c5bc" id="hero" className="relative w-[88%]" />
            </div>
          </div>
          <div className="animate-rise [animation-delay:80ms]">
            <SearchForm lang={lang} defaults={{ ...period, category: "" }} categories={cats} openHour={rules.openHour} closeHour={rules.closeHour} />
          </div>
        </div>
      </section>

      {/* FLEET */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:py-24">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">{t.home.fleetTitle}</h2>
            <p className="mt-2 max-w-xl text-steel">{t.home.fleetSubtitle}</p>
          </div>
          <ButtonLink href={`/${lang}/vehicles`} variant="secondary">
            {t.home.seeAll}<IconArrow className="size-4" />
          </ButtonLink>
        </div>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {cars.map((v) => <VehicleCard key={v.id} vehicle={v} lang={lang} />)}
        </div>
      </section>

      {/* WHY */}
      <section className="border-y border-line bg-paper">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:py-24">
          <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">{t.home.whyTitle}</h2>
          <div className="mt-10 grid gap-x-10 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
            {t.home.why.map((w, i) => {
              const Icon = whyIcons[i];
              return (
                <div key={w.title}>
                  <span className="grid size-11 place-items-center rounded-xl bg-petrol-soft text-petrol"><Icon /></span>
                  <h3 className="mt-4 font-display text-lg font-bold">{w.title}</h3>
                  <p className="mt-2 text-[15px] leading-relaxed text-steel">{w.body}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* HOW */}
      <section id="how" className="mx-auto max-w-7xl scroll-mt-24 px-4 py-16 sm:px-6 lg:py-24">
        <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">{t.home.howTitle}</h2>
        <ol className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {t.home.how.map((s, i) => (
            <li key={s.title} className="relative rounded-2xl border border-line bg-paper p-6">
              <span className="font-display text-sm font-bold tabular-nums text-amber-2">0{i + 1}</span>
              <h3 className="mt-3 font-display text-lg font-bold">{s.title}</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-steel">{s.body}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* TESTIMONIALS */}
      <section className="bg-petrol text-ivory">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:py-20">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">{t.home.testimonialsTitle}</h2>
            <SampleTag>{t.common.sample}</SampleTag>
          </div>
          <p className="mt-2 text-sm text-ivory/60">{t.home.testimonialsNote}</p>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {t.home.testimonials.map((q) => (
              <figure key={q.name} className="flex flex-col rounded-2xl bg-ivory/[0.06] p-6 ring-1 ring-ivory/10">
                <blockquote className="flex-1 text-[15px] leading-relaxed text-ivory/90">“{q.quote}”</blockquote>
                <figcaption className="mt-5 text-sm">
                  <span className="font-semibold">{q.name}</span>
                  <span className="text-ivory/50"> · {q.context}</span>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="mx-auto max-w-3xl scroll-mt-24 px-4 py-16 sm:px-6 lg:py-24">
        <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">{t.home.faqTitle}</h2>
        <p className="mt-2 text-sm text-mist">{t.home.faqNote}</p>
        <div className="mt-8 divide-y divide-line border-y border-line">
          {t.home.faq.map((f) => (
            <details key={f.q} className="group py-1">
              <summary className="flex cursor-pointer items-center justify-between gap-4 py-4 font-display text-[17px] font-semibold">
                {f.q}
                <span className="grid size-7 shrink-0 place-items-center rounded-full border border-line text-steel transition-transform group-open:rotate-45" aria-hidden>+</span>
              </summary>
              <p className="pb-5 pr-10 leading-relaxed text-steel">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6">
        <div className="flex flex-col items-start justify-between gap-6 rounded-3xl bg-ink px-6 py-10 text-ivory sm:px-10 md:flex-row md:items-center">
          <div>
            <h2 className="font-display text-2xl font-bold sm:text-3xl">{t.home.ctaTitle}</h2>
            <p className="mt-2 text-ivory/65">{t.home.ctaBody}</p>
          </div>
          <ButtonLink href={`/${lang}/vehicles`} variant="accent" size="lg">{t.nav.book}<IconArrow className="size-4" /></ButtonLink>
        </div>
      </section>
    </>
  );
}
