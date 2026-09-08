import { Metadata } from "next";
import { db } from "@/lib/db";
import { department } from "@/db/schema";
import { AuthShell } from "@/components/auth/AuthShell";
import { RegisterForm } from "@/components/auth/RegisterForm";

export const metadata: Metadata = {
  title: "Student Registration · ULS EKSU SIWES",
  description: "Register for your Ekiti State University SIWES logbook account.",
};

export default async function RegisterPage() {
  const departments = await db
    .select({
      id: department.id,
      name: department.name,
      code: department.code,
    })
    .from(department)
    .orderBy(department.name);

  return (
    <AuthShell>
      <RegisterForm departments={departments} />
    </AuthShell>
  );
}
