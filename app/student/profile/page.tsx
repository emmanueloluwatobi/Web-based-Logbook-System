import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { eq, desc } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { studentProfile, department, program, academicSession } from "@/db/schema";
import { StudentProfileCard } from "@/components/student/StudentProfileCard";
import { ChevronRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Student Profile — ULS EKSU SIWES",
  description: "Ekiti State University SIWES Student Academic Profile and Verification Portal.",
};

export const dynamic = "force-dynamic";

export default async function StudentProfilePage() {
  let session = null;
  try {
    session = await auth.api.getSession({
      headers: await headers(),
    });
  } catch (err) {
    console.error("[StudentProfilePage] Error retrieving session:", err);
  }

  if (!session || !session.user) {
    redirect("/login");
  }

  if (session.user.role !== "student") {
    redirect(
      session.user.role === "admin"
        ? "/admin"
        : session.user.role === "hod"
        ? "/hod"
        : "/supervisor"
    );
  }

  const userId = session.user.id;

  // 1. Fetch student_profile row (create if missing as safety net)
  let [profile] = await db
    .select()
    .from(studentProfile)
    .where(eq(studentProfile.userId, userId))
    .limit(1);

  if (!profile) {
    const [created] = await db
      .insert(studentProfile)
      .values({
        userId,
        matricNumber: null,
        programId: null,
        level: null,
        sessionId: null,
        phone: null,
        profilePhotoUrl: null,
        isProfileComplete: false,
      })
      .returning();
    profile = created;
  }

  // 2. Fetch Department
  let departmentName = "Department Not Set";
  if (session.user.departmentId) {
    const [dept] = await db
      .select({ name: department.name })
      .from(department)
      .where(eq(department.id, session.user.departmentId))
      .limit(1);
    if (dept?.name) {
      departmentName = dept.name;
    }
  }

  // 3. Fetch Programs (department-specific first, fallback to all)
  let programs = session.user.departmentId
    ? await db
        .select({ id: program.id, name: program.name })
        .from(program)
        .where(eq(program.departmentId, session.user.departmentId))
    : [];

  if (programs.length === 0) {
    programs = await db.select({ id: program.id, name: program.name }).from(program);
  }

  // 4. Fetch Academic Sessions
  const sessions = await db
    .select({ id: academicSession.id, label: academicSession.label, isActive: academicSession.isActive })
    .from(academicSession)
    .orderBy(desc(academicSession.isActive), desc(academicSession.label));

  const initialProfile = {
    name: session.user.name || "Student",
    department: departmentName,
    matricNumber: profile?.matricNumber || null,
    programId: profile?.programId || null,
    level: profile?.level || null,
    sessionId: profile?.sessionId || null,
    phone: profile?.phone || null,
    profilePhotoUrl: profile?.profilePhotoUrl || null,
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-xs text-on-surface-variant font-medium">
        <Link href="/student" className="hover:text-primary transition-colors">
          Dashboard
        </Link>
        <ChevronRight className="size-3 text-outline" />
        <span className="text-on-surface font-semibold">Profile</span>
      </div>

      {/* Page Title */}
      <div>
        <h1 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-on-surface">
          Student Academic Profile
        </h1>
        <p className="font-sans text-sm text-on-surface-variant mt-1">
          Complete your academic registration, degree program, and verified SIWES credentials.
        </p>
      </div>

      {/* Full Editable Profile Card */}
      <StudentProfileCard
        initialProfile={initialProfile}
        programs={programs}
        sessions={sessions}
      />
    </div>
  );
}
