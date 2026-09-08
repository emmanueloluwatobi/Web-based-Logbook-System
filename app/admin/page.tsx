import React from "react";
import Link from "next/link";
import { eq, sql } from "drizzle-orm";
import {
  Building2,
  BookOpen,
  Calendar,
  Users,
  ArrowUpRight,
  CheckCircle2,
  PlusCircle,
  AlertCircle,
} from "lucide-react";
import { db } from "@/lib/db";
import * as schema from "@/db/schema";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  // Query summary metrics
  const [deptCountRes] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(schema.department);

  const [progCountRes] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(schema.program);

  const [activeSessionRes] = await db
    .select()
    .from(schema.academicSession)
    .where(eq(schema.academicSession.isActive, true))
    .limit(1);

  const [totalSessionsRes] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(schema.academicSession);

  const [staffCountRes] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(schema.user)
    .where(
      sql`${schema.user.role} IN ('school_supervisor', 'hod', 'admin')`
    );

  const [studentCountRes] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(schema.user)
    .where(eq(schema.user.role, "student"));

  const recentDepartments = await db
    .select()
    .from(schema.department)
    .orderBy(sql`${schema.department.createdAt} DESC`)
    .limit(5);

  const deptCount = deptCountRes?.count ?? 0;
  const progCount = progCountRes?.count ?? 0;
  const staffCount = staffCountRes?.count ?? 0;
  const studentCount = studentCountRes?.count ?? 0;
  const totalSessions = totalSessionsRes?.count ?? 0;

  return (
    <div className="flex flex-col gap-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight text-on-surface">
            System Administration Overview
          </h1>
          <p className="font-sans text-sm text-on-surface-variant mt-1">
            Institutional structure setup, academic sessions, and staff provisioning for Ekiti State University.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/admin/users"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-on-primary text-sm font-medium hover:bg-primary-container active:scale-[0.98] transition-all shadow-xs"
          >
            <PlusCircle className="size-4" />
            <span>Invite Staff User</span>
          </Link>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Departments */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-6 flex flex-col justify-between shadow-xs">
          <div className="flex items-center justify-between text-on-surface-variant">
            <span className="text-xs font-semibold uppercase tracking-wider font-heading">
              Departments
            </span>
            <div className="w-8 h-8 rounded-lg bg-surface-container-low flex items-center justify-center text-primary">
              <Building2 className="size-4" />
            </div>
          </div>
          <div className="my-4">
            <p className="font-heading text-3xl font-semibold text-on-surface">
              {deptCount}
            </p>
            <p className="text-xs text-on-surface-variant mt-1">
              Active academic faculties & depts
            </p>
          </div>
          <Link
            href="/admin/departments"
            className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:text-primary-container transition-colors pt-2 border-t border-outline-variant/60"
          >
            <span>Manage departments</span>
            <ArrowUpRight className="size-3.5" />
          </Link>
        </div>

        {/* Programs */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-6 flex flex-col justify-between shadow-xs">
          <div className="flex items-center justify-between text-on-surface-variant">
            <span className="text-xs font-semibold uppercase tracking-wider font-heading">
              Degree Programs
            </span>
            <div className="w-8 h-8 rounded-lg bg-surface-container-low flex items-center justify-center text-primary">
              <BookOpen className="size-4" />
            </div>
          </div>
          <div className="my-4">
            <p className="font-heading text-3xl font-semibold text-on-surface">
              {progCount}
            </p>
            <p className="text-xs text-on-surface-variant mt-1">
              Undergraduate disciplines registered
            </p>
          </div>
          <Link
            href="/admin/programs"
            className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:text-primary-container transition-colors pt-2 border-t border-outline-variant/60"
          >
            <span>Manage programs</span>
            <ArrowUpRight className="size-3.5" />
          </Link>
        </div>

        {/* Academic Session */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-6 flex flex-col justify-between shadow-xs">
          <div className="flex items-center justify-between text-on-surface-variant">
            <span className="text-xs font-semibold uppercase tracking-wider font-heading">
              Active Session
            </span>
            <div className="w-8 h-8 rounded-lg bg-surface-container-low flex items-center justify-center text-primary">
              <Calendar className="size-4" />
            </div>
          </div>
          <div className="my-4">
            {activeSessionRes ? (
              <div className="flex items-center gap-2">
                <span className="font-heading text-2xl font-semibold text-on-surface">
                  {activeSessionRes.label}
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-success-container text-on-success-container text-[11px] font-medium">
                  <CheckCircle2 className="size-3" />
                  Active
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-error">
                <AlertCircle className="size-5" />
                <span className="text-sm font-medium">No Active Session</span>
              </div>
            )}
            <p className="text-xs text-on-surface-variant mt-1">
              {totalSessions} total configured sessions
            </p>
          </div>
          <Link
            href="/admin/sessions"
            className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:text-primary-container transition-colors pt-2 border-t border-outline-variant/60"
          >
            <span>Manage sessions</span>
            <ArrowUpRight className="size-3.5" />
          </Link>
        </div>

        {/* Staff & User Provisioning */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-6 flex flex-col justify-between shadow-xs">
          <div className="flex items-center justify-between text-on-surface-variant">
            <span className="text-xs font-semibold uppercase tracking-wider font-heading">
              Staff Provisioned
            </span>
            <div className="w-8 h-8 rounded-lg bg-surface-container-low flex items-center justify-center text-primary">
              <Users className="size-4" />
            </div>
          </div>
          <div className="my-4">
            <p className="font-heading text-3xl font-semibold text-on-surface">
              {staffCount}
            </p>
            <p className="text-xs text-on-surface-variant mt-1">
              {studentCount} self-registered students
            </p>
          </div>
          <Link
            href="/admin/users"
            className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:text-primary-container transition-colors pt-2 border-t border-outline-variant/60"
          >
            <span>Manage staff users</span>
            <ArrowUpRight className="size-3.5" />
          </Link>
        </div>
      </div>

      {/* Two Column Layout: Quick Actions & Recent Departments */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Launchpad */}
        <div className="lg:col-span-1 bg-surface-container-lowest border border-outline-variant rounded-2xl p-6">
          <h2 className="font-heading text-lg font-semibold text-on-surface mb-2">
            System Operations
          </h2>
          <p className="font-sans text-xs text-on-surface-variant mb-6">
            Key administrative entry points for maintaining university SIWES structure.
          </p>

          <div className="space-y-3">
            <Link
              href="/admin/departments"
              className="flex items-center justify-between p-3.5 rounded-xl bg-surface-container-low hover:bg-surface-container transition-colors border border-outline-variant/50 group"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-surface-container-lowest flex items-center justify-center text-primary shadow-xs">
                  <Building2 className="size-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-on-surface group-hover:text-primary transition-colors">
                    Departments
                  </p>
                  <p className="text-xs text-on-surface-variant">Add or update academic departments</p>
                </div>
              </div>
              <ArrowUpRight className="size-4 text-on-surface-variant group-hover:text-primary transition-colors" />
            </Link>

            <Link
              href="/admin/programs"
              className="flex items-center justify-between p-3.5 rounded-xl bg-surface-container-low hover:bg-surface-container transition-colors border border-outline-variant/50 group"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-surface-container-lowest flex items-center justify-center text-primary shadow-xs">
                  <BookOpen className="size-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-on-surface group-hover:text-primary transition-colors">
                    Degree Programs
                  </p>
                  <p className="text-xs text-on-surface-variant">Associate programs with departments</p>
                </div>
              </div>
              <ArrowUpRight className="size-4 text-on-surface-variant group-hover:text-primary transition-colors" />
            </Link>

            <Link
              href="/admin/sessions"
              className="flex items-center justify-between p-3.5 rounded-xl bg-surface-container-low hover:bg-surface-container transition-colors border border-outline-variant/50 group"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-surface-container-lowest flex items-center justify-center text-primary shadow-xs">
                  <Calendar className="size-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-on-surface group-hover:text-primary transition-colors">
                    Academic Sessions
                  </p>
                  <p className="text-xs text-on-surface-variant">Configure active SIWES academic year</p>
                </div>
              </div>
              <ArrowUpRight className="size-4 text-on-surface-variant group-hover:text-primary transition-colors" />
            </Link>

            <Link
              href="/admin/users"
              className="flex items-center justify-between p-3.5 rounded-xl bg-surface-container-low hover:bg-surface-container transition-colors border border-outline-variant/50 group"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-surface-container-lowest flex items-center justify-center text-primary shadow-xs">
                  <Users className="size-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-on-surface group-hover:text-primary transition-colors">
                    Staff & Provisioning
                  </p>
                  <p className="text-xs text-on-surface-variant">Dispatch invites to HODs and Supervisors</p>
                </div>
              </div>
              <ArrowUpRight className="size-4 text-on-surface-variant group-hover:text-primary transition-colors" />
            </Link>
          </div>
        </div>

        {/* Recently Created Departments */}
        <div className="lg:col-span-2 bg-surface-container-lowest border border-outline-variant rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-heading text-lg font-semibold text-on-surface">
                Registered Departments
              </h2>
              <p className="font-sans text-xs text-on-surface-variant">
                Recently added departments in the institutional registry.
              </p>
            </div>
            <Link
              href="/admin/departments"
              className="text-xs font-semibold text-primary hover:underline"
            >
              View all ({deptCount})
            </Link>
          </div>

          {recentDepartments.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-outline-variant rounded-xl">
              <Building2 className="size-8 text-on-surface-variant/40 mx-auto mb-2" />
              <p className="text-sm font-medium text-on-surface">No departments registered yet</p>
              <p className="text-xs text-on-surface-variant mt-1 mb-4">
                Get started by creating your first academic department.
              </p>
              <Link
                href="/admin/departments"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md bg-primary text-on-primary text-xs font-medium hover:bg-primary-container transition-colors"
              >
                <PlusCircle className="size-3.5" />
                <span>Create Department</span>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-outline-variant/60">
                    <th className="py-2.5 px-3 text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider font-heading">
                      Department Name
                    </th>
                    <th className="py-2.5 px-3 text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider font-heading">
                      Code
                    </th>
                    <th className="py-2.5 px-3 text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider font-heading">
                      Created Date
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/40">
                  {recentDepartments.map((dept) => (
                    <tr
                      key={dept.id}
                      className="hover:bg-surface-container-low transition-colors text-sm"
                    >
                      <td className="py-3 px-3 font-medium text-on-surface">
                        {dept.name}
                      </td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded-md bg-surface-container font-mono text-xs font-semibold text-primary">
                          {dept.code}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-xs text-on-surface-variant">
                        {new Date(dept.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
