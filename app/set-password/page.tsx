import React, { Suspense } from "react";
import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/AuthShell";
import { SetPasswordForm } from "@/components/auth/SetPasswordForm";
import { Loader2 } from "lucide-react";

export const metadata: Metadata = {
  title: "Set Your Password — ULS EKSU SIWES",
  description: "Set your account password to access the Ekiti State University SIWES Logbook System.",
};

export default function SetPasswordPage() {
  return (
    <AuthShell>
      <Suspense
        fallback={
          <div className="flex items-center justify-center p-12">
            <Loader2 className="size-6 animate-spin text-primary" />
          </div>
        }
      >
        <SetPasswordForm />
      </Suspense>
    </AuthShell>
  );
}
