import React from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  logbookEntry,
  supervisorFeedback,
  placement,
  organization,
  user,
} from "@/db/schema";
import { EntryStatus } from "@/components/student/EntryStatusBadge";
import { INITIAL_MOCK_ENTRIES } from "@/lib/mock-logbook";
import { getEntryVersionChain, VersionChainItem } from "@/actions/logbook";
import { EntryDetailView, LogbookDetailData } from "@/components/student/EntryDetailView";

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
  let entry: LogbookDetailData | null = null;
  let versionChain: VersionChainItem[] = [];

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
        versionNumber: dbRow.entry.versionNumber || 1,
        parentEntryId: dbRow.entry.parentEntryId,
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

      // Retrieve full immutable version chain
      versionChain = await getEntryVersionChain(id);
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
        versionNumber: 1,
        placementOrgName: "Chevron Nigeria Limited",
        placementJobTitle: "IT Infrastructure & Network Engineering Intern",
        placementCity: "Lekki Peninsula",
        placementState: "Lagos State",
        placementSupervisor: "Dr. Babatunde Adeyemi",
      };

      // Mock version chain
      versionChain = [
        {
          id: mock.id,
          versionNumber: 1,
          entryDate: mock.entryDate,
          status: mock.status,
          hoursWorked: mock.hoursWorked,
          activityDescription: mock.activityDescription,
          skillsGained: mock.skillsGained,
          challenges: mock.challenges,
          attachmentUrl: undefined,
          submittedAt: mock.submittedAt,
          parentEntryId: null,
          feedback: mock.supervisorFeedback
            ? {
                action: mock.supervisorFeedback.action,
                comment: mock.supervisorFeedback.comment,
                supervisorName: mock.supervisorFeedback.supervisorName,
                createdAt: mock.supervisorFeedback.reviewedAt,
              }
            : null,
        },
      ];
    }
  }

  if (!entry) {
    notFound();
  }

  const chainToUse = versionChain.length > 0 ? versionChain : [
    {
      id: entry.id,
      versionNumber: entry.versionNumber,
      entryDate: entry.entryDate,
      status: entry.status,
      hoursWorked: entry.hoursWorked,
      activityDescription: entry.activityDescription,
      skillsGained: entry.skillsGained,
      challenges: entry.challenges,
      attachmentUrl: entry.attachmentUrl,
      submittedAt: entry.submittedAt,
      parentEntryId: entry.parentEntryId,
      feedback: entry.supervisorFeedback
        ? {
            action: entry.supervisorFeedback.action,
            comment: entry.supervisorFeedback.comment,
            supervisorName: entry.supervisorFeedback.supervisorName,
            createdAt: entry.supervisorFeedback.reviewedAt,
          }
        : null,
    },
  ];

  // Check if a subsequent version has already been submitted for this entry
  const hasChildVersion = chainToUse.some(
    (v) => v.parentEntryId === entry?.id || v.versionNumber > (entry?.versionNumber || 1)
  );
  const latestVersion = chainToUse[chainToUse.length - 1];

  return (
    <EntryDetailView
      entry={entry}
      versionChain={chainToUse}
      hasChildVersion={hasChildVersion}
      latestVersionId={latestVersion?.id}
      latestVersionNumber={latestVersion?.versionNumber}
    />
  );
}
