import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(req: NextRequest) {
  const { nextUrl } = req;
  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET || "islamabad-property-hub-super-secret-key-2024",
  });

  const isLoggedIn = !!token;
  const role = token?.role as string | undefined;

  const path = nextUrl.pathname;

  const isLoginPage = path === "/login";
  const isAdminPage = path.startsWith("/admin");
  const isAgentPage = path.startsWith("/agent");
  const isApiAuth = path.startsWith("/api/auth");
  const isRoot = path === "/";

  // Always allow auth API routes
  if (isApiAuth) return NextResponse.next();

  // Logged in → redirect away from login
  if (isLoggedIn && isLoginPage) {
    const dest = role === "ADMIN" ? "/admin" : "/agent";
    return NextResponse.redirect(new URL(dest, req.url));
  }

  // Not logged in → send to login
  if (!isLoggedIn && (isAdminPage || isAgentPage || isRoot)) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // Wrong role redirects
  if (isAdminPage && role !== "ADMIN") {
    return NextResponse.redirect(new URL("/agent", req.url));
  }
  if (isAgentPage && role === "ADMIN") {
    return NextResponse.redirect(new URL("/admin", req.url));
  }

  // Root redirect
  if (isRoot && isLoggedIn) {
    const dest = role === "ADMIN" ? "/admin" : "/agent";
    return NextResponse.redirect(new URL(dest, req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|public).*)",
  ],
};
