"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { User, Mail, Lock, Building2, Loader2, ArrowRight } from "lucide-react";
import { authClient } from "@/lib/auth-client";

interface DepartmentOption {
  id: string;
  name: string;
  code: string;
}

interface RegisterFormProps {
  departments: DepartmentOption[];
}

export function RegisterForm({ departments }: RegisterFormProps) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!name.trim()) {
      setErrorMessage("Please enter your full name.");
      return;
    }
    if (!email.trim()) {
      setErrorMessage("Please enter your university email address.");
      return;
    }
    if (!password || password.length < 8) {
      setErrorMessage("Password must be at least 8 characters long.");
      return;
    }
    if (!departmentId) {
      setErrorMessage("Please select your academic department.");
      return;
    }

    setLoading(true);
    try {
      const res = await authClient.signUp.email({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        role: "student",
        departmentId,
      });

      if (res.error) {
        setErrorMessage(res.error.message || "Registration failed. Please verify your details.");
        setLoading(false);
        return;
      }

      // Registration automatically signs in and triggers student_profile creation
      router.push("/student");
      router.refresh();
    } catch (err: unknown) {
      console.error("[RegisterForm] Registration error:", err);
      setErrorMessage("An unexpected error occurred during registration. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary-fixed text-on-primary-fixed text-[11px] font-semibold tracking-wide font-heading uppercase mb-2">
          Student Self-Registration
        </div>
        <h2 className="font-heading text-2xl font-bold tracking-tight text-on-surface">
          Create student account
        </h2>
        <p className="font-sans text-sm text-on-surface-variant mt-1">
          Quick 4-step onboarding to begin logging your SIWES attachment
        </p>
      </div>

      {/* Error Banner */}
      {errorMessage && (
        <div className="p-3 mb-5 rounded-md bg-error-container text-on-error-container text-xs font-medium border border-error/20 flex items-start gap-2">
          <span>{errorMessage}</span>
        </div>
      )}

      {/* 4-Field Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Field 1: Full Name */}
        <div>
          <label
            htmlFor="name"
            className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant font-heading mb-1.5"
          >
            Full Name <span className="text-error">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-on-surface-variant">
              <User className="size-4" />
            </div>
            <input
              id="name"
              type="text"
              required
              placeholder="e.g. Oluwatobi Emmanuel Fadumila"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full h-10 pl-9 pr-3 text-sm rounded-md bg-surface-container-lowest border border-outline-variant text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
            />
          </div>
        </div>

        {/* Field 2: Email */}
        <div>
          <label
            htmlFor="reg-email"
            className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant font-heading mb-1.5"
          >
            Email Address <span className="text-error">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-on-surface-variant">
              <Mail className="size-4" />
            </div>
            <input
              id="reg-email"
              type="email"
              required
              autoComplete="email"
              placeholder="student@eksu.edu.ng"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full h-10 pl-9 pr-3 text-sm rounded-md bg-surface-container-lowest border border-outline-variant text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
            />
          </div>
        </div>

        {/* Field 3: Password */}
        <div>
          <label
            htmlFor="reg-password"
            className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant font-heading mb-1.5"
          >
            Password <span className="text-error">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-on-surface-variant">
              <Lock className="size-4" />
            </div>
            <input
              id="reg-password"
              type="password"
              required
              autoComplete="new-password"
              placeholder="Minimum 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full h-10 pl-9 pr-3 text-sm rounded-md bg-surface-container-lowest border border-outline-variant text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
            />
          </div>
        </div>

        {/* Field 4: Department Dropdown */}
        <div>
          <label
            htmlFor="department"
            className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant font-heading mb-1.5"
          >
            Department <span className="text-error">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-on-surface-variant">
              <Building2 className="size-4" />
            </div>
            <select
              id="department"
              required
              value={departmentId}
              onChange={(e) => setDepartmentId(e.target.value)}
              className="w-full h-10 pl-9 pr-8 text-sm rounded-md bg-surface-container-lowest border border-outline-variant text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all appearance-none cursor-pointer"
            >
              <option value="">Select your department...</option>
              {departments.map((dept) => (
                <option key={dept.id} value={dept.id}>
                  {dept.name} ({dept.code})
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-on-surface-variant text-xs">
              ▼
            </div>
          </div>
        </div>

        {/* Notice of additional profile fields */}
        <p className="text-[11px] text-on-surface-variant leading-relaxed pt-1">
          Your Matric Number, Program, Level, and Session details will be completed on your dashboard after registration.
        </p>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full mt-2 h-10 inline-flex items-center justify-center gap-2 bg-primary text-on-primary rounded-md text-sm font-medium hover:bg-primary-container active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none shadow-xs"
        >
          {loading ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              <span>Creating account...</span>
            </>
          ) : (
            <>
              <span>Complete Registration</span>
              <ArrowRight className="size-4" />
            </>
          )}
        </button>
      </form>

      {/* Footer link to Login */}
      <div className="mt-8 pt-6 border-t border-outline-variant/40 text-center">
        <p className="text-xs text-on-surface-variant">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-medium text-primary hover:underline"
          >
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
