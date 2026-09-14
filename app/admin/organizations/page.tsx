import React from "react";
import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { eq, asc, count } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { organization, placement } from "@/db/schema";
import {
  OrganizationList,
  type OrganizationItem,
} from "@/components/admin/OrganizationList";

export const metadata: Metadata = {
  title: "Organizations & Employers — EKSU SIWES Admin",
  description: "Manage registered companies, institutions, and training establishments for SIWES.",
};

export const dynamic = "force-dynamic";

export default async function AdminOrganizationsPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || !session.user) {
    redirect("/login");
  }

  if (session.user.role !== "admin" && session.user.role !== "hod") {
    redirect("/login");
  }

  const rawOrgs = await db
    .select({
      id: organization.id,
      name: organization.name,
      address: organization.address,
      stateRegion: organization.stateRegion,
      industryType: organization.industryType,
      placementCount: count(placement.id),
    })
    .from(organization)
    .leftJoin(placement, eq(organization.id, placement.organizationId))
    .groupBy(
      organization.id,
      organization.name,
      organization.address,
      organization.stateRegion,
      organization.industryType
    )
    .orderBy(asc(organization.name));

  const organizations: OrganizationItem[] = rawOrgs.map((o) => ({
    id: o.id,
    name: o.name,
    address: o.address,
    stateRegion: o.stateRegion,
    industryType: o.industryType,
    placementCount: Number(o.placementCount) || 0,
  }));

  return <OrganizationList organizations={organizations} />;
}
