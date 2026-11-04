import { NextResponse, type NextRequest } from "next/server";
import { defaultLocale, locales } from "./lib/i18n/config";

/**
 * 1. Redirect un-prefixed paths to the default locale (Bahasa Melayu).
 * 2. Optimistic admin gate: no session cookie → login page. The console layout verifies the signature.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const locale = locales.find((l) => pathname === `/${l}` || pathname.startsWith(`/${l}/`));
  if (!locale) {
    request.nextUrl.pathname = `/${defaultLocale}${pathname === "/" ? "" : pathname}`;
    return NextResponse.redirect(request.nextUrl);
  }
  const isAdmin = pathname === `/${locale}/admin` || pathname.startsWith(`/${locale}/admin/`);
  if (isAdmin && !pathname.startsWith(`/${locale}/admin/login`) && !request.cookies.has("bez_admin")) {
    request.nextUrl.pathname = `/${locale}/admin/login`;
    return NextResponse.redirect(request.nextUrl);
  }
  if (isAdmin) {
    const res = NextResponse.next();
    res.headers.set("X-Robots-Tag", "noindex, nofollow");
    res.headers.set("Cache-Control", "no-store");
    return res;
  }
}

export const config = {
  matcher: ["/((?!_next|api|favicon.ico|.*\\.[\\w]+$).*)"],
};
