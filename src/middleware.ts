import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

const protectedPrefixes = [
  "/overview",
  "/sites",
  "/incidents",
  "/reports",
  "/team",
  "/settings",
  "/onboarding",
  "/admin",
  "/docs",
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (protectedPrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))) {
    const session = getSessionCookie(request);
    if (!session) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
  }
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", pathname);
  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|mark.svg).*)"],
};
