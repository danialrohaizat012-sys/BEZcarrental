import { BookingsList } from "@/components/admin/bookings-list";
import { hasLocale } from "@/lib/i18n";
import { notFound } from "next/navigation";

export default async function Page({ params }: PageProps<"/[lang]/admin/bookings">) {
  const p = await params;
  if (!hasLocale(p.lang)) notFound();
  return <BookingsList  />;
}
