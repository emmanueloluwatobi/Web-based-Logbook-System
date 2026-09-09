"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Building2,
  Calendar,
  Clock,
  Briefcase,
  MapPin,
  UserCheck,
  Building,
  ArrowRight,
  ShieldAlert,
  Send,
  Loader2,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { submitStudentPlacement } from "@/actions/placement";

export interface OrganizationItem {
  id: string;
  name: string;
  address: string;
  stateRegion: string;
  industryType: string;
}

export interface PlacementDetails {
  id: string;
  status: "pending" | "active" | "completed";
  placementSource: "self_secured" | "department_assigned";
  startDate: string;
  endDate: string;
  targetDays: number;
  organization: OrganizationItem;
  schoolSupervisor: {
    id: string;
    name: string | null;
    email: string | null;
  } | null;
}

export interface StudentPlacementViewProps {
  placement: PlacementDetails | null;
  organizations: OrganizationItem[];
  studentName?: string;
  matricNumber?: string | null;
}

const COMMON_INDUSTRIES = [
  "Software & Information Technology",
  "Telecommunications & Networks",
  "Banking & Financial Services",
  "Oil & Gas / Energy",
  "Manufacturing & FMCG",
  "Civil & Construction Engineering",
  "Healthcare & Pharmaceuticals",
  "Electrical & Electronic Systems",
  "Agriculture & Food Technology",
  "Public Sector & Research",
  "Other Industry Sector",
];

