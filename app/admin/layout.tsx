import React from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { AdminNavbar } from "@/components/admin/AdminNavbar";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || session.user.role !== "admin") {
    redirect("/login");
  }

  return (
    <div className="min-h-screen flex flex-col bg-surface text-on-surface">
      <AdminNavbar
        userName={session.user.name}
        userEmail={session.user.email}
      />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-8 py-8 flex flex-col gap-6">
        {children}
      </main>
    </div>
  );
}
