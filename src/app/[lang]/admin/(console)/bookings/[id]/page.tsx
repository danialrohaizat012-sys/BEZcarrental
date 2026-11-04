import { BookingDetail } from "@/components/admin/booking-detail";
import { hasLocale } from "@/lib/i18n";
import { notFound } from "next/navigation";

export default async function Page({ params }: PageProps<"/[lang]/admin/bookings/[id]">) {
  const p = await params;
  if (!hasLocale(p.lang)) notFound();
  return <BookingDetail id={decodeURIComponent(p.id)} />;
}
