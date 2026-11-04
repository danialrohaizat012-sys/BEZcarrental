import { NextResponse, type NextRequest } from "next/server";
import { defaultLocale, locales } from "./lib/i18n/config";

/** Redirect un-prefixed paths to the default locale (Bahasa Melayu). Users switch language from the header. */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (locales.some((l) => pathname === `/${l}` || pathname.startsWith(`/${l}/`))) return;
  request.nextUrl.pathname = `/${defaultLocale}${pathname === "/" ? "" : pathname}`;
  return NextResponse.redirect(request.nextUrl);
}

export const config = {
  matcher: ["/((?!_next|api|favicon.ico|.*\\.[\\w]+$).*)"],
};
