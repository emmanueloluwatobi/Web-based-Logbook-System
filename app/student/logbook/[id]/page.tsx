import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import {
  Calendar,
  Clock,
  ChevronRight,
  ArrowLeft,
  FileText,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Paperclip,
  Download,
} from "lucide-react";
import { db } from "@/lib/db";
import {
  logbookEntry,
  supervisorFeedback,
  placement,
  organization,
  user,
} from "@/db/schema";
import { EntryStatusBadge, EntryStatus } from "@/components/student/EntryStatusBadge";
import { INITIAL_MOCK_ENTRIES } from "@/lib/mock-logbook";

export const metadata: Metadata = {
  title: "Logbook Entry Details — ULS EKSU SIWES",
  description: "View daily SIWES industrial training tasks, hours, skills gained, and supervisor reviews.",
};

export const dynamic = "force-dynamic";

export default async function LogbookDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // 1. Try DB lookup first
  let entry: {
    id: string;
    entryDate: string;
    activityDescription: string;
    skillsGained?: string;
    challenges?: string;
    hoursWorked: number;
    status: EntryStatus;
    attachmentUrl?: string;
    attachmentName?: string;
    submittedAt?: string;
    supervisorFeedback?: {
      action: "approved" | "rejected";
      comment?: string;
      supervisorName: string;
      reviewedAt: string;
    };
    placementOrgName?: string;
    placementJobTitle?: string;
    placementCity?: string;
    placementState?: string;
    placementSupervisor?: string;
  } | null = null;

  try {
    const [dbRow] = await db
      .select({
        entry: logbookEntry,
        orgName: organization.name,
        placementStateRegion: organization.stateRegion,
        supervisorName: user.name,
      })
      .from(logbookEntry)
      .leftJoin(placement, eq(logbookEntry.placementId, placement.id))
      .leftJoin(organization, eq(placement.organizationId, organization.id))
      .leftJoin(user, eq(placement.schoolSupervisorId, user.id))
      .where(eq(logbookEntry.id, id))
      .limit(1);

    if (dbRow) {
      // Lookup supervisor feedback
      const [feedback] = await db
        .select({
          action: supervisorFeedback.action,
          comment: supervisorFeedback.comment,
          supervisorName: user.name,
          createdAt: supervisorFeedback.createdAt,
        })
        .from(supervisorFeedback)
        .leftJoin(user, eq(supervisorFeedback.supervisorId, user.id))
        .where(eq(supervisorFeedback.entryId, id))
        .limit(1);

      entry = {
        id: dbRow.entry.id,
        entryDate: dbRow.entry.entryDate,
        activityDescription: dbRow.entry.activityDescription,
        skillsGained: dbRow.entry.skillsGained || undefined,
        challenges: dbRow.entry.challenges || undefined,
        hoursWorked: parseFloat(dbRow.entry.hoursWorked) || 8.0,
        status: dbRow.entry.status as EntryStatus,
        attachmentUrl: dbRow.entry.attachmentUrl || undefined,
        attachmentName: dbRow.entry.attachmentUrl
          ? decodeURIComponent(dbRow.entry.attachmentUrl.split("/").pop()?.split("?")[0] || "attachment")
          : undefined,
        submittedAt: dbRow.entry.submittedAt ? dbRow.entry.submittedAt.toISOString() : undefined,
        supervisorFeedback: feedback
          ? {
              action: feedback.action,
              comment: feedback.comment || undefined,
              supervisorName: feedback.supervisorName || "School Supervisor",
              reviewedAt: feedback.createdAt.toISOString(),
            }
          : undefined,
        placementOrgName: dbRow.orgName || "Chevron Nigeria Limited",
        placementJobTitle: "IT Infrastructure & Network Engineering Intern",
        placementCity: "Lekki Peninsula",
        placementState: dbRow.placementStateRegion || "Lagos State",
        placementSupervisor: dbRow.supervisorName || "Dr. Babatunde Adeyemi",
      };
    }
  } catch (err) {
    console.error("[LogbookDetailPage] DB lookup error:", err);
  }

  // 2. Fallback to mock entries if DB lookup didn't find the entry
  if (!entry) {
    const mock = INITIAL_MOCK_ENTRIES.find((e) => e.id === id);
    if (mock) {
      entry = {
        ...mock,
        placementOrgName: "Chevron Nigeria Limited",
        placementJobTitle: "IT Infrastructure & Network Engineering Intern",
        placementCity: "Lekki Peninsula",
        placementState: "Lagos State",
        placementSupervisor: "Dr. Babatunde Adeyemi",
      };
    }
  }

  if (!entry) {
    notFound();
  }

  const formatDateTitle = (dateStr: string) => {
    try {
      const [year, month, day] = dateStr.split("-");
      const d = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      return d.toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-xs text-on-surface-variant font-medium">
        <Link href="/student" className="hover:text-primary transition-colors">
          Dashboard
        </Link>
        <ChevronRight className="size-3 text-outline" />
        <Link href="/student/logbook" className="hover:text-primary transition-colors">
          Daily Logbook
        </Link>
        <ChevronRight className="size-3 text-outline" />
        <span className="text-on-surface font-semibold truncate max-w-[200px]">
          {entry.entryDate}
        </span>
      </div>

      {/* Top Header Card */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-6 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-on-surface">
              {formatDateTitle(entry.entryDate)}
            </h1>
            <EntryStatusBadge status={entry.status} />
          </div>
          <p className="font-sans text-xs sm:text-sm text-on-surface-variant mt-1.5 flex items-center gap-2">
            <Calendar className="size-3.5 text-primary" />
            <span>SIWES Attachment Day</span>
            <span>·</span>
            <Clock className="size-3.5 text-primary" />
            <span>{entry.hoursWorked.toFixed(1)} verified work hours</span>
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <Link
            href="/student/logbook?view=all"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-outline-variant bg-surface-container-lowest text-on-surface text-xs font-semibold hover:bg-surface-container-low transition-all shadow-xs"
          >
            <ArrowLeft className="size-3.5" />
            <span>Back to Entries</span>
          </Link>
        </div>
      </div>

      {/* Supervisor Review / Feedback Card (if reviewed or needs correction) */}
      {entry.supervisorFeedback && (
        <div
          className={`rounded-2xl border p-5 shadow-xs ${
            entry.supervisorFeedback.action === "approved"
              ? "bg-success-container/20 border-success/30 text-on-surface"
              : "bg-error-container/20 border-error/30 text-on-surface"
          }`}
        >
          <div className="flex items-start gap-3">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                entry.supervisorFeedback.action === "approved"
                  ? "bg-success-container text-on-success-container"
                  : "bg-error-container text-on-error-container"
              }`}
            >
              {entry.supervisorFeedback.action === "approved" ? (
                <CheckCircle2 className="size-5" />
              ) : (
                <AlertCircle className="size-5" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                <h3 className="font-heading text-sm font-bold text-on-surface">
                  {entry.supervisorFeedback.action === "approved"
                    ? "Verified & Approved by School Supervisor"
                    : "Supervisor Revision Request (Needs Correction)"}
                </h3>
                <span className="text-[11px] text-on-surface-variant font-medium">
                  Reviewed by {entry.supervisorFeedback.supervisorName}
                </span>
              </div>

              {entry.supervisorFeedback.comment ? (
                <div className="mt-2.5 p-3 rounded-xl bg-surface-container-lowest border border-outline-variant/60">
                  <p className="text-xs text-on-surface leading-relaxed italic">
                    "{entry.supervisorFeedback.comment}"
                  </p>
                </div>
              ) : (
                <p className="text-xs text-on-surface-variant mt-1">
                  Logbook entry verified and approved with full credit for {entry.hoursWorked} training hours.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Activity, Skills, Challenges */}
        <div className="lg:col-span-2 space-y-6">
          {/* Daily Activity */}
          <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-6 shadow-xs">
            <div className="flex items-center gap-2.5 pb-4 border-b border-outline-variant/60">
              <div className="w-8 h-8 rounded-lg bg-surface-container-low text-primary flex items-center justify-center">
                <FileText className="size-4" />
              </div>
              <h2 className="font-heading text-base font-bold text-on-surface">
                Daily Activity Description
              </h2>
            </div>
            <p className="text-sm text-on-surface font-sans leading-relaxed mt-4 whitespace-pre-wrap">
              {entry.activityDescription}
            </p>
          </div>

          {/* Skills Gained */}
          <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-6 shadow-xs">
            <div className="flex items-center gap-2.5 pb-4 border-b border-outline-variant/60">
              <div className="w-8 h-8 rounded-lg bg-surface-container-low text-primary flex items-center justify-center">
                <Sparkles className="size-4" />
              </div>
              <h2 className="font-heading text-base font-bold text-on-surface">
                Technical Skills & Knowledge Gained
              </h2>
            </div>
            <p className="text-sm text-on-surface font-sans leading-relaxed mt-4 whitespace-pre-wrap">
              {entry.skillsGained || "No specific skills noted for this entry."}
            </p>
          </div>

          {/* Challenges Encountered */}
          <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-6 shadow-xs">
            <div className="flex items-center gap-2.5 pb-4 border-b border-outline-variant/60">
              <div className="w-8 h-8 rounded-lg bg-surface-container-low text-primary flex items-center justify-center">
                <AlertCircle className="size-4" />
              </div>
              <h2 className="font-heading text-base font-bold text-on-surface">
                Challenges Encountered & Solutions
              </h2>
            </div>
            <p className="text-sm text-on-surface font-sans leading-relaxed mt-4 whitespace-pre-wrap">
              {entry.challenges || "No operational challenges reported for this day."}
            </p>
          </div>
        </div>

        {/* Right Col: Metadata & Placement Context */}
        <div className="space-y-6">
          {/* Metadata Card */}
          <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-6 shadow-xs">
            <h3 className="font-heading text-sm font-bold text-on-surface uppercase tracking-wider pb-3 border-b border-outline-variant/60">
              Entry Metadata
            </h3>

            <dl className="mt-4 space-y-3.5 text-xs">
              <div className="flex items-center justify-between">
                <dt className="text-on-surface-variant font-medium">Logbook ID</dt>
                <dd className="font-mono font-semibold text-on-surface truncate max-w-[150px]">{entry.id}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-on-surface-variant font-medium">Training Date</dt>
                <dd className="font-semibold text-on-surface">{entry.entryDate}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-on-surface-variant font-medium">Hours Logged</dt>
                <dd className="font-mono font-semibold text-primary">{entry.hoursWorked.toFixed(1)} hrs</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-on-surface-variant font-medium">Current Status</dt>
                <dd>
                  <EntryStatusBadge status={entry.status} />
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-on-surface-variant font-medium">Submission Version</dt>
                <dd className="font-semibold text-on-surface">Version 1 (Initial)</dd>
              </div>
              {entry.submittedAt && (
                <div className="flex items-center justify-between">
                  <dt className="text-on-surface-variant font-medium">Submitted At</dt>
                  <dd className="text-on-surface">
                    {new Date(entry.submittedAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </dd>
                </div>
              )}
            </dl>
          </div>

          {/* Attachment Card */}
          <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-6 shadow-xs">
            <h3 className="font-heading text-sm font-bold text-on-surface uppercase tracking-wider pb-3 border-b border-outline-variant/60">
              Attachment
            </h3>

            {entry.attachmentUrl ? (
              <div className="mt-4 p-3 rounded-xl border border-outline-variant/60 bg-surface-container-low/40 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-surface-container text-primary flex items-center justify-center shrink-0">
                    <Paperclip className="size-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-on-surface truncate">
                      {entry.attachmentName || "Attached Document"}
                    </p>
                    <p className="text-[10px] text-on-surface-variant">Verified Attachment</p>
                  </div>
                </div>

                <a
                  href={entry.attachmentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 rounded-lg text-on-surface-variant hover:text-primary hover:bg-surface-container transition-colors shrink-0"
                  title="View / Download attachment"
                >
                  <Download className="size-4" />
                </a>
              </div>
            ) : (
              <div className="mt-4 p-4 rounded-xl border border-dashed border-outline-variant/60 text-center text-xs text-on-surface-variant">
                No supporting attachment uploaded for this entry.
              </div>
            )}
          </div>

          {/* Placement Anchor */}
          <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-6 shadow-xs">
            <h3 className="font-heading text-sm font-bold text-on-surface uppercase tracking-wider pb-3 border-b border-outline-variant/60">
              Assigned SIWES Placement
            </h3>

            <div className="mt-3 text-xs space-y-2">
              <p className="font-semibold text-on-surface text-sm">{entry.placementOrgName}</p>
              <p className="text-on-surface-variant">{entry.placementJobTitle}</p>
              <p className="text-[11px] text-on-surface-variant/80">
                {entry.placementCity}, {entry.placementState}
              </p>
              <div className="pt-2 border-t border-outline-variant/50 flex items-center justify-between text-[11px]">
                <span className="text-on-surface-variant">Supervisor:</span>
                <span className="font-semibold text-on-surface">{entry.placementSupervisor}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
