import { Finance } from "@/components/admin/finance";
import { hasLocale } from "@/lib/i18n";
import { notFound } from "next/navigation";

export default async function Page({ params }: PageProps<"/[lang]/admin/finance">) {
  const p = await params;
  if (!hasLocale(p.lang)) notFound();
  return <Finance  />;
}
