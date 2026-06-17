import { type NextRequest, NextResponse } from 'next/server';
import { defaultLocale, getLocaleFromPathname, localizePathname, stripLocalePrefix } from '@/i18n/config';
import { handleI18nRouting } from '@/i18n/middleware';
import { buildLoginPath } from '@/lib/authRedirect';
import { createClient } from '@/utils/supabase/middleware';

const PROTECTED_PREFIXES = [
  '/translate',
  '/practice',
  '/history',
  '/reference',
  '/profile',
];

// ─── Auth-only routes ─────────────────────────────────────────────────────────
// Authenticated users visiting these are redirected away (e.g. back to app).
const AUTH_PREFIXES = ['/auth/signup'];

function matchesPrefix(pathname: string, prefixes: string[]) {
  return prefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

function isSameRequestUrl(
  request: NextRequest,
  location: string,
  rewriteHeader: string | null,
  originalUrl: { pathname: string; search: string },
) {
  const targetUrl = new URL(location, request.url);
  if (targetUrl.pathname === originalUrl.pathname && targetUrl.search === originalUrl.search) {
    return true;
  }

  if (rewriteHeader) {
    const rewriteUrl = new URL(rewriteHeader, request.url);
    const { pathname } = stripLocalePrefix(rewriteUrl.pathname);
    return targetUrl.pathname === pathname && targetUrl.search === rewriteUrl.search;
  }

  if (request.headers.get('x-next-intl-locale') === defaultLocale) {
    const { pathname } = stripLocalePrefix(request.nextUrl.pathname);
    return targetUrl.pathname === pathname && targetUrl.search === request.nextUrl.search;
  }

  return (
    targetUrl.pathname === request.nextUrl.pathname &&
    targetUrl.search === request.nextUrl.search
  );
}

function normalizeI18nResponse(
  request: NextRequest,
  response: NextResponse,
  originalUrl: { pathname: string; search: string },
) {
  const location = response.headers.get('location');
  const rewriteHeader = response.headers.get('x-middleware-rewrite');

  const isSameUrl = location
    ? isSameRequestUrl(request, location, rewriteHeader, originalUrl)
    : false;
  if (!location || !isSameUrl) {
    return { response, isRedirect: Boolean(location) };
  }

  if (!rewriteHeader) {
    return { response: NextResponse.next({ request }), isRedirect: false };
  }

  const rewriteUrl = new URL(rewriteHeader, request.url);
  rewriteUrl.protocol = request.nextUrl.protocol;
  rewriteUrl.host = request.nextUrl.host;

  const rewriteResponse = NextResponse.rewrite(rewriteUrl, { request });
  response.headers.forEach((value, key) => {
    const lowerKey = key.toLowerCase();
    if (lowerKey !== 'location' && lowerKey !== 'x-middleware-rewrite') {
      rewriteResponse.headers.set(key, value);
    }
  });

  return { response: rewriteResponse, isRedirect: false };
}

export async function proxy(request: NextRequest) {
  const originalUrl = {
    pathname: request.nextUrl.pathname,
    search: request.nextUrl.search,
  };
  const { response: i18nResponse, isRedirect } = normalizeI18nResponse(
    request,
    handleI18nRouting(request),
    originalUrl,
  );

  // Let canonical locale redirects (e.g. /id/research -> /research) happen
  // before running auth checks against the old pathname.
  if (isRedirect) {
    return i18nResponse;
  }

  const { supabase, supabaseResponse } = createClient(request, i18nResponse);

  // IMPORTANT: always call getUser() — never getSession() — in middleware.
  // getUser() re-validates the token with the Supabase Auth server on every
  // request, preventing stale/forged session cookies from passing the guard.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname, search } = request.nextUrl;
  const locale = getLocaleFromPathname(pathname);
  const { pathname: unprefixedPathname } = stripLocalePrefix(pathname);

  if (!user && matchesPrefix(unprefixedPathname, PROTECTED_PREFIXES)) {
    const publicNextPath = `${localizePathname(pathname, locale)}${search}`;
    return NextResponse.redirect(
      new URL(buildLoginPath(publicNextPath, locale), request.url),
    );
  }

  // Redirect authenticated users away from login / signup pages.
  const isAuthPage = matchesPrefix(unprefixedPathname, AUTH_PREFIXES);
  if (user && isAuthPage) {
    return NextResponse.redirect(new URL(localizePathname('/translate', locale), request.url));
  }

  // Always return supabaseResponse so refreshed Supabase cookies are forwarded.
  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths EXCEPT:
     *   - _next/static  (Next.js static files)
     *   - _next/image   (Next.js image optimisation)
     *   - auth/callback (Supabase OAuth callback)
     *   - any static asset with a file extension
     */
    '/((?!auth/callback|_next/static|_next/image|_vercel|.*\\..*).*)',
  ],
};
