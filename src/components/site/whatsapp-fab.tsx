import { getDictionary, type Locale } from "@/lib/i18n";
import { whatsappLink } from "@/lib/whatsapp";
import { IconWhatsApp } from "../ui/icons";

export function WhatsAppFab({ lang }: { lang: Locale }) {
  const t = getDictionary(lang);
  return (
    <a data-wa-fab href={whatsappLink(t.whatsapp.message)} target="_blank" rel="noopener noreferrer"
      className="group fixed bottom-5 right-5 z-30 grid size-14 place-items-center rounded-full bg-[#1f8f4e] text-white shadow-lift transition-transform hover:scale-105 print:hidden"
      aria-label={t.whatsapp.label}>
      <IconWhatsApp />
      <span className="pointer-events-none absolute right-full mr-3 hidden whitespace-nowrap rounded-lg bg-ink px-3 py-1.5 text-sm font-medium text-ivory opacity-0 transition-opacity group-hover:opacity-100 md:block">{t.whatsapp.label}</span>
    </a>
  );
}