export function StudentPlacementView({
  placement,
  organizations,
  studentName = "Student",
  matricNumber,
}: StudentPlacementViewProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Registration form mode: "directory" vs "new"
  const [selectionMode, setSelectionMode] = useState<"directory" | "new">(
    organizations.length > 0 ? "directory" : "new"
  );
  const [selectedOrgId, setSelectedOrgId] = useState<string>(
    organizations[0]?.id || ""
  );

  // New Organization Fields
  const [newOrgName, setNewOrgName] = useState("");
  const [newOrgIndustry, setNewOrgIndustry] = useState(COMMON_INDUSTRIES[0]);
  const [newOrgAddress, setNewOrgAddress] = useState("");
  const [newOrgState, setNewOrgState] = useState("Lagos");

  // Dates
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [targetDays, setTargetDays] = useState("60");

  const selectedDirectoryOrg = organizations.find((o) => o.id === selectedOrgId);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!startDate || !endDate) {
      toast.error("Please provide both training start and end dates.");
      return;
    }

    const startYear = new Date(startDate).getFullYear();
    const endYear = new Date(endDate).getFullYear();
    if (isNaN(startYear) || isNaN(endYear) || startYear < 2020 || startYear > 2040 || endYear < 2020 || endYear > 2040) {
      toast.error("Please provide valid calendar dates with years between 2020 and 2040.");
      return;
    }

    if (new Date(endDate) <= new Date(startDate)) {
      toast.error("Training end date must be strictly after the start date.");
      return;
    }

    const formData = new FormData();
    formData.append("startDate", startDate);
    formData.append("endDate", endDate);
    formData.append("targetDays", targetDays || "60");

    if (selectionMode === "directory") {
      if (!selectedOrgId) {
        toast.error("Please choose an organization from the directory.");
        return;
      }
      formData.append("organizationId", selectedOrgId);
      formData.append("isNewOrg", "false");
    } else {
      if (!newOrgName.trim() || !newOrgAddress.trim() || !newOrgState.trim()) {
        toast.error("Please fill in all organization details.");
        return;
      }
      formData.append("isNewOrg", "true");
      formData.append("orgName", newOrgName.trim());
      formData.append("orgIndustryType", newOrgIndustry);
      formData.append("orgAddress", newOrgAddress.trim());
      formData.append("orgStateRegion", newOrgState.trim());
    }

    startTransition(async () => {
      const res = await submitStudentPlacement(formData);
      if (!res.success) {
        toast.error(res.error || "Failed to submit placement registration.");
      } else {
        toast.success("Placement successfully registered! Awaiting department approval.");
        router.refresh();
      }
    });
  };

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto w-full">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-xs text-on-surface-variant font-medium">
        <Link href="/student" className="hover:text-primary transition-colors">
          Dashboard
        </Link>
        <span>/</span>
        <span className="text-on-surface font-semibold">My Placement</span>
      </div>

      {/* State 1: Active or Completed Placement */}
      {placement && placement.status !== "pending" && (
        <div className="flex flex-col gap-6">
          {/* Main Verified Placement Card */}
          <div className="bg-primary text-on-primary border border-primary rounded-2xl p-6 sm:p-8 relative overflow-hidden shadow-sm">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,var(--color-primary-container),transparent_65%)] opacity-35 pointer-events-none" />
            <div className="absolute -bottom-16 -right-16 w-64 h-64 rounded-full bg-primary-container/25 blur-2xl pointer-events-none" />

            {/* Top row badges */}
            <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 mb-5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-surface-container-lowest/15 flex items-center justify-center text-on-primary">
                  <Building2 className="size-4" />
                </div>
                <span className="text-xs font-semibold uppercase tracking-wider font-heading text-on-primary-container">
                  {placement.placementSource === "self_secured"
                    ? "Self-Secured Placement"
                    : "Department-Assigned Placement"}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-container-lowest/20 border border-white/20 text-xs font-semibold tracking-wide text-on-primary">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="capitalize">{placement.status}</span>
                </span>
              </div>
            </div>

            {/* Organization Info */}
            <div className="relative z-10 my-2">
              <h2 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-on-primary">
                {placement.organization.name}
              </h2>
              <p className="font-sans text-sm text-on-primary-container flex items-center gap-1.5 mt-1 font-medium">
                <Briefcase className="size-4 shrink-0 opacity-80" />
                <span>{placement.organization.industryType}</span>
              </p>

              <div className="flex flex-wrap items-center gap-y-2 gap-x-5 text-xs text-on-primary-container mt-4">
                <div className="flex items-center gap-1.5">
                  <Calendar className="size-3.5 opacity-80" />
                  <span>
                    {placement.startDate} – {placement.endDate} ({placement.targetDays} Target Days)
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <MapPin className="size-3.5 opacity-80" />
                  <span>
                    {placement.organization.address}, {placement.organization.stateRegion}
                  </span>
                </div>
              </div>
            </div>

            {/* Supervisor & Logbook Links */}
            <div className="relative z-10 pt-6 mt-6 border-t border-white/15 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-3.5 rounded-xl bg-surface-container-lowest/10 border border-white/10">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-on-primary-container font-heading">
                  Academic School Supervisor
                </p>
                <div className="mt-1 flex items-center gap-2 text-on-primary">
                  <UserCheck className="size-4 shrink-0 text-emerald-300" />
                  <div>
                    <p className="text-sm font-semibold leading-tight">
                      {placement.schoolSupervisor?.name || "Dr. Assigned Supervisor"}
                    </p>
                    <p className="text-[11px] text-on-primary-container opacity-85 leading-tight">
                      {placement.schoolSupervisor?.email || "supervisor@eksu.edu.ng"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-surface-container-lowest/10 border border-white/10 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-on-primary-container font-heading">
                    SIWES Daily Logbook
                  </p>
                  <p className="text-xs text-on-primary-container mt-0.5">
                    Entries active & supervised
                  </p>
                </div>
                <Link
                  href="/student/logbook"
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-surface-container-lowest text-primary text-xs font-semibold hover:bg-surface-container-lowest/90 transition-all shadow-xs"
                >
                  <span>Go to Logbook</span>
                  <ArrowRight className="size-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* State 2: Pending Approval Placement */}
      {placement && placement.status === "pending" && (
        <div className="flex flex-col gap-6">
          {/* Pending Alert Banner */}
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-6 sm:p-7 relative overflow-hidden">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
                <Clock className="size-5 animate-pulse" />
              </div>
              <div className="space-y-1.5 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 text-[11px] font-bold font-heading uppercase tracking-wide">
                    Awaiting Department Approval
                  </span>
                  <span className="text-xs text-on-surface-variant font-medium">
                    Self-Secured SIWES Placement
                  </span>
                </div>
                <h2 className="font-heading text-xl sm:text-2xl font-bold text-on-surface tracking-tight">
                  Placement Submitted for Verification
                </h2>
                <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed">
                  Your placement at <strong className="text-on-surface">{placement.organization.name}</strong> has been registered. Your Department SIWES Coordinator will verify your placement details and allocate your academic School Supervisor shortly.
                </p>
              </div>
            </div>
          </div>

          {/* Submitted Placement Summary Card */}
          <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-6 sm:p-7 shadow-xs">
            <div className="flex items-center justify-between pb-4 border-b border-outline-variant">
              <div>
                <h3 className="font-heading text-lg font-bold text-on-surface">
                  Submitted Placement Details
                </h3>
                <p className="text-xs text-on-surface-variant">
                  Current details pending administrative review
                </p>
              </div>
              <span className="px-3 py-1 rounded-full bg-surface-container-high text-on-surface text-xs font-semibold">
                Pending Verification
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-5">
              <div className="space-y-4">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant font-heading">
                    Organization Name
                  </p>
                  <p className="text-base font-bold text-on-surface mt-0.5">
                    {placement.organization.name}
                  </p>
                </div>

                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant font-heading">
                    Industry Sector
                  </p>
                  <p className="text-xs font-medium text-on-surface mt-0.5">
                    {placement.organization.industryType}
                  </p>
                </div>

                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant font-heading">
                    Training Location / Address
                  </p>
                  <p className="text-xs font-medium text-on-surface mt-0.5 leading-relaxed">
                    {placement.organization.address}, {placement.organization.stateRegion}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant font-heading">
                    Training Duration
                  </p>
                  <p className="text-xs font-medium text-on-surface mt-0.5">
                    {placement.startDate} to {placement.endDate} ({placement.targetDays} Required Days)
                  </p>
                </div>

                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant font-heading">
                    Academic School Supervisor
                  </p>
                  <div className="inline-flex items-center gap-1.5 mt-1 px-2.5 py-1 rounded-md bg-amber-500/10 text-amber-700 dark:text-amber-300 text-xs font-medium">
                    <Clock className="size-3.5" />
                    <span>To be assigned by HOD upon approval</span>
                  </div>
                </div>

                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant font-heading">
                    Registered Student
                  </p>
                  <p className="text-xs font-medium text-on-surface mt-0.5">
                    {studentName} <span className="font-mono text-on-surface-variant">({matricNumber || "No Matric"})</span>
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-5 border-t border-outline-variant flex items-center justify-between text-xs text-on-surface-variant">
              <span>Need to change organization details before review? Contact your Department HOD.</span>
              <Link
                href="/student"
                className="font-medium text-primary hover:underline inline-flex items-center gap-1"
              >
                <span>Return to Dashboard</span>
                <ArrowRight className="size-3.5" />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* State 3: Unregistered (No Placement Exists Yet) */}
      {!placement && (
        <div className="flex flex-col gap-6">
          {/* Header Banner */}
          <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-6 sm:p-8 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold font-heading mb-2">
                  <Sparkles className="size-3.5" />
                  <span>SIWES Placement Registration</span>
                </div>
                <h1 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-on-surface">
                  Register Your Training Establishment
                </h1>
                <p className="text-xs sm:text-sm text-on-surface-variant mt-1.5 max-w-2xl leading-relaxed">
                  As part of the EKSU SIWES criteria, every student must register the verified company or establishment where they will undertake their practical training. Select an existing approved company or register a new one.
                </p>
              </div>

              <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <Briefcase className="size-6" />
              </div>
            </div>
          </div>

          {/* Registration Form Card */}
          <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-6 sm:p-8 shadow-xs">
            {/* Mode Selector Tabs */}
            <div className="flex items-center gap-2 p-1 bg-surface-container-low rounded-xl mb-6 max-w-md">
              <button
                type="button"
                onClick={() => setSelectionMode("directory")}
                className={`flex-1 py-2 px-3 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                  selectionMode === "directory"
                    ? "bg-surface-container-lowest text-primary shadow-xs"
                    : "text-on-surface-variant hover:text-on-surface"
                }`}
              >
                <Building className="size-3.5" />
                <span>Select from Directory ({organizations.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectionMode("new")}
                className={`flex-1 py-2 px-3 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                  selectionMode === "new"
                    ? "bg-surface-container-lowest text-primary shadow-xs"
                    : "text-on-surface-variant hover:text-on-surface"
                }`}
              >
                <Building2 className="size-3.5" />
                <span>Register New Company</span>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Directory Mode */}
              {selectionMode === "directory" && (
                <div className="space-y-4">
                  <div>
                    <label
                      htmlFor="directory-org"
                      className="block text-xs font-semibold font-heading text-on-surface mb-1.5"
                    >
                      Choose Registered Organization
                    </label>
                    {organizations.length > 0 ? (
                      <select
                        id="directory-org"
                        value={selectedOrgId}
                        onChange={(e) => setSelectedOrgId(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-outline-variant bg-surface-container-lowest text-on-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                      >
                        {organizations.map((org) => (
                          <option key={org.id} value={org.id}>
                            {org.name} — {org.industryType} ({org.stateRegion})
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div className="p-4 rounded-xl bg-surface-container-low border border-outline-variant text-center text-xs text-on-surface-variant">
                        No organizations currently registered in the university directory. Switch to &ldquo;Register New Company&rdquo;.
                      </div>
                    )}
                  </div>

                  {/* Selected Org Preview */}
                  {selectedDirectoryOrg && (
                    <div className="p-4 rounded-xl bg-surface-container-low border border-outline-variant/60 text-xs space-y-1">
                      <p className="font-semibold text-on-surface flex items-center gap-1.5">
                        <Building2 className="size-3.5 text-primary" />
                        <span>{selectedDirectoryOrg.name}</span>
                      </p>
                      <p className="text-on-surface-variant flex items-center gap-1.5">
                        <Briefcase className="size-3.5 opacity-70" />
                        <span>Sector: {selectedDirectoryOrg.industryType}</span>
                      </p>
                      <p className="text-on-surface-variant flex items-center gap-1.5">
                        <MapPin className="size-3.5 opacity-70" />
                        <span>
                          {selectedDirectoryOrg.address}, {selectedDirectoryOrg.stateRegion}
                        </span>
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* New Org Mode */}
              {selectionMode === "new" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label
                      htmlFor="org-name"
                      className="block text-xs font-semibold font-heading text-on-surface mb-1.5"
                    >
                      Company / Organization Name <span className="text-error">*</span>
                    </label>
                    <input
                      id="org-name"
                      type="text"
                      required
                      value={newOrgName}
                      onChange={(e) => setNewOrgName(e.target.value)}
                      placeholder="e.g. Chevron Nigeria Limited or First Bank Plc"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-outline-variant bg-surface-container-lowest text-on-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="org-industry"
                      className="block text-xs font-semibold font-heading text-on-surface mb-1.5"
                    >
                      Industry Sector <span className="text-error">*</span>
                    </label>
                    <select
                      id="org-industry"
                      value={newOrgIndustry}
                      onChange={(e) => setNewOrgIndustry(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-outline-variant bg-surface-container-lowest text-on-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    >
                      {COMMON_INDUSTRIES.map((ind) => (
                        <option key={ind} value={ind}>
                          {ind}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="org-state"
                      className="block text-xs font-semibold font-heading text-on-surface mb-1.5"
                    >
                      State / Region <span className="text-error">*</span>
                    </label>
                    <input
                      id="org-state"
                      type="text"
                      required
                      value={newOrgState}
                      onChange={(e) => setNewOrgState(e.target.value)}
                      placeholder="e.g. Ekiti, Lagos, Ondo, Abuja FCT"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-outline-variant bg-surface-container-lowest text-on-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label
                      htmlFor="org-address"
                      className="block text-xs font-semibold font-heading text-on-surface mb-1.5"
                    >
                      Physical Office Address <span className="text-error">*</span>
                    </label>
                    <textarea
                      id="org-address"
                      required
                      rows={2}
                      value={newOrgAddress}
                      onChange={(e) => setNewOrgAddress(e.target.value)}
                      placeholder="e.g. Plot 14, Commercial Avenue, Ikeja Industrial Zone"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-outline-variant bg-surface-container-lowest text-on-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none"
                    />
                  </div>
                </div>
              )}

              {/* Training Duration & Target Days */}
              <div className="pt-4 border-t border-outline-variant">
                <h3 className="font-heading text-sm font-bold text-on-surface mb-3 flex items-center gap-1.5">
                  <Calendar className="size-4 text-primary" />
                  <span>SIWES Training Duration</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label
                      htmlFor="start-date"
                      className="block text-xs font-semibold font-heading text-on-surface mb-1.5"
                    >
                      Training Start Date <span className="text-error">*</span>
                    </label>
                    <input
                      id="start-date"
                      type="date"
                      required
                      min="2020-01-01"
                      max="2035-12-31"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-outline-variant bg-surface-container-lowest text-on-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="end-date"
                      className="block text-xs font-semibold font-heading text-on-surface mb-1.5"
                    >
                      Training End Date <span className="text-error">*</span>
                    </label>
                    <input
                      id="end-date"
                      type="date"
                      required
                      min="2020-01-01"
                      max="2035-12-31"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-outline-variant bg-surface-container-lowest text-on-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="target-days"
                      className="block text-xs font-semibold font-heading text-on-surface mb-1.5"
                    >
                      Target Working Days
                    </label>
                    <input
                      id="target-days"
                      type="number"
                      min={10}
                      max={180}
                      value={targetDays}
                      onChange={(e) => setTargetDays(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-outline-variant bg-surface-container-lowest text-on-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    />
                    <span className="text-[10px] text-on-surface-variant mt-1 block">
                      Standard SIWES duration is 60 working days
                    </span>
                  </div>
                </div>
              </div>

              {/* Policy note & Submit Action */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-xs text-on-surface-variant flex items-center gap-2">
                  <ShieldAlert className="size-4 text-primary shrink-0" />
                  <span>
                    Your placement will be submitted to the department for supervisor assignment.
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={isPending}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-on-primary text-sm font-semibold hover:bg-primary-container active:scale-[0.98] transition-all shadow-xs disabled:opacity-50"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <>
                      <Send className="size-4" />
                      <span>Submit Placement Registration</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
