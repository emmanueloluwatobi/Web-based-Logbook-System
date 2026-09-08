"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Mail, Loader2, ArrowRight, CheckCircle2, Building, ArrowLeft } from "lucide-react";
import { authClient } from "@/lib/auth-client";

export function IndustryLoginForm() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email.trim()) {
      setErrorMessage("Please enter your email address.");
      return;
    }

    setLoading(true);
    try {
      const res = await authClient.signIn.magicLink({
        email: email.trim().toLowerCase(),
        callbackURL: "/industry",
      });

      if (res.error) {
        setErrorMessage(res.error.message || "Failed to send sign-in link. Please check your email.");
        setLoading(false);
        return;
      }

      setSent(true);
      setLoading(false);
    } catch (err: unknown) {
      console.error("[IndustryLoginForm] Magic link error:", err);
      setErrorMessage("An unexpected error occurred. Please try again.");
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="text-center py-4">
        <div className="w-12 h-12 rounded-full bg-success-container text-on-success-container flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="size-6" />
        </div>
        <h2 className="font-heading text-2xl font-bold tracking-tight text-on-surface mb-2">
          Check your email
        </h2>
        <p className="font-sans text-sm text-on-surface-variant max-w-sm mx-auto mb-6 leading-relaxed">
          We&apos;ve sent a secure, single-click sign-in link to{" "}
          <strong className="text-on-surface font-semibold">{email}</strong>.
        </p>
        <div className="p-4 rounded-xl bg-surface-container-low border border-outline-variant/60 text-xs text-on-surface-variant text-left mb-6 space-y-1.5">
          <p className="font-semibold text-on-surface">Next steps:</p>
          <p>1. Open your inbox and look for the email from ULS EKSU SIWES.</p>
          <p>2. Click &quot;Sign in to Industry Portal&quot; to securely authenticate.</p>
          <p className="text-[11px] opacity-75">The link expires in 15 minutes.</p>
        </div>
        <div className="space-y-3">
          <button
            type="button"
            onClick={() => {
              setSent(false);
              setEmail("");
            }}
            className="text-xs font-medium text-primary hover:underline block mx-auto"
          >
            Use a different email address
          </button>
          <div className="pt-4 border-t border-outline-variant/40">
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 text-xs text-on-surface-variant hover:text-on-surface"
            >
              <ArrowLeft className="size-3.5" />
              <span>Back to student & staff login</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-secondary-container text-on-secondary-container text-[11px] font-semibold tracking-wide font-heading uppercase mb-2">
          <Building className="size-3" />
          External Partner Portal
        </div>
        <h2 className="font-heading text-2xl font-bold tracking-tight text-on-surface">
          Industry Supervisor Access
        </h2>
        <p className="font-sans text-sm text-on-surface-variant mt-1">
          Passwordless entry — receive a magic sign-in link in your corporate email
        </p>
      </div>

      {/* Role Switcher Pill Bar */}
      <div className="flex items-center p-1 rounded-lg bg-surface-container-low border border-outline-variant/60 mb-6 text-xs font-medium">
        <Link
          href="/login"
          className="flex-1 py-1.5 text-center rounded-md text-on-surface-variant hover:text-on-surface transition-colors"
        >
          Student & Staff
        </Link>
        <span className="flex-1 py-1.5 text-center rounded-md bg-surface-container-lowest text-primary font-semibold shadow-xs flex items-center justify-center gap-1">
          <Building className="size-3" />
          Industry Supervisor
        </span>
      </div>

      {/* Error Message */}
      {errorMessage && (
        <div className="p-3 mb-5 rounded-md bg-error-container text-on-error-container text-xs font-medium border border-error/20 flex items-start gap-2">
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="industry-email"
            className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant font-heading mb-1.5"
          >
            Corporate / Official Email <span className="text-error">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-on-surface-variant">
              <Mail className="size-4" />
            </div>
            <input
              id="industry-email"
              type="email"
              required
              autoComplete="email"
              placeholder="supervisor@organization.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full h-10 pl-9 pr-3 text-sm rounded-md bg-surface-container-lowest border border-outline-variant text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
            />
          </div>
          <p className="text-[11px] text-on-surface-variant mt-1.5">
            Must match the email address registered on your student&apos;s SIWES placement record.
          </p>
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
              <span>Sending link...</span>
            </>
          ) : (
            <>
              <span>Send Magic Sign-in Link</span>
              <ArrowRight className="size-4" />
            </>
          )}
        </button>
      </form>

      {/* Footer Link */}
      <div className="mt-8 pt-6 border-t border-outline-variant/40 text-center">
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
        >
          <ArrowLeft className="size-3" />
          <span>Return to Password Login</span>
        </Link>
      </div>
    </div>
  );
}
