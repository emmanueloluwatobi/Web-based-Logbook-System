import { NextRequest, NextResponse } from "next/server";

const ROLE_DASHBOARD_MAP: Record<string, string> = {
  student: "/student",
  school_supervisor: "/supervisor",
  hod: "/hod",
  admin: "/admin",
  industry_supervisor: "/industry",
};

const PROTECTED_PREFIXES = ["/student", "/supervisor", "/hod", "/admin", "/industry"];
const AUTH_ROUTES = ["/login", "/register", "/login/industry"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtectedRoute = PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix));
  const isAuthRoute = AUTH_ROUTES.includes(pathname);

  // Explicitly whitelist /set-password so invitees can always access it
  if (pathname === "/set-password") {
    return NextResponse.next();
  }

  // If neither a protected route nor an auth route, let it pass through
  if (!isProtectedRoute && !isAuthRoute) {
    return NextResponse.next();
  }

  // Check session via Better Auth get-session endpoint
  let sessionData: { user: { role: string }; session: Record<string, unknown> } | null = null;
  try {
    const sessionRes = await fetch(`${request.nextUrl.origin}/api/auth/get-session`, {
      headers: {
        cookie: request.headers.get("cookie") || "",
      },
    });

    if (sessionRes.ok) {
      sessionData = await sessionRes.json();
    }
  } catch (error) {
    console.error("[middleware] Error fetching session:", error);
  }

  const isAuthenticated = !!sessionData?.user;
  const userRole = sessionData?.user?.role;
  const userDashboard = userRole ? (ROLE_DASHBOARD_MAP[userRole] || "/student") : "/student";

  // Case 1: Unauthenticated user trying to access a protected route
  if (isProtectedRoute && !isAuthenticated) {
    if (pathname.startsWith("/industry")) {
      return NextResponse.redirect(new URL("/login/industry", request.url));
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Case 2: Authenticated user visiting auth routes (/login, /register, /login/industry)
  if (isAuthRoute && isAuthenticated) {
    return NextResponse.redirect(new URL(userDashboard, request.url));
  }

  // Case 3: Authenticated user accessing a protected route of a DIFFERENT role
  if (isProtectedRoute && isAuthenticated && userRole) {
    const allowedPrefix = ROLE_DASHBOARD_MAP[userRole];
    if (allowedPrefix && !pathname.startsWith(allowedPrefix)) {
      return NextResponse.redirect(new URL(allowedPrefix, request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/student/:path*",
    "/supervisor/:path*",
    "/hod/:path*",
    "/admin/:path*",
    "/industry/:path*",
    "/login",
    "/register",
    "/login/industry",
  ],
};
