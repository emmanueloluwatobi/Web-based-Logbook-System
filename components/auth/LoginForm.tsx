"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Mail, Lock, Loader2, ArrowRight, Building } from "lucide-react";
import { authClient } from "@/lib/auth-client";

const ROLE_REDIRECT_MAP: Record<string, string> = {
  student: "/student",
  school_supervisor: "/supervisor",
  hod: "/hod",
  admin: "/admin",
  industry_supervisor: "/industry",
};

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [forgotPasswordNotice, setForgotPasswordNotice] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setForgotPasswordNotice(false);

    if (!email || !password) {
      setErrorMessage("Please enter both email and password.");
      return;
    }

    setLoading(true);
    try {
      const res = await authClient.signIn.email({
        email,
        password,
        rememberMe,
      });

      if (res.error) {
        setErrorMessage(res.error.message || "Invalid email or password.");
        setLoading(false);
        return;
      }

      // Check session to determine role redirect
      const session = await authClient.getSession();
      const userRole = (session?.data?.user as { role?: string })?.role || "student";
      const targetPath = ROLE_REDIRECT_MAP[userRole] || "/student";

      router.push(targetPath);
      router.refresh();
    } catch (err: unknown) {
      console.error("[LoginForm] Sign in error:", err);
      setErrorMessage("An unexpected error occurred during sign in. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h2 className="font-heading text-2xl font-bold tracking-tight text-on-surface">
          Welcome back
        </h2>
        <p className="font-sans text-sm text-on-surface-variant mt-1">
          Sign in to your university logbook account
        </p>
      </div>

      {/* Role Switcher Pill Bar */}
      <div className="flex items-center p-1 rounded-lg bg-surface-container-low border border-outline-variant/60 mb-6 text-xs font-medium">
        <span className="flex-1 py-1.5 text-center rounded-md bg-surface-container-lowest text-primary font-semibold shadow-xs">
          Student & Staff
        </span>
        <Link
          href="/login/industry"
          className="flex-1 py-1.5 text-center rounded-md text-on-surface-variant hover:text-on-surface transition-colors flex items-center justify-center gap-1"
        >
          <Building className="size-3" />
          Industry Supervisor
        </Link>
      </div>

      {/* Error Message */}
      {errorMessage && (
        <div className="p-3 mb-5 rounded-md bg-error-container text-on-error-container text-xs font-medium border border-error/20 flex items-start gap-2">
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Forgot Password Notice */}
      {forgotPasswordNotice && (
        <div className="p-3 mb-5 rounded-md bg-surface-container text-on-surface-variant text-xs border border-outline-variant/50">
          Password resets are managed by your Department Coordinator or the Directorate of SIWES. Please contact your HOD or SIWES unit to request a credential reset.
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Email Field */}
        <div>
          <label
            htmlFor="email"
            className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant font-heading mb-1.5"
          >
            Email Address <span className="text-error">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-on-surface-variant">
              <Mail className="size-4" />
            </div>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              placeholder="e.g. matric@eksu.edu.ng"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full h-10 pl-9 pr-3 text-sm rounded-md bg-surface-container-lowest border border-outline-variant text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
            />
          </div>
        </div>

        {/* Password Field */}
        <div>
          <label
            htmlFor="password"
            className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant font-heading mb-1.5"
          >
            Password <span className="text-error">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-on-surface-variant">
              <Lock className="size-4" />
            </div>
            <input
              id="password"
              type="password"
              required
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full h-10 pl-9 pr-3 text-sm rounded-md bg-surface-container-lowest border border-outline-variant text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
            />
          </div>
        </div>

        {/* Remember me & Forgot password */}
        <div className="flex items-center justify-between pt-1">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="rounded border-outline-variant text-primary focus:ring-primary size-4"
            />
            <span className="text-xs text-on-surface-variant">Remember me</span>
          </label>
          <button
            type="button"
            onClick={() => setForgotPasswordNotice(!forgotPasswordNotice)}
            className="text-xs font-medium text-primary hover:underline"
          >
            Forgot password?
          </button>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full mt-2 h-10 inline-flex items-center justify-center gap-2 bg-primary text-on-primary rounded-md text-sm font-medium hover:bg-primary-container active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none shadow-xs"
        >
          {loading ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              <span>Signing in...</span>
            </>
          ) : (
            <>
              <span>Sign in</span>
              <ArrowRight className="size-4" />
            </>
          )}
        </button>
      </form>

      {/* Footer link to Register */}
      <div className="mt-8 pt-6 border-t border-outline-variant/40 text-center">
        <p className="text-xs text-on-surface-variant">
          Don&apos;t have an account?{" "}
          <Link
            href="/register"
            className="font-medium text-primary hover:underline inline-flex items-center gap-1"
          >
            Student Sign Up
          </Link>
        </p>
      </div>
    </div>
  );
}
