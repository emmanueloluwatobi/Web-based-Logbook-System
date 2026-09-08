import Link from "next/link";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";

const ROLE_DASHBOARD_MAP: Record<string, string> = {
  student: "/student",
  school_supervisor: "/supervisor",
  hod: "/hod",
  admin: "/admin",
  industry_supervisor: "/industry",
};

export async function Navbar() {
  let session = null;
  try {
    session = await auth.api.getSession({
      headers: await headers(),
    });
  } catch {
    // Unauthenticated or error fetching headers
    session = null;
  }

  const userRole = session?.user?.role;
  const dashboardPath = userRole ? (ROLE_DASHBOARD_MAP[userRole] || "/student") : "/student";

  return (
    <header className="w-full bg-surface-container-lowest border-b border-outline-variant">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2">
          <span className="font-heading text-xl font-bold tracking-tight text-primary">
            ULS
          </span>
          <span className="hidden sm:inline-block text-xs font-medium px-2 py-0.5 rounded-full bg-surface-container-low text-on-surface-variant border border-outline-variant/50">
            EKSU SIWES
          </span>
        </Link>

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center gap-8">
          <Link
            href="/#features"
            className="text-sm font-medium text-on-surface-variant hover:text-primary transition-colors"
          >
            Features
          </Link>
          <Link
            href="/#features"
            className="text-sm font-medium text-on-surface-variant hover:text-primary transition-colors"
          >
            For Students
          </Link>
          <Link
            href="/#features"
            className="text-sm font-medium text-on-surface-variant hover:text-primary transition-colors"
          >
            For Supervisors
          </Link>
        </nav>

        {/* Auth Action */}
        <div className="flex items-center gap-3">
          {session ? (
            <div className="flex items-center gap-3">
              <span className="hidden sm:inline-block text-xs text-on-surface-variant font-medium">
                {session.user.name}
              </span>
              <Link
                href={dashboardPath}
                className="inline-flex items-center justify-center bg-primary text-on-primary rounded-md px-4 py-2 text-sm font-medium hover:bg-primary-container active:scale-[0.98] transition-all"
              >
                Dashboard
              </Link>
            </div>
          ) : (
            <Link
              href="/login"
              className="inline-flex items-center justify-center bg-primary text-on-primary rounded-md px-4 py-2 text-sm font-medium hover:bg-primary-container active:scale-[0.98] transition-all"
            >
              Login / Sign Up
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
