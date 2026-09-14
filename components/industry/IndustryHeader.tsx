"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Building2, LogOut, ShieldCheck, User } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";

interface IndustryHeaderProps {
  supervisorName: string;
  supervisorEmail: string;
}

export function IndustryHeader({ supervisorName, supervisorEmail }: IndustryHeaderProps) {
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      await authClient.signOut();
      toast.success("Signed out of Industry Portal.");
      router.push("/login/industry");
    } catch (err) {
      console.error("[IndustryHeader] Sign out error:", err);
      router.push("/login/industry");
    }
  };

  return (
    <header className="bg-surface-container-lowest border-b border-outline-variant/60 sticky top-0 z-30 shadow-xs">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo & Portal Identity */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-heading font-bold text-lg border border-primary/20">
            <Building2 className="size-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-heading font-bold text-base tracking-tight text-on-surface">
                ULS Portal
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container font-heading">
                Industry Partner
              </span>
            </div>
            <p className="font-sans text-xs text-on-surface-variant">
              EKSU SIWES · Workplace Mentor Portal
            </p>
          </div>
        </div>

        {/* User Info & Actions */}
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2.5 text-right">
            <div className="w-8 h-8 rounded-full bg-surface-container-high text-on-surface-variant flex items-center justify-center font-heading font-semibold text-xs border border-outline-variant/60">
              <User className="size-4" />
            </div>
            <div>
              <p className="font-heading text-xs font-semibold text-on-surface leading-tight">
                {supervisorName || "Workplace Supervisor"}
              </p>
              <p className="font-sans text-[11px] text-on-surface-variant leading-tight">
                {supervisorEmail}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleSignOut}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-on-surface-variant hover:text-error hover:bg-error-container/30 transition-all border border-outline-variant/60"
            title="Sign out of your session"
          >
            <LogOut className="size-3.5" />
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        </div>
      </div>
    </header>
  );
}
