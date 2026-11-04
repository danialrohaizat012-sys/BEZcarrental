import { CustomerDetail } from "@/components/admin/customers";
import { hasLocale } from "@/lib/i18n";
import { notFound } from "next/navigation";

export default async function Page({ params }: PageProps<"/[lang]/admin/customers/[id]">) {
  const p = await params;
  if (!hasLocale(p.lang)) notFound();
  return <CustomerDetail id={decodeURIComponent(p.id)} />;
}
