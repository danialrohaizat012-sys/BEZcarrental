import { VehicleDetail } from "@/components/admin/vehicle-detail";
import { hasLocale } from "@/lib/i18n";
import { notFound } from "next/navigation";

export default async function Page({ params }: PageProps<"/[lang]/admin/fleet/[id]">) {
  const p = await params;
  if (!hasLocale(p.lang)) notFound();
  return <VehicleDetail id={decodeURIComponent(p.id)} />;
}
