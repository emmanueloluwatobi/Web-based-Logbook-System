import { Metadata } from "next";
import { AuthShell } from "@/components/auth/AuthShell";
import { IndustryLoginForm } from "@/components/auth/IndustryLoginForm";

export const metadata: Metadata = {
  title: "Industry Supervisor Login · ULS EKSU SIWES",
  description: "Passwordless sign-in for company supervisors and mentors.",
};

export default function IndustryLoginPage() {
  return (
    <AuthShell>
      <IndustryLoginForm />
    </AuthShell>
  );
}
