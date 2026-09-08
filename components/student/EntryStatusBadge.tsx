import React from "react";
import { CheckCircle2, Clock, AlertCircle, FileText, XCircle } from "lucide-react";

export type EntryStatus = "draft" | "submitted" | "approved" | "rejected" | "needs_correction";

interface EntryStatusBadgeProps {
  status: EntryStatus;
  className?: string;
}

export function EntryStatusBadge({ status, className = "" }: EntryStatusBadgeProps) {
  switch (status) {
    case "approved":
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-success-container text-on-success-container text-xs font-medium ${className}`}
        >
          <CheckCircle2 className="size-3" />
          <span>Approved</span>
        </span>
      );
    case "submitted":
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-secondary-container text-on-secondary-container text-xs font-medium ${className}`}
        >
          <Clock className="size-3" />
          <span>Submitted</span>
        </span>
      );
    case "needs_correction":
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-error-container text-on-error-container text-xs font-medium ${className}`}
        >
          <AlertCircle className="size-3" />
          <span>Needs Correction</span>
        </span>
      );
    case "rejected":
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-error-container text-on-error-container text-xs font-medium ${className}`}
        >
          <XCircle className="size-3" />
          <span>Rejected</span>
        </span>
      );
    case "draft":
    default:
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-surface-container text-on-surface-variant text-xs font-medium ${className}`}
        >
          <FileText className="size-3" />
          <span>Draft</span>
        </span>
      );
  }
}
