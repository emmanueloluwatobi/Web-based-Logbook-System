import React from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { SupervisorSidebar } from "@/components/supervisor/SupervisorSidebar";

export const dynamic = "force-dynamic";

export default async function SupervisorLayout({
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
    console.error("[SupervisorLayout] Error getting session:", err);
  }

  // If user is authenticated but not a supervisor or admin, redirect to their role dashboard
  if (session && session.user.role !== "school_supervisor" && session.user.role !== "admin") {
    redirect(`/${session.user.role === "student" ? "student" : session.user.role === "hod" ? "hod" : "login"}`);
  }

  const supervisorInfo = {
    name: session?.user?.name || "Dr. O. A. Babalola",
    email: session?.user?.email || "o.babalola@eksu.edu.ng",
    role: "Academic Supervisor",
  };

  return (
    <div className="h-screen overflow-hidden bg-surface flex flex-col md:flex-row">
      <SupervisorSidebar supervisor={supervisorInfo} />
      <div className="flex-1 h-full overflow-y-auto min-w-0">
        <main className="max-w-7xl w-full mx-auto px-4 sm:px-8 py-8 flex flex-col gap-6">
          {children}
        </main>
      </div>
    </div>
  );
}
