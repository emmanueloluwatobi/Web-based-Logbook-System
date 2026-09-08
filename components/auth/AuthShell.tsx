import React from "react";
import Link from "next/link";
import { GraduationCap, ShieldCheck } from "lucide-react";

interface AuthShellProps {
  children: React.ReactNode;
}

export function AuthShell({ children }: AuthShellProps) {
  return (
    <div className="min-h-screen w-full flex flex-col md:flex-row bg-surface">
      {/* Left Brand Panel — Academic Blue */}
      <div className="w-full md:w-5/12 lg:w-1/2 bg-primary text-on-primary p-8 sm:p-12 lg:p-16 flex flex-col justify-between relative overflow-hidden">
        {/* Subtle background visual pattern */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,var(--color-primary-container),transparent_70%)] opacity-40 pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 rounded-full bg-primary-container/20 blur-3xl pointer-events-none" />

        {/* Brand Header */}
        <div className="relative z-10">
          <Link href="/" className="inline-flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-surface-container-lowest/10 border border-on-primary/20 flex items-center justify-center text-on-primary group-hover:bg-surface-container-lowest/20 transition-colors">
              <GraduationCap className="size-5" />
            </div>
            <div>
              <span className="font-heading text-xl font-bold tracking-tight text-on-primary">
                ULS Portal
              </span>
              <span className="block text-[11px] font-sans text-on-primary-container font-medium tracking-wide">
                Ekiti State University · SIWES
              </span>
            </div>
          </Link>
        </div>

        {/* Narrative Center */}
        <div className="my-12 md:my-auto relative z-10 max-w-md">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-container-lowest/10 border border-on-primary/15 text-xs text-on-primary-container font-medium mb-6">
            <span>University Logbook System</span>
          </div>
          <h1 className="font-heading text-3xl sm:text-4xl font-bold tracking-tight text-on-primary leading-tight mb-4">
            SIWES Digital Logbook & Evaluation Platform
          </h1>
          <p className="font-sans text-sm sm:text-base text-on-primary-container leading-relaxed">
            Continuous digital tracking, supervisor grading, and institutional oversight for Ekiti State University industrial attachments.
          </p>
        </div>

        {/* Institutional Trust Footer Badge */}
        <div className="relative z-10 pt-6 border-t border-on-primary/15 flex items-center justify-between text-xs text-on-primary-container">
          <div className="inline-flex items-center gap-2">
            <ShieldCheck className="size-4 text-on-primary" />
            <span className="font-medium tracking-wider uppercase font-heading text-[11px]">
              Institutional Trust · EST. 2026
            </span>
          </div>
          <span className="font-sans opacity-80">EKSU Directorate of SIWES</span>
        </div>
      </div>

      {/* Right Form Container */}
      <div className="w-full md:w-7/12 lg:w-1/2 flex items-center justify-center p-6 sm:p-10 lg:p-16 bg-surface">
        <div className="w-full max-w-md bg-surface-container-lowest rounded-2xl border border-outline-variant p-8 sm:p-10 shadow-sm">
          {children}
        </div>
      </div>
    </div>
  );
}
