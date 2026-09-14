"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Mail,
  Loader2,
  ArrowRight,
  CheckCircle2,
  Building,
  ArrowLeft,
  KeyRound,
  RefreshCw,
} from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";

export function IndustryLoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [step, setStep] = useState<"request" | "verify">("request");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      setErrorMessage("Please enter your corporate email address.");
      return;
    }

    setLoading(true);
    try {
      // Send both OTP code and Magic Link for maximum user convenience
      const [otpRes, magicRes] = await Promise.allSettled([
        authClient.emailOtp.sendVerificationOtp({
          email: cleanEmail,
          type: "sign-in",
        }),
        authClient.signIn.magicLink({
          email: cleanEmail,
          callbackURL: "/industry",
        }),
      ]);

      const isOtpSuccess = otpRes.status === "fulfilled" && !otpRes.value.error;
      const isMagicSuccess = magicRes.status === "fulfilled" && !magicRes.value.error;

      if (!isOtpSuccess && !isMagicSuccess) {
        const errorText =
          (otpRes.status === "fulfilled" && otpRes.value.error?.message) ||
          (magicRes.status === "fulfilled" && magicRes.value.error?.message) ||
          "Failed to dispatch sign-in code. Please verify your email.";
        setErrorMessage(errorText);
        setLoading(false);
        return;
      }

      setStep("verify");
      setLoading(false);
      toast.success("Verification code sent to your email.");
    } catch (err: unknown) {
      console.error("[IndustryLoginForm] Dispatch error:", err);
      setErrorMessage("An unexpected error occurred. Please try again.");
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanOtp = otp.trim();
    if (!cleanOtp || cleanOtp.length < 6) {
      setErrorMessage("Please enter the complete 6-digit verification code.");
      return;
    }

    setVerifying(true);
    try {
      const res = await authClient.signIn.emailOtp({
        email: email.trim().toLowerCase(),
        otp: cleanOtp,
      });

      if (res.error) {
        setErrorMessage(res.error.message || "Invalid or expired verification code.");
        setVerifying(false);
        return;
      }

      toast.success("Signed in successfully. Welcome to the Industry Portal!");
      router.push("/industry");
    } catch (err: unknown) {
      console.error("[IndustryLoginForm] Verification error:", err);
      setErrorMessage("Failed to verify code. Please try again.");
      setVerifying(false);
    }
  };

  if (step === "verify") {
    return (
      <div className="py-2">
        <div className="w-12 h-12 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center mx-auto mb-4">
          <KeyRound className="size-6" />
        </div>
        <div className="text-center mb-6">
          <h2 className="font-heading text-2xl font-bold tracking-tight text-on-surface">
            Enter Verification Code
          </h2>
          <p className="font-sans text-xs text-on-surface-variant max-w-xs mx-auto mt-1 leading-relaxed">
            We sent a 6-digit code and a one-click sign-in link to{" "}
            <strong className="text-on-surface font-semibold">{email}</strong>.
          </p>
        </div>

        {errorMessage && (
          <div className="p-3 mb-4 rounded-md bg-error-container text-on-error-container text-xs font-medium border border-error/20">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleVerifyOtp} className="space-y-4">
          <div>
            <label
              htmlFor="otp-code"
              className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant font-heading mb-1.5 text-center"
            >
              6-Digit Access Code
            </label>
            <input
              id="otp-code"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              autoFocus
              required
              placeholder="123456"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
              className="w-full h-12 text-center text-2xl tracking-[0.4em] font-mono font-bold rounded-lg bg-surface-container-lowest border border-outline-variant text-on-surface placeholder:text-on-surface-variant/30 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
            />
            <p className="text-[11px] text-on-surface-variant/70 text-center mt-1.5">
              Code expires in 15 minutes.
            </p>
          </div>

          <button
            type="submit"
            disabled={verifying || otp.length < 6}
            className="w-full h-10 inline-flex items-center justify-center gap-2 bg-primary text-on-primary rounded-md text-sm font-medium hover:bg-primary-container active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none shadow-xs"
          >
            {verifying ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                <span>Verifying...</span>
              </>
            ) : (
              <>
                <span>Verify & Sign In</span>
                <ArrowRight className="size-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-5 p-3.5 rounded-xl bg-surface-container-low border border-outline-variant/60 text-xs text-on-surface-variant text-center space-y-1">
          <p className="font-semibold text-on-surface">Alternatively:</p>
          <p>You can also simply click the &quot;Sign In Securely&quot; button in the email sent to your inbox.</p>
        </div>

        <div className="mt-6 flex items-center justify-between text-xs text-on-surface-variant pt-4 border-t border-outline-variant/40">
          <button
            type="button"
            onClick={() => {
              setStep("request");
              setOtp("");
              setErrorMessage(null);
            }}
            className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
          >
            <ArrowLeft className="size-3" />
            <span>Use different email</span>
          </button>

          <button
            type="button"
            disabled={loading}
            onClick={handleRequestOtp}
            className="inline-flex items-center gap-1 font-medium text-on-surface-variant hover:text-on-surface transition-colors"
          >
            <RefreshCw className={`size-3 ${loading ? "animate-spin" : ""}`} />
            <span>Resend code</span>
          </button>
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
          Passwordless sign-in — enter your corporate email to receive a single-use code & magic link.
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
      <form onSubmit={handleRequestOtp} className="space-y-4">
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
              <span>Sending verification code...</span>
            </>
          ) : (
            <>
              <span>Send Access Code & Link</span>
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
          <span>Return to Student & Staff Password Login</span>
        </Link>
      </div>
    </div>
  );
}

