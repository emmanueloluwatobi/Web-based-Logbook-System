import React from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { department } from "@/db/schema";
import { HodSidebar } from "@/components/hod/HodSidebar";

export const dynamic = "force-dynamic";

export default async function HodLayout({
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
    console.error("[HodLayout] Error getting session:", err);
  }

  // If user is authenticated but not HOD or admin, redirect
  if (session && session.user.role !== "hod" && session.user.role !== "admin") {
    redirect(
      `/${
        session.user.role === "student"
          ? "student"
          : session.user.role === "school_supervisor"
            ? "supervisor"
            : "login"
      }`
    );
  }

  // Fetch department name for sidebar subtitle
  let departmentName = "Department";
  if (session?.user?.departmentId) {
    try {
      const [dept] = await db
        .select({ name: department.name })
        .from(department)
        .where(eq(department.id, session.user.departmentId))
        .limit(1);
      if (dept?.name) departmentName = dept.name;
    } catch (err) {
      console.error("[HodLayout] Error fetching department:", err);
    }
  }

  const hodInfo = {
    name: session?.user?.name || "Department Head",
    email: session?.user?.email || "",
    departmentName,
  };

  return (
    <div className="h-screen overflow-hidden bg-surface flex flex-col md:flex-row">
      <HodSidebar hod={hodInfo} />
      <div className="flex-1 h-full overflow-y-auto min-w-0">
        <main className="max-w-7xl w-full mx-auto px-4 sm:px-8 py-8 flex flex-col gap-6">
          {children}
        </main>
      </div>
    </div>
  );
}
