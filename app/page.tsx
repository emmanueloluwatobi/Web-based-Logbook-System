import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import {
  GraduationCap,
  UserCheck,
  ShieldCheck,
  Check,
  ArrowRight,
  Clock,
  FileCheck2,
} from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-surface">
      {/* Top Navbar */}
      <Navbar />

      <main className="flex-1">
        {/* ============================================================ */}
        {/* HERO SECTION                                                  */}
        {/* ============================================================ */}
        <section className="max-w-7xl mx-auto px-4 sm:px-8 py-12 md:py-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Column: Headlines and CTAs */}
            <div className="lg:col-span-6 space-y-6">
              {/* Pill Badge */}
              <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium bg-primary-fixed text-on-primary-fixed border border-primary/20">
                <span className="inline-block w-2 h-2 rounded-full bg-primary" />
                Ekiti State University SIWES Platform
              </div>

              {/* Two-line Headline */}
              <h1 className="font-heading text-4xl sm:text-5xl lg:text-[48px] font-bold text-on-surface leading-tight tracking-tight">
                Academic Precision for
                <br />
                <span className="text-primary">Industrial Training.</span>
              </h1>

              {/* Subheadline */}
              <p className="text-on-surface-variant text-lg leading-relaxed max-w-xl">
                Replace paper logbooks with an integrated digital workflow.
                Seamless daily activity logging, continuous supervisor reviews,
                and real-time institutional placement oversight.
              </p>

              {/* Two CTAs */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2">
                {/* Feature 03: Auth check will route to role dashboard root if authenticated, or /login if not */}
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center gap-2 bg-primary text-on-primary rounded-md px-6 py-3 font-medium text-base hover:bg-primary-container active:scale-[0.98] transition-all shadow-sm"
                >
                  <span>Login / Sign Up</span>
                  <ArrowRight className="size-4" />
                </Link>

                {/* Explore Features — Anchor scroll only */}
                <a
                  href="#features"
                  className="inline-flex items-center justify-center bg-surface-container-lowest border border-outline-variant text-on-surface rounded-md px-6 py-3 font-medium text-base hover:bg-surface-container-low active:scale-[0.98] transition-all"
                >
                  Explore Features
                </a>
              </div>
            </div>

            {/* Right Column: Static Decorative Card (Browser Chrome + Skeleton Dashboard) */}
            <div className="lg:col-span-6">
              <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-6 shadow-sm">
                {/* Browser Chrome Header */}
                <div className="flex items-center justify-between pb-4 border-b border-outline-variant/40 mb-5">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-error/70" />
                    <div className="w-3 h-3 rounded-full bg-warning/70" />
                    <div className="w-3 h-3 rounded-full bg-success/70" />
                  </div>
                  <div className="bg-surface-container-low rounded-md px-3 py-1 text-xs text-on-surface-variant font-mono">
                    wesgas.eksu.edu.ng/student
                  </div>
                  <div className="w-8" />
                </div>

                {/* Skeleton Dashboard Preview Content */}
                <div className="space-y-4 select-none">
                  {/* Metric Tiles */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-surface-container-low p-3 rounded-xl border border-outline-variant/30">
                      <div className="text-[11px] font-medium text-on-surface-variant">
                        Placement
                      </div>
                      <div className="text-sm font-semibold text-on-surface mt-1 truncate">
                        Ado Tech Hub
                      </div>
                    </div>
                    <div className="bg-surface-container-low p-3 rounded-xl border border-outline-variant/30">
                      <div className="text-[11px] font-medium text-on-surface-variant">
                        Progress
                      </div>
                      <div className="text-sm font-semibold text-primary mt-1">
                        42 / 60 Days
                      </div>
                    </div>
                    <div className="bg-surface-container-low p-3 rounded-xl border border-outline-variant/30">
                      <div className="text-[11px] font-medium text-on-surface-variant">
                        Entries
                      </div>
                      <div className="text-sm font-semibold text-on-surface mt-1">
                        18 Approved
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar Skeleton */}
                  <div className="bg-surface-container-low p-3.5 rounded-xl border border-outline-variant/30 space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="font-medium text-on-surface">
                        Attendance Progress
                      </span>
                      <span className="text-on-surface-variant">70%</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-surface-container-high overflow-hidden">
                      <div className="h-full bg-primary rounded-full w-[70%]" />
                    </div>
                  </div>

                  {/* Sample Activity Card */}
                  <div className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/60 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileCheck2 className="size-4 text-primary" />
                        <span className="font-heading text-sm font-semibold text-on-surface">
                          Daily Entry — Week 7, Day 3
                        </span>
                      </div>
                      <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-success-container text-on-success-container">
                        Approved
                      </span>
                    </div>

                    {/* Skeleton Activity Lines */}
                    <div className="space-y-1.5 pt-1">
                      <div className="h-2.5 bg-surface-container-high rounded-full w-5/6" />
                      <div className="h-2.5 bg-surface-container-high rounded-full w-4/6" />
                    </div>

                    <div className="flex items-center justify-between text-xs text-on-surface-variant pt-2 border-t border-outline-variant/30">
                      <span className="inline-flex items-center gap-1">
                        <Clock className="size-3.5" /> 8.0 Hours Worked
                      </span>
                      <span className="inline-flex items-center gap-1 text-primary font-medium">
                        <Check className="size-3.5" /> Supervisor Reviewed
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ============================================================ */}
        {/* COMPREHENSIVE ECOSYSTEM SECTION (Anchor: #features)           */}
        {/* ============================================================ */}
        <section
          id="features"
          className="max-w-7xl mx-auto px-4 sm:px-8 py-16 md:py-24 border-t border-outline-variant/40 scroll-mt-8"
        >
          {/* Section Header */}
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
            <h2 className="font-heading text-3xl sm:text-4xl font-bold text-on-surface tracking-tight">
              Comprehensive Ecosystem
            </h2>
            <p className="text-on-surface-variant text-lg">
              Tailored workspaces designed to support every actor across Ekiti
              State University&apos;s industrial work schemes.
            </p>
          </div>

          {/* Three Feature Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Card 1: For Students */}
            <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-6 flex flex-col justify-between shadow-sm">
              <div>
                <div className="w-12 h-12 rounded-xl bg-primary-fixed flex items-center justify-center text-primary mb-6">
                  <GraduationCap className="size-6" />
                </div>
                <h3 className="font-heading text-xl font-semibold text-on-surface mb-3">
                  For Students
                </h3>
                <p className="text-on-surface-variant text-sm leading-relaxed mb-6">
                  Log daily industrial activities, manage drafts, and track
                  approvals with transparent supervisor feedback history.
                </p>
              </div>

              <div className="space-y-3 pt-4 border-t border-outline-variant/30">
                <div className="flex items-start gap-2.5 text-sm text-on-surface">
                  <Check className="size-4 text-primary shrink-0 mt-0.5" />
                  <span>Effortless daily entry drafting and resubmission</span>
                </div>
                <div className="flex items-start gap-2.5 text-sm text-on-surface">
                  <Check className="size-4 text-primary shrink-0 mt-0.5" />
                  <span>Real-time status updates and attendance counter</span>
                </div>
              </div>
            </div>

            {/* Card 2: For Supervisors */}
            <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-6 flex flex-col justify-between shadow-sm">
              <div>
                <div className="w-12 h-12 rounded-xl bg-primary-fixed flex items-center justify-center text-primary mb-6">
                  <UserCheck className="size-6" />
                </div>
                <h3 className="font-heading text-xl font-semibold text-on-surface mb-3">
                  For Supervisors
                </h3>
                <p className="text-on-surface-variant text-sm leading-relaxed mb-6">
                  Review student logs through an organized queue. Approve,
                  provide required correction notes, and grade monthly progress.
                </p>
              </div>

              <div className="space-y-3 pt-4 border-t border-outline-variant/30">
                <div className="flex items-start gap-2.5 text-sm text-on-surface">
                  <Check className="size-4 text-primary shrink-0 mt-0.5" />
                  <span>One-click approval or corrective comment requests</span>
                </div>
                <div className="flex items-start gap-2.5 text-sm text-on-surface">
                  <Check className="size-4 text-primary shrink-0 mt-0.5" />
                  <span>Standardized 7-category scoring rubric</span>
                </div>
              </div>
            </div>

            {/* Card 3: For Admin & HOD — Visually Inverted */}
            <div className="bg-primary text-on-primary border border-primary rounded-2xl p-6 flex flex-col justify-between shadow-md">
              <div>
                <div className="w-12 h-12 rounded-xl bg-primary-container flex items-center justify-center text-white mb-6">
                  <ShieldCheck className="size-6" />
                </div>
                <h3 className="font-heading text-xl font-semibold text-on-primary mb-3">
                  For Admin &amp; HOD
                </h3>
                <p className="text-on-primary-container text-sm leading-relaxed mb-6">
                  Full institutional governance. Monitor departmental placement
                  rates, detect overdue logbooks, and configure academic
                  sessions.
                </p>
              </div>

              <div className="space-y-3 pt-4 border-t border-primary-container/40">
                <div className="flex items-start gap-2.5 text-sm text-on-primary">
                  <Check className="size-4 text-on-primary shrink-0 mt-0.5" />
                  <span>Department-wide overdue student identification</span>
                </div>
                <div className="flex items-start gap-2.5 text-sm text-on-primary">
                  <Check className="size-4 text-on-primary shrink-0 mt-0.5" />
                  <span>Complete academic session and placement setup</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
