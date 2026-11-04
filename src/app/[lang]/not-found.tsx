import Link from "next/link";
import { buttonClass } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center px-4 py-24 text-center">
      <p className="font-display text-6xl font-extrabold text-petrol/20">404</p>
      <h1 className="mt-4 font-display text-2xl font-bold">Halaman tidak dijumpai · Page not found</h1>
      <Link href="/" className={buttonClass("primary", "md", "mt-8")}>BEZ Car Rental</Link>
    </div>
  );
}
