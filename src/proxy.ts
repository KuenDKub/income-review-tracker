import createIntlMiddleware from "next-intl/middleware";
import { NextRequest, NextResponse } from "next/server";
import { routing } from "./i18n/routing";
import { SESSION_COOKIE, isValidSession } from "./lib/auth/session";

const intlMiddleware = createIntlMiddleware(routing);

// Public shareable portfolio: `/portfolio`, `/en/portfolio`, `/th/portfolio`
// (NOT `/portfolio-edit`, which stays behind auth). Boundaries via `$`.
const PUBLIC_PAGE_RE = new RegExp(
  `^/(?:(?:${routing.locales.join("|")})/)?portfolio$`,
);
// Public media-kit download for the shared portfolio (read-only public data).
const PUBLIC_API = "/api/portfolio/media-kit";

/**
 * Order of concerns:
 *  1. /api/auth/*  -> always allowed (login/logout must work while logged out).
 *  2. Public portfolio (page + media-kit) -> always allowed (no session).
 *  3. /login       -> bypasses i18n + chrome; rendered without a locale prefix.
 *  4. /api/*        -> require a valid session, else 401 (no redirect for fetches).
 *  5. everything else -> require a session, then hand off to next-intl routing.
 */
export default async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith("/api/auth/")) {
    return NextResponse.next();
  }

  // Cron jobs authenticate with a Bearer CRON_SECRET inside the route, not a
  // session cookie — let them past the session gate here.
  if (pathname.startsWith("/api/cron/")) {
    return NextResponse.next();
  }

  // Public portfolio is reachable without a session.
  if (pathname === PUBLIC_API) {
    return NextResponse.next();
  }
  if (PUBLIC_PAGE_RE.test(pathname)) {
    return intlMiddleware(req);
  }

  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const authed = await isValidSession(token);

  if (pathname === "/login") {
    if (authed) {
      const url = req.nextUrl.clone();
      url.pathname = "/";
      url.search = "";
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/")) {
    if (authed) return NextResponse.next();
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!authed) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return intlMiddleware(req);
}

export const config = {
  // Include /api (to protect it) but skip Next internals and static assets.
  matcher: ["/((?!_next|_vercel|.*\\..*).*)"],
};
