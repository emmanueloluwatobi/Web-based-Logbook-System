"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Lock, Loader2, ArrowRight, CheckCircle2, AlertCircle, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { setPasswordWithToken } from "@/actions/admin";

export function SetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!token) {
      setErrorMessage("No invitation token detected. Please open the link from your invitation email.");
      return;
    }

    if (password.length < 8) {
      setErrorMessage("Password must be at least 8 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match. Please re-enter.");
      return;
    }

    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.append("token", token);
        formData.append("password", password);

        const res = await setPasswordWithToken(formData);

        if (!res.success) {
          setErrorMessage(res.error || "Failed to set password.");
          toast.error(res.error || "Failed to set password");
          return;
        }

        setIsSuccess(true);
        toast.success("Password configured successfully!");
        setTimeout(() => {
          router.push("/login");
        }, 2000);
      } catch (err) {
        console.error("[SetPasswordForm] Error:", err);
        setErrorMessage("An unexpected error occurred. Please try again.");
      }
    });
  };

  if (!token) {
    return (
      <div className="space-y-6">
        <div className="w-12 h-12 rounded-xl bg-error-container text-on-error-container flex items-center justify-center mb-2">
          <AlertCircle className="size-6 text-error" />
        </div>
        <div>
          <h2 className="font-heading text-2xl font-bold tracking-tight text-on-surface">
            Invalid Link
          </h2>
          <p className="font-sans text-sm text-on-surface-variant mt-2">
            No invitation token was found in the URL. Please ensure you clicked the complete link sent to your institutional email.
          </p>
        </div>
        <div className="pt-2">
          <Link
            href="/login"
            className="inline-flex items-center justify-center gap-2 w-full h-10 bg-primary text-on-primary rounded-md text-sm font-medium hover:bg-primary-container transition-all"
          >
            <span>Go to Sign In</span>
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="space-y-6 text-center py-4">
        <div className="w-14 h-14 rounded-2xl bg-success-container text-on-success-container flex items-center justify-center mx-auto mb-4 animate-in zoom-in-95 duration-200">
          <CheckCircle2 className="size-8 text-success" />
        </div>
        <div>
          <h2 className="font-heading text-2xl font-bold tracking-tight text-on-surface">
            Password Activated!
          </h2>
          <p className="font-sans text-sm text-on-surface-variant mt-2">
            Your staff credentials have been saved. Redirecting to the sign in portal...
          </p>
        </div>
        <div className="pt-4">
          <Link
            href="/login"
            className="inline-flex items-center justify-center gap-2 w-full h-10 bg-primary text-on-primary rounded-md text-sm font-medium hover:bg-primary-container transition-all"
          >
            <span>Proceed to Login</span>
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary-fixed text-on-primary-fixed text-[11px] font-semibold tracking-wide font-heading uppercase mb-3">
          <ShieldCheck className="size-3.5" />
          <span>Staff Account Activation</span>
        </div>
        <h2 className="font-heading text-2xl font-bold tracking-tight text-on-surface">
          Set Your Password
        </h2>
        <p className="font-sans text-sm text-on-surface-variant mt-1">
          Create a secure password to activate your Ekiti State University SIWES portal account.
        </p>
      </div>

      {/* Error Banner */}
      {errorMessage && (
        <div className="p-3.5 rounded-lg bg-error-container/40 border border-error/30 text-xs text-on-error-container flex items-start gap-2.5">
          <AlertCircle className="size-4 shrink-0 text-error mt-0.5" />
          <div className="leading-relaxed">{errorMessage}</div>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="password"
            className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant font-heading mb-1.5"
          >
            New Password *
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-on-surface-variant">
              <Lock className="size-4" />
            </div>
            <input
              id="password"
              type="password"
              required
              minLength={8}
              placeholder="Minimum 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full h-10 pl-9 pr-3 text-sm rounded-md bg-surface-container-lowest border border-outline-variant text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="confirmPassword"
            className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant font-heading mb-1.5"
          >
            Confirm Password *
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-on-surface-variant">
              <Lock className="size-4" />
            </div>
            <input
              id="confirmPassword"
              type="password"
              required
              minLength={8}
              placeholder="Re-type password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full h-10 pl-9 pr-3 text-sm rounded-md bg-surface-container-lowest border border-outline-variant text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
            />
          </div>
        </div>

        <div className="text-[11px] text-on-surface-variant leading-relaxed p-3 rounded-lg bg-surface-container-low border border-outline-variant/60">
          Must be at least 8 characters. We recommend a combination of letters, numbers, and symbols.
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="w-full mt-2 h-10 inline-flex items-center justify-center gap-2 bg-primary text-on-primary rounded-md text-sm font-medium hover:bg-primary-container active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none shadow-xs"
        >
          {isPending ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              <span>Activating Account...</span>
            </>
          ) : (
            <>
              <span>Activate Account</span>
              <ArrowRight className="size-4" />
            </>
          )}
        </button>
      </form>

      {/* Footer Link */}
      <div className="text-center pt-2">
        <Link
          href="/login"
          className="text-xs text-on-surface-variant hover:text-primary transition-colors"
        >
          Already have an active account? Sign In
        </Link>
      </div>
    </div>
  );
}
