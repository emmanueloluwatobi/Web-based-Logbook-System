import Link from "next/link";

export function Footer() {
  return (
    <footer className="w-full bg-surface-container-lowest border-t border-outline-variant py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Left branding and copyright */}
        <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 text-center sm:text-left">
          <span className="font-heading text-lg font-bold tracking-tight text-primary">
            ULS
          </span>
          <span className="text-xs text-on-surface-variant">
            © 2026 Ekiti State University SIWES System
          </span>
        </div>

        {/* Right-aligned utility links */}
        <div className="flex items-center gap-6 text-sm text-on-surface-variant">
          <Link
            href="#"
            className="hover:text-on-surface transition-colors"
          >
            Privacy
          </Link>
          <Link
            href="#"
            className="hover:text-on-surface transition-colors"
          >
            Terms
          </Link>
          <Link
            href="#"
            className="hover:text-on-surface transition-colors"
          >
            Support
          </Link>
        </div>
      </div>
    </footer>
  );
}
