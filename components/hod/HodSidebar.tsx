"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  GraduationCap,
  LayoutDashboard,
  Users,
  UserCheck,
  LogOut,
  Menu,
  X,
  ChevronRight,
} from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";

interface HodSidebarProps {
  hod?: {
    name?: string;
    email?: string;
    departmentName?: string;
  };
}

const NAV_ITEMS = [
  { label: "Overview", href: "/hod", icon: LayoutDashboard },
  { label: "Students", href: "/hod/students", icon: Users },
  { label: "Supervisors", href: "/hod/supervisors", icon: UserCheck },
];

export function HodSidebar({
  hod = {
    name: "Dr. A. O. Adewale",
    email: "a.adewale@eksu.edu.ng",
    departmentName: "Computer Science",
  },
}: HodSidebarProps) {
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

  const isActive = (item: (typeof NAV_ITEMS)[0]) => {
    if (item.href === "/hod") {
      return pathname === "/hod";
    }
    return pathname.startsWith(item.href);
  };

  return (
    <>
      {/* Mobile Top Header */}
      <header className="md:hidden w-full bg-primary text-on-primary px-4 h-16 flex items-center justify-between border-b border-white/15 sticky top-0 z-40">
        <Link href="/hod" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-surface-container-lowest/15 flex items-center justify-center text-on-primary">
            <GraduationCap className="size-4" />
          </div>
          <div>
            <span className="font-heading text-lg font-bold tracking-tight text-on-primary">
              ULS Portal
            </span>
            <span className="block text-[10px] text-on-primary-container leading-none">
              {hod.departmentName || "Department"} HOD
            </span>
          </div>
        </Link>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 text-on-primary hover:bg-white/10 rounded-lg transition-colors"
          aria-label="Toggle navigation"
        >
          {mobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </header>

      {/* Mobile Backdrop & Drawer */}
      {mobileMenuOpen && (
        <div
          className="md:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex"
          onClick={() => setMobileMenuOpen(false)}
        >
          <aside
            className="w-72 bg-primary text-on-primary h-full flex flex-col justify-between p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              {/* Brand */}
              <div className="flex items-center justify-between pb-6 border-b border-white/15">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-surface-container-lowest/15 flex items-center justify-center text-on-primary">
                    <GraduationCap className="size-5" />
                  </div>
                  <div>
                    <span className="font-heading text-xl font-bold tracking-tight text-on-primary">
                      ULS Portal
                    </span>
                    <span className="block text-xs text-on-primary-container">
                      {hod.departmentName || "Department"} HOD
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1 text-on-primary-container hover:text-on-primary"
                >
                  <X className="size-5" />
                </button>
              </div>

              {/* Navigation */}
              <nav className="mt-6 space-y-1.5">
                {NAV_ITEMS.map((item) => {
                  const active = isActive(item);
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.label}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                        active
                          ? "bg-surface-container-lowest text-primary font-semibold shadow-xs"
                          : "text-on-primary-container hover:bg-white/10 hover:text-on-primary"
                      }`}
                    >
                      <Icon className="size-4" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>

            {/* User card + Logout */}
            <div className="pt-4 border-t border-white/15 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-surface-container-lowest/20 flex items-center justify-center text-xs font-semibold text-on-primary uppercase">
                  {hod.name?.charAt(0) || "H"}
                </div>
                <div className="text-xs truncate max-w-[140px]">
                  <p className="font-semibold text-on-primary truncate">{hod.name}</p>
                  <p className="text-[11px] text-on-primary-container truncate">
                    Department Head
                  </p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="p-1.5 text-on-primary-container hover:text-error hover:bg-white/10 rounded-lg transition-colors"
                title="Sign out"
              >
                <LogOut className="size-4" />
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 lg:w-70 bg-primary text-on-primary h-screen sticky top-0 flex-col justify-between p-4 border-r border-white/10 shrink-0 z-30 overflow-y-auto">
        <div>
          {/* Brand Wordmark */}
          <Link href="/hod" className="flex items-center gap-3 group pb-4 border-b border-white/15">
            <div className="w-10 h-10 rounded-xl bg-surface-container-lowest/15 flex items-center justify-center text-on-primary shadow-xs group-hover:bg-surface-container-lowest/25 transition-colors">
              <GraduationCap className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-heading text-xl font-bold tracking-tight text-on-primary">
                  ULS Portal
                </span>
                <span className="px-1.5 py-0.2 rounded-sm bg-surface-container-lowest/20 text-[10px] font-heading font-semibold uppercase tracking-wider text-on-primary">
                  HOD
                </span>
              </div>
              <span className="block text-[11px] font-sans text-on-primary-container font-medium tracking-wide">
                {hod.departmentName || "Department"} Department
              </span>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="mt-6 space-y-1.5">
            {NAV_ITEMS.map((item) => {
              const active = isActive(item);
              const Icon = item.icon;
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all group ${
                    active
                      ? "bg-surface-container-lowest text-primary font-semibold shadow-xs"
                      : "text-on-primary-container hover:bg-white/10 hover:text-on-primary"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      className={`size-4 ${
                        active ? "text-primary" : "text-on-primary-container group-hover:text-on-primary"
                      }`}
                    />
                    <span>{item.label}</span>
                  </div>
                  {active && <ChevronRight className="size-4 text-primary" />}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom HOD Profile & Logout */}
        <div className="pt-4 border-t border-white/15">
          <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-full bg-surface-container-lowest/20 flex items-center justify-center text-xs font-semibold text-on-primary uppercase shrink-0">
                {hod.name?.charAt(0) || "H"}
              </div>
              <div className="text-xs truncate">
                <p className="font-semibold text-on-primary truncate font-heading leading-tight">
                  {hod.name}
                </p>
                <p className="text-[11px] text-on-primary-container truncate mt-0.5">
                  Department Head
                </p>
              </div>
            </div>

            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="p-1.5 text-on-primary-container hover:text-error hover:bg-white/10 rounded-lg transition-colors shrink-0"
              title="Sign out"
            >
              <LogOut className="size-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
