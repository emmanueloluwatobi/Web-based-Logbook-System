import Link from "next/link";

export function Navbar() {
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
            href="#features"
            className="text-sm font-medium text-on-surface-variant hover:text-primary transition-colors"
          >
            Features
          </Link>
          <Link
            href="#features"
            className="text-sm font-medium text-on-surface-variant hover:text-primary transition-colors"
          >
            For Students
          </Link>
          <Link
            href="#features"
            className="text-sm font-medium text-on-surface-variant hover:text-primary transition-colors"
          >
            For Supervisors
          </Link>
        </nav>

        {/* Auth CTA Button */}
        <div className="flex items-center">
          {/* Feature 03: Auth session check will go here — redirect authenticated users to their role dashboard root, unauthenticated to /login */}
          <Link
            href="/login"
            className="inline-flex items-center justify-center bg-primary text-on-primary rounded-md px-4 py-2 text-sm font-medium hover:bg-primary-container active:scale-[0.98] transition-all"
          >
            Login / Sign Up
          </Link>
        </div>
      </div>
    </header>
  );
}
