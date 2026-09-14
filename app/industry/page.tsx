import React from "react";
import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getIndustrySupervisorPlacements } from "@/actions/assessment";
import { IndustryDashboardView } from "@/components/industry/IndustryDashboardView";

export const metadata: Metadata = {
  title: "Industry Supervisor Portal · ULS EKSU SIWES",
  description: "Workplace mentorship and monthly student evaluation portal.",
};

export const dynamic = "force-dynamic";

export default async function IndustryDashboardPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || !session.user) {
    redirect("/login/industry");
  }

  if (session.user.role !== "industry_supervisor") {
    // If a student or staff member mistakenly visits /industry, redirect them to their respective portal
    if (session.user.role === "student") redirect("/student");
    if (session.user.role === "school_supervisor") redirect("/supervisor");
    if (session.user.role === "hod") redirect("/hod");
    if (session.user.role === "admin") redirect("/admin");
    redirect("/login/industry");
  }

  const students = await getIndustrySupervisorPlacements();

  return (
    <IndustryDashboardView
      supervisorName={session.user.name}
      supervisorEmail={session.user.email}
      students={students}
    />
  );
}
