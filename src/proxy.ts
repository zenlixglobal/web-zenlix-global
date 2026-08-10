import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Next.js 16 renamed Middleware to Proxy — same behaviour, new file convention.
 *
 * Two jobs:
 *   1. Keep the Supabase auth cookie refreshed on every request.
 *   2. Optimistically bounce signed-out visitors away from /admin.
 *
 * This is a redirect convenience, NOT the security boundary. Whether someone
 * is actually an admin is decided by `requireAdmin()` in the admin layout and
 * enforced in the database by RLS.
 */
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Without Supabase configured there is no session to refresh; let the admin
  // pages render their own "not configured" message rather than looping here.
  if (!supabaseUrl || !supabaseAnonKey) return response;

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
        // Stops a CDN caching one admin's refreshed session for everyone.
        for (const [key, value] of Object.entries(headers)) {
          response.headers.set(key, value);
        }
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname, search } = request.nextUrl;
  const isLoginRoute = pathname === "/admin/login";
  const isAdminRoute = pathname.startsWith("/admin");

  if (isAdminRoute && !isLoginRoute && !user) {
    const loginUrl = new URL("/admin/login", request.url);
    loginUrl.searchParams.set("next", `${pathname}${search}`);
    return NextResponse.redirect(loginUrl);
  }

  // `?denied=1` means requireAdmin() just turned this session away: they are
  // signed in to Supabase but are not on the team. Bouncing them back to
  // /admin would restart that exact redirect, so let the login page render and
  // explain instead.
  const wasDenied = request.nextUrl.searchParams.has("denied");

  if (isLoginRoute && user && !wasDenied) {
    return NextResponse.redirect(new URL("/admin", request.url));
  }

  return response;
}

export const config = {
  // `/api/admin/*` is included so the admin JSON endpoints get the same session
  // refresh as the pages that poll them — a dashboard left open for an hour
  // must not start 401-ing. The public analytics beacon is deliberately absent:
  // it needs no session, and validating one on every heartbeat would be a
  // Supabase round trip per visitor per 15 seconds.
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
