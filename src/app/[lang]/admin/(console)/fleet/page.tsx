import { FleetList } from "@/components/admin/fleet";
import { hasLocale } from "@/lib/i18n";
import { notFound } from "next/navigation";

export default async function Page({ params }: PageProps<"/[lang]/admin/fleet">) {
  const p = await params;
  if (!hasLocale(p.lang)) notFound();
  return <FleetList  />;
}
