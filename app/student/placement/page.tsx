import React from "react";
import Link from "next/link";
import { Building2, ArrowLeft } from "lucide-react";

export default function StudentPlacementPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-2 text-xs text-on-surface-variant font-medium">
        <Link href="/student" className="hover:text-primary transition-colors">
          Dashboard
        </Link>
        <span>/</span>
        <span className="text-on-surface">My Placement</span>
      </div>

      <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-8 text-center max-w-xl mx-auto my-8">
        <div className="w-12 h-12 rounded-xl bg-surface-container-low text-primary flex items-center justify-center mx-auto mb-4">
          <Building2 className="size-6" />
        </div>
        <h2 className="font-heading text-xl font-bold text-on-surface mb-2">
          Placement & Organization Details
        </h2>
        <p className="text-xs text-on-surface-variant leading-relaxed mb-6">
          Full placement history, organization directory, and supervisor assignment details will be configured in Phase 3 (Feature 10).
        </p>
        <Link
          href="/student"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-on-primary text-xs font-semibold hover:bg-primary-container transition-all"
        >
          <ArrowLeft className="size-3.5" />
          <span>Back to Overview</span>
        </Link>
      </div>
    </div>
  );
}
