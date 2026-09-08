"use client";

import React from "react";
import Link from "next/link";
import { AlertCircle, ArrowRight } from "lucide-react";

interface IncompleteProfileBannerProps {
  isProfileComplete?: boolean;
  missingFields?: string[];
}

export function IncompleteProfileBanner({
  isProfileComplete = false,
  missingFields = [
    "Matric Number",
    "Program",
    "Level",
    "Session",
    "Phone Number",
    "Profile Photo",
  ],
}: IncompleteProfileBannerProps) {
  if (isProfileComplete) {
    return null;
  }

  return (
    <div className="w-full rounded-xl bg-primary-fixed border border-primary-fixed-dim/60 px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-xs">
      <div className="flex items-start sm:items-center gap-3">
        <div className="w-7 h-7 rounded-lg bg-surface-container-lowest/70 text-on-primary-fixed flex items-center justify-center shrink-0 mt-0.5 sm:mt-0">
          <AlertCircle className="size-4 text-primary" />
        </div>
        <div>
          <p className="text-xs sm:text-sm font-medium text-on-primary-fixed">
            <span className="font-semibold font-heading">Incomplete Student Profile:</span>{" "}
            Add your{" "}
            <span className="font-semibold underline decoration-primary/40">
              {missingFields.join(", ")}
            </span>{" "}
            to finalize your SIWES dashboard verification.
          </p>
        </div>
      </div>

      <Link
        href="/student/profile"
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-on-primary text-xs font-semibold hover:bg-primary-container active:scale-[0.98] transition-all shrink-0 self-start sm:self-auto shadow-xs"
      >
        <span>Complete Profile</span>
        <ArrowRight className="size-3.5" />
      </Link>
    </div>
  );
}
