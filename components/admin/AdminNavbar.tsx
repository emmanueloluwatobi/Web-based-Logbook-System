"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  GraduationCap,
  LogOut,
  Menu,
  X,
  Building2,
  BookOpen,
  Calendar,
  Users,
  LayoutDashboard,
} from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";

interface AdminNavbarProps {
  userName?: string;
  userEmail?: string;
}

const NAV_ITEMS = [
  { label: "Overview", href: "/admin", icon: LayoutDashboard },
  { label: "Departments", href: "/admin/departments", icon: Building2 },
  { label: "Programs", href: "/admin/programs", icon: BookOpen },
  { label: "Sessions", href: "/admin/sessions", icon: Calendar },
  { label: "Users", href: "/admin/users", icon: Users },
];

export function AdminNavbar({ userName = "Administrator", userEmail }: AdminNavbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await authClient.signOut();
      toast.success("Signed out successfully");
      router.push("/login");
      router.refresh();
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("Failed to sign out");
      setIsLoggingOut(false);
    }
  };

  const isActiveRoute = (href: string) => {
    if (href === "/admin") {
      return pathname === "/admin";
    }
    return pathname.startsWith(href);
  };

  return (
    <header className="w-full bg-surface-container-lowest border-b border-outline-variant">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 h-16 flex items-center justify-between">
        {/* Left: Brand + Admin Tag */}
        <div className="flex items-center gap-6">
          <Link href="/admin" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-primary text-on-primary flex items-center justify-center shadow-xs">
              <GraduationCap className="size-5" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="font-heading text-lg font-bold tracking-tight text-primary">
                  ULS
                </span>
                <span className="px-2 py-0.5 rounded-full bg-primary-fixed text-on-primary-fixed text-[11px] font-semibold font-heading uppercase tracking-wide">
                  Admin
                </span>
              </div>
              <span className="text-[10px] font-sans text-on-surface-variant hidden sm:inline-block">
                Ekiti State University SIWES
              </span>
            </div>
          </Link>

          {/* Desktop Nav Items */}
          <nav className="hidden md:flex items-center gap-1 h-16">
            {NAV_ITEMS.map((item) => {
              const active = isActiveRoute(item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`h-16 px-3.5 flex items-center gap-2 text-sm font-medium transition-colors relative ${
                    active
                      ? "text-primary font-semibold"
                      : "text-on-surface-variant hover:text-on-surface"
                  }`}
                >
                  <Icon className={`size-4 ${active ? "text-primary" : "text-on-surface-variant"}`} />
                  <span>{item.label}</span>
                  {active && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t" />
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right: User Profile + Logout */}
        <div className="hidden md:flex items-center gap-4">
          <div className="text-right">
            <p className="text-xs font-semibold text-on-surface leading-tight font-heading">
              {userName}
            </p>
            {userEmail && (
              <p className="text-[11px] text-on-surface-variant leading-tight truncate max-w-[160px]">
                {userEmail}
              </p>
            )}
          </div>

          <div className="h-6 w-px bg-outline-variant" />

          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-on-surface-variant hover:text-error px-2.5 py-1.5 rounded-md hover:bg-error-container/30 transition-colors disabled:opacity-50"
            title="Sign out of Admin Portal"
          >
            <LogOut className="size-3.5" />
            <span>Sign Out</span>
          </button>
        </div>

        {/* Mobile Hamburger Toggle */}
        <div className="flex md:hidden items-center gap-2">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-md text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low transition-colors"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Nav Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-outline-variant bg-surface-container-lowest px-4 py-3 space-y-1">
          {NAV_ITEMS.map((item) => {
            const active = isActiveRoute(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                  active
                    ? "bg-primary-fixed text-on-primary-fixed font-semibold"
                    : "text-on-surface-variant hover:bg-surface-container-low text-on-surface"
                }`}
              >
                <Icon className="size-4" />
                <span>{item.label}</span>
              </Link>
            );
          })}

          <div className="pt-3 mt-2 border-t border-outline-variant flex items-center justify-between px-3">
            <div>
              <p className="text-xs font-semibold text-on-surface">{userName}</p>
              {userEmail && <p className="text-[11px] text-on-surface-variant">{userEmail}</p>}
            </div>
            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="inline-flex items-center gap-1 text-xs font-medium text-error px-2.5 py-1 rounded bg-error-container/20 hover:bg-error-container/40 transition-colors"
            >
              <LogOut className="size-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
