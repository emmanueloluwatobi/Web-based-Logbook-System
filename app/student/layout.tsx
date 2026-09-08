import React from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { StudentSidebar } from "@/components/student/StudentSidebar";

export const dynamic = "force-dynamic";

export default async function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let session = null;
  try {
    session = await auth.api.getSession({
      headers: await headers(),
    });
  } catch (err) {
    console.error("[StudentLayout] Error getting session:", err);
  }

  // If user is authenticated but not a student, redirect to appropriate role or login
  if (session && session.user.role !== "student") {
    redirect(`/${session.user.role === "admin" ? "admin" : session.user.role === "hod" ? "hod" : "supervisor"}`);
  }

  const studentInfo = {
    name: session?.user?.name || "Adeola Babatunde",
    email: session?.user?.email || "adeola.babatunde@eksu.edu.ng",
    matricNumber: "EKSU/2022/1049",
  };

  return (
    <div className="h-screen overflow-hidden bg-surface flex flex-col md:flex-row">
      <StudentSidebar student={studentInfo} />
      <div className="flex-1 h-full overflow-y-auto min-w-0">
        <main className="max-w-7xl w-full mx-auto px-4 sm:px-8 py-8 flex flex-col gap-6">
          {children}
        </main>
      </div>
    </div>
  );
}
