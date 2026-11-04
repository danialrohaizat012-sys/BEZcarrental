import { Overview } from "@/components/admin/overview";
import { hasLocale } from "@/lib/i18n";
import { notFound } from "next/navigation";

export default async function Page({ params }: PageProps<"/[lang]/admin">) {
  const p = await params;
  if (!hasLocale(p.lang)) notFound();
  return <Overview  />;
}
