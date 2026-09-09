import React, { Suspense } from "react";
import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { eq, desc, inArray } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  studentProfile,
  logbookEntry,
  supervisorFeedback,
  placement,
  user,
} from "@/db/schema";
import { StudentLogbookView } from "@/components/student/StudentLogbookView";
import { LogbookEntryItem } from "@/lib/mock-logbook";
import { EntryStatus } from "@/components/student/EntryStatusBadge";

export const metadata: Metadata = {
  title: "Daily Logbook — ULS EKSU SIWES",
  description: "Record and manage your daily SIWES industrial training activities and verified hours.",
};

export const dynamic = "force-dynamic";

export default async function StudentLogbookPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || !session.user) {
    redirect("/login");
  }

  // Fetch linked student profile
  const [profile] = await db
    .select()
    .from(studentProfile)
    .where(eq(studentProfile.userId, session.user.id))
    .limit(1);

  let initialEntries: LogbookEntryItem[] = [];
  let supervisorName = "Dr. Babatunde Adeyemi";
  const supervisorRole = "School Supervisor · Computer Science";

  if (profile) {
    // 1. Fetch real logbook entries
    const dbEntries = await db
      .select()
      .from(logbookEntry)
      .where(eq(logbookEntry.studentId, profile.id))
      .orderBy(desc(logbookEntry.entryDate), desc(logbookEntry.id));

    // 2. Fetch supervisor feedback for entries if any
    const entryIds = dbEntries.map((e) => e.id);
    let feedbacks: {
      entryId: string;
      action: "approved" | "rejected";
      comment: string | null;
      supervisorName: string | null;
      createdAt: Date;
    }[] = [];

    if (entryIds.length > 0) {
      feedbacks = await db
        .select({
          entryId: supervisorFeedback.entryId,
          action: supervisorFeedback.action,
          comment: supervisorFeedback.comment,
          supervisorName: user.name,
          createdAt: supervisorFeedback.createdAt,
        })
        .from(supervisorFeedback)
        .leftJoin(user, eq(supervisorFeedback.supervisorId, user.id))
        .where(inArray(supervisorFeedback.entryId, entryIds));
    }

    // 3. Map entries
    initialEntries = dbEntries.map((e) => {
      const fb = feedbacks.find((f) => f.entryId === e.id);
      return {
        id: e.id,
        entryDate: e.entryDate,
        activityDescription: e.activityDescription,
        skillsGained: e.skillsGained || undefined,
        challenges: e.challenges || undefined,
        hoursWorked: parseFloat(e.hoursWorked) || 8.0,
        status: e.status as EntryStatus,
        attachmentUrl: e.attachmentUrl || undefined,
        attachmentName: e.attachmentUrl
          ? decodeURIComponent(e.attachmentUrl.split("/").pop()?.split("?")[0] || "attachment")
          : undefined,
        submittedAt: e.submittedAt ? e.submittedAt.toISOString() : undefined,
        supervisorFeedback: fb
          ? {
              action: fb.action,
              comment: fb.comment || undefined,
              supervisorName: fb.supervisorName || "School Supervisor",
              reviewedAt: fb.createdAt.toISOString(),
            }
          : undefined,
      };
    });

    // 4. Fetch placement supervisor
    const [activePlacement] = await db
      .select({
        supervisorName: user.name,
      })
      .from(placement)
      .leftJoin(user, eq(placement.schoolSupervisorId, user.id))
      .where(eq(placement.studentId, profile.id))
      .limit(1);

    if (activePlacement?.supervisorName) {
      supervisorName = activePlacement.supervisorName;
    }
  }

  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        </div>
      }
    >
      <StudentLogbookView
        initialEntries={initialEntries}
        supervisorName={supervisorName}
        supervisorRole={supervisorRole}
      />
    </Suspense>
  );
}
