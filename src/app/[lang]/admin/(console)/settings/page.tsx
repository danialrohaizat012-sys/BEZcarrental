import { Settings } from "@/components/admin/settings";
import { hasLocale } from "@/lib/i18n";
import { notFound } from "next/navigation";

export default async function Page({ params }: PageProps<"/[lang]/admin/settings">) {
  const p = await params;
  if (!hasLocale(p.lang)) notFound();
  return <Settings  />;
}
