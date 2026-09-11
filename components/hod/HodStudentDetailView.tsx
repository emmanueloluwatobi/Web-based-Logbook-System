"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  GraduationCap,
  Building2,
  UserCheck,
  UserX,
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Briefcase,
  Mail,
  Phone,
  Edit3,
  Plus,
  Loader2,
  Save,
  X,
} from "lucide-react";
import { toast } from "sonner";
import {
  assignSupervisor,
  createDepartmentPlacement,
  updatePlacement,
} from "@/actions/placement";

export interface StudentProfileData {
  id: string;
  userId: string;
  name: string;
  email: string;
  matricNumber: string | null;
  programName: string | null;
  level: string | null;
  phone: string | null;
  departmentName: string;
  isProfileComplete: boolean;
}

export interface StudentPlacementData {
  id: string;
  organizationId: string;
  organizationName: string;
  organizationAddress: string;
  organizationStateRegion: string;
  organizationIndustryType: string;
  schoolSupervisorId: string | null;
  supervisorName: string | null;
  supervisorEmail: string | null;
  startDate: string;
  endDate: string;
  targetDays: number;
  status: "pending" | "active" | "completed";
  placementSource: string;
  createdAt: string;
}

export interface DepartmentSupervisorOption {
  id: string;
  name: string;
  email: string;
}

export interface OrganizationOption {
  id: string;
  name: string;
  address: string;
  stateRegion: string;
  industryType: string;
}

interface HodStudentDetailViewProps {
  student: StudentProfileData;
  placement: StudentPlacementData | null;
  departmentSupervisors: DepartmentSupervisorOption[];
  organizations: OrganizationOption[];
}

export function HodStudentDetailView({
  student,
  placement,
  departmentSupervisors,
  organizations,
}: HodStudentDetailViewProps) {
  const router = useRouter();

  // Supervisor assignment state
  const [selectedSupervisorId, setSelectedSupervisorId] = useState(
    placement?.schoolSupervisorId || (departmentSupervisors[0]?.id ?? "")
  );
  const [isAssigningSupervisor, startAssignSupervisor] = useTransition();

  // Placement edit mode state
  const [isEditingPlacement, setIsEditingPlacement] = useState(false);
  const [isUpdatingPlacement, startUpdatePlacement] = useTransition();

  // Placement creation state (if unplaced)
  const [isCreatingPlacement, startCreatePlacement] = useTransition();
  const [isNewOrg, setIsNewOrg] = useState(false);

  // Form states for creation
  const [selectedOrgId, setSelectedOrgId] = useState(organizations[0]?.id || "");
  const [newOrgName, setNewOrgName] = useState("");
  const [newOrgAddress, setNewOrgAddress] = useState("");
  const [newOrgStateRegion, setNewOrgStateRegion] = useState("");
  const [newOrgIndustryType, setNewOrgIndustryType] = useState("");
  const [creationSupervisorId, setCreationSupervisorId] = useState(
    departmentSupervisors[0]?.id || ""
  );
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [targetDays, setTargetDays] = useState(60);

  // Form states for updating existing placement
  const [editOrgId, setEditOrgId] = useState(placement?.organizationId || "");
  const [editStartDate, setEditStartDate] = useState(placement?.startDate || "");
  const [editEndDate, setEditEndDate] = useState(placement?.endDate || "");
  const [editTargetDays, setEditTargetDays] = useState(placement?.targetDays || 60);
  const [editStatus, setEditStatus] = useState<"pending" | "active" | "completed">(
    placement?.status || "active"
  );
  const [editSupervisorId, setEditSupervisorId] = useState(
    placement?.schoolSupervisorId || ""
  );

  // Handler: Assign Supervisor
  const handleAssignSupervisor = () => {
    if (!selectedSupervisorId) {
      toast.error("Please select a supervisor to assign.");
      return;
    }

    startAssignSupervisor(async () => {
      try {
        const res = await assignSupervisor(student.id, selectedSupervisorId);
        if (!res.success) {
          toast.error(res.error || "Failed to assign supervisor.");
          return;
        }
        toast.success("School supervisor assigned successfully!");
        router.refresh();
      } catch (err) {
        console.error("Assign supervisor error:", err);
        toast.error("An unexpected error occurred.");
      }
    });
  };

  // Handler: Update Placement
  const handleUpdatePlacement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!placement) return;

    if (!editStartDate || !editEndDate) {
      toast.error("Please provide both start and end dates.");
      return;
    }

    const formData = new FormData();
    formData.append("id", placement.id);
    formData.append("organizationId", editOrgId);
    if (editSupervisorId) formData.append("schoolSupervisorId", editSupervisorId);
    formData.append("startDate", editStartDate);
    formData.append("endDate", editEndDate);
    formData.append("targetDays", String(editTargetDays));
    formData.append("status", editStatus);

    startUpdatePlacement(async () => {
      try {
        const res = await updatePlacement(formData);
        if (!res.success) {
          toast.error(res.error || "Failed to update placement.");
          return;
        }
        toast.success("Placement details updated successfully!");
        setIsEditingPlacement(false);
        router.refresh();
      } catch (err) {
        console.error("Update placement error:", err);
        toast.error("An unexpected error occurred.");
      }
    });
  };

  // Handler: Create Department Placement
  const handleCreatePlacement = (e: React.FormEvent) => {
    e.preventDefault();

    if (!startDate || !endDate) {
      toast.error("Please provide both start and end dates.");
      return;
    }

    if (!creationSupervisorId) {
      toast.error("Please select an academic supervisor.");
      return;
    }

    if (isNewOrg) {
      if (!newOrgName || !newOrgAddress || !newOrgStateRegion || !newOrgIndustryType) {
        toast.error("Please fill in all details for the new organization.");
        return;
      }
    } else if (!selectedOrgId) {
      toast.error("Please choose an organization from the directory.");
      return;
    }

    const formData = new FormData();
    formData.append("studentProfileId", student.id);
    formData.append("schoolSupervisorId", creationSupervisorId);
    formData.append("startDate", startDate);
    formData.append("endDate", endDate);
    formData.append("targetDays", String(targetDays));
    formData.append("isNewOrg", isNewOrg ? "true" : "false");

    if (isNewOrg) {
      formData.append("orgName", newOrgName);
      formData.append("orgAddress", newOrgAddress);
      formData.append("orgStateRegion", newOrgStateRegion);
      formData.append("orgIndustryType", newOrgIndustryType);
    } else {
      formData.append("organizationId", selectedOrgId);
    }

    startCreatePlacement(async () => {
      try {
        const res = await createDepartmentPlacement(formData);
        if (!res.success) {
          toast.error(res.error || "Failed to create placement.");
          return;
        }
        toast.success("Department placement created successfully!");
        router.refresh();
      } catch (err) {
        console.error("Create placement error:", err);
        toast.error("An unexpected error occurred.");
      }
    });
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <Link
          href="/hod/students"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-on-surface-variant hover:text-primary transition-colors"
        >
          <ArrowLeft className="size-4" />
          <span>Back to Students</span>
        </Link>
      </div>

      {/* Student Profile Card Header */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-outline-variant/60">
          <div className="flex items-center gap-4">
            <div className="size-14 rounded-full bg-primary/10 text-primary font-bold text-lg flex items-center justify-center shrink-0 ring-4 ring-primary/5">
              {student.name
                .split(" ")
                .map((n) => n[0])
                .slice(0, 2)
                .join("")
                .toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="font-heading text-xl md:text-2xl font-bold text-on-surface">
                  {student.name}
                </h1>
                {placement?.status === "active" ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-success-container text-on-success-container text-xs font-medium">
                    <CheckCircle2 className="size-3" />
                    <span>Active Placement</span>
                  </span>
                ) : placement?.status === "pending" ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-warning-container text-on-warning-container text-xs font-medium">
                    <Clock className="size-3" />
                    <span>Pending Approval</span>
                  </span>
                ) : placement?.status === "completed" ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-surface-container text-on-surface-variant text-xs font-medium">
                    <CheckCircle2 className="size-3" />
                    <span>Completed</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-error-container text-on-error-container text-xs font-medium">
                    <AlertCircle className="size-3" />
                    <span>Unplaced</span>
                  </span>
                )}
              </div>
              <p className="text-sm text-on-surface-variant mt-1 flex items-center gap-2 flex-wrap">
                <span className="font-mono font-medium text-on-surface">
                  {student.matricNumber || "Matric pending"}
                </span>
                <span>•</span>
                <span>{student.programName || "Program not set"}</span>
                {student.level && (
                  <>
                    <span>•</span>
                    <span>{student.level} Level</span>
                  </>
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Profile Details Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-6">
          <div className="p-3 rounded-xl bg-surface-container-low/50">
            <span className="text-[11px] uppercase tracking-wider font-semibold text-on-surface-variant flex items-center gap-1 mb-1">
              <Mail className="size-3.5" /> Email
            </span>
            <div className="text-sm font-medium text-on-surface truncate">
              {student.email}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-surface-container-low/50">
            <span className="text-[11px] uppercase tracking-wider font-semibold text-on-surface-variant flex items-center gap-1 mb-1">
              <Phone className="size-3.5" /> Phone
            </span>
            <div className="text-sm font-medium text-on-surface">
              {student.phone || <span className="text-on-surface-variant/60 italic">Not provided</span>}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-surface-container-low/50">
            <span className="text-[11px] uppercase tracking-wider font-semibold text-on-surface-variant flex items-center gap-1 mb-1">
              <GraduationCap className="size-3.5" /> Department
            </span>
            <div className="text-sm font-medium text-on-surface truncate">
              {student.departmentName}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-surface-container-low/50">
            <span className="text-[11px] uppercase tracking-wider font-semibold text-on-surface-variant flex items-center gap-1 mb-1">
              Profile Status
            </span>
            <div className="text-sm font-medium text-on-surface">
              {student.isProfileComplete ? (
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="size-3.5" /> Complete
                </span>
              ) : (
                <span className="text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-1">
                  <AlertCircle className="size-3.5" /> Incomplete
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Grid: Supervisor Assignment + Placement Management */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: School Supervisor Assignment (1 Col) */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-6 shadow-xs space-y-5 lg:col-span-1">
          <div>
            <h2 className="font-heading font-bold text-base text-on-surface flex items-center gap-2">
              <UserCheck className="size-4.5 text-primary" />
              <span>School Supervisor</span>
            </h2>
            <p className="text-xs text-on-surface-variant mt-1">
              Assign an academic supervisor from {student.departmentName}
            </p>
          </div>

          {/* Current Supervisor Card */}
          <div className="p-3.5 rounded-xl border border-outline-variant bg-surface-container-low/40">
            <span className="text-[10px] uppercase tracking-wider font-bold text-on-surface-variant">
              Currently Assigned
            </span>
            {placement?.supervisorName ? (
              <div className="mt-2 flex items-start gap-3">
                <div className="size-8 rounded-full bg-emerald-500/10 text-emerald-700 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                  <UserCheck className="size-4 text-emerald-600" />
                </div>
                <div>
                  <div className="font-semibold text-sm text-on-surface">
                    {placement.supervisorName}
                  </div>
                  <div className="text-xs text-on-surface-variant">
                    {placement.supervisorEmail}
                  </div>
                </div>
              </div>
            ) : (
              <div className="mt-2 flex items-center gap-2 text-amber-700 dark:text-amber-300 text-xs font-medium">
                <UserX className="size-4 shrink-0" />
                <span>No supervisor assigned yet</span>
              </div>
            )}
          </div>

          {/* Assignment Form */}
          {placement ? (
            <div className="space-y-3 pt-2">
              <label
                htmlFor="supervisor-select"
                className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant"
              >
                {placement.schoolSupervisorId ? "Reassign Supervisor" : "Select Supervisor"}
              </label>

              {departmentSupervisors.length === 0 ? (
                <div className="p-3 rounded-lg bg-amber-500/10 text-amber-800 dark:text-amber-200 text-xs">
                  No School Supervisors have been created in this department. Please contact the administrator.
                </div>
              ) : (
                <select
                  id="supervisor-select"
                  value={selectedSupervisorId}
                  onChange={(e) => setSelectedSupervisorId(e.target.value)}
                  className="w-full text-sm rounded-lg border border-outline-variant bg-surface-container-lowest text-on-surface px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  {departmentSupervisors.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.email})
                    </option>
                  ))}
                </select>
              )}

              <button
                type="button"
                onClick={handleAssignSupervisor}
                disabled={isAssigningSupervisor || departmentSupervisors.length === 0}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-primary text-on-primary text-sm font-semibold hover:bg-primary/90 transition-colors shadow-xs disabled:opacity-50"
              >
                {isAssigningSupervisor ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="size-4" />
                    <span>
                      {placement.schoolSupervisorId
                        ? "Update Supervisor"
                        : "Assign to Student"}
                    </span>
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-surface-container-low text-xs text-on-surface-variant space-y-2">
              <p className="font-medium text-on-surface">Placement required</p>
              <p>
                Supervisors can only be assigned to a registered placement. Use the form on the right to set up the student&apos;s placement first.
              </p>
            </div>
          )}
        </div>

        {/* Right Column: Placement Management (2 Cols) */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-6 shadow-xs space-y-6 lg:col-span-2">
          {placement ? (
            /* Placement Exists — View / Edit Mode */
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-outline-variant/60">
                <div>
                  <h2 className="font-heading font-bold text-base text-on-surface flex items-center gap-2">
                    <Building2 className="size-4.5 text-primary" />
                    <span>Placement Configuration</span>
                  </h2>
                  <p className="text-xs text-on-surface-variant mt-0.5">
                    Source:{" "}
                    <span className="font-semibold capitalize text-on-surface">
                      {placement.placementSource.replace(/_/g, " ")}
                    </span>{" "}
                    • Created: {new Date(placement.createdAt).toLocaleDateString()}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setIsEditingPlacement(!isEditingPlacement)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-outline-variant text-xs font-semibold text-on-surface hover:bg-surface-container transition-colors"
                >
                  {isEditingPlacement ? (
                    <>
                      <X className="size-3.5" />
                      <span>Cancel Edit</span>
                    </>
                  ) : (
                    <>
                      <Edit3 className="size-3.5 text-primary" />
                      <span>Edit Placement</span>
                    </>
                  )}
                </button>
              </div>

              {!isEditingPlacement ? (
                /* Read-Only Placement Overview */
                <div className="space-y-5">
                  {/* Organization Card */}
                  <div className="p-4 rounded-xl border border-outline-variant bg-surface-container-low/30 space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="text-base font-bold text-on-surface">
                          {placement.organizationName}
                        </div>
                        <div className="text-xs text-on-surface-variant mt-0.5 flex items-center gap-1">
                          <MapPin className="size-3" />
                          <span>
                            {placement.organizationAddress}, {placement.organizationStateRegion}
                          </span>
                        </div>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant text-xs font-semibold">
                        {placement.organizationIndustryType}
                      </span>
                    </div>
                  </div>

                  {/* Dates & Target Days */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="p-3.5 rounded-xl bg-surface-container-low/40">
                      <span className="text-[10px] uppercase font-bold text-on-surface-variant flex items-center gap-1 mb-1">
                        <Calendar className="size-3" /> Start Date
                      </span>
                      <div className="text-sm font-semibold text-on-surface">
                        {new Date(placement.startDate).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </div>
                    </div>

                    <div className="p-3.5 rounded-xl bg-surface-container-low/40">
                      <span className="text-[10px] uppercase font-bold text-on-surface-variant flex items-center gap-1 mb-1">
                        <Calendar className="size-3" /> End Date
                      </span>
                      <div className="text-sm font-semibold text-on-surface">
                        {new Date(placement.endDate).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </div>
                    </div>

                    <div className="p-3.5 rounded-xl bg-surface-container-low/40">
                      <span className="text-[10px] uppercase font-bold text-on-surface-variant flex items-center gap-1 mb-1">
                        <Clock className="size-3" /> Target Days
                      </span>
                      <div className="text-sm font-semibold text-on-surface">
                        {placement.targetDays} Days Required
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* Edit Placement Form */
                <form onSubmit={handleUpdatePlacement} className="space-y-4">
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
                      Organization
                    </label>
                    <select
                      value={editOrgId}
                      onChange={(e) => setEditOrgId(e.target.value)}
                      className="w-full text-sm rounded-lg border border-outline-variant bg-surface-container-lowest text-on-surface px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      {organizations.map((org) => (
                        <option key={org.id} value={org.id}>
                          {org.name} — {org.stateRegion} ({org.industryType})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
                        Start Date
                      </label>
                      <input
                        type="date"
                        value={editStartDate}
                        onChange={(e) => setEditStartDate(e.target.value)}
                        required
                        className="w-full text-sm rounded-lg border border-outline-variant bg-surface-container-lowest text-on-surface px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
                        End Date
                      </label>
                      <input
                        type="date"
                        value={editEndDate}
                        onChange={(e) => setEditEndDate(e.target.value)}
                        required
                        className="w-full text-sm rounded-lg border border-outline-variant bg-surface-container-lowest text-on-surface px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
                        Target Training Days
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="365"
                        value={editTargetDays}
                        onChange={(e) => setEditTargetDays(parseInt(e.target.value, 10))}
                        className="w-full text-sm rounded-lg border border-outline-variant bg-surface-container-lowest text-on-surface px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
                        Placement Status
                      </label>
                      <select
                        value={editStatus}
                        onChange={(e) =>
                          setEditStatus(e.target.value as "pending" | "active" | "completed")
                        }
                        className="w-full text-sm rounded-lg border border-outline-variant bg-surface-container-lowest text-on-surface px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                      >
                        <option value="pending">Pending Approval</option>
                        <option value="active">Active</option>
                        <option value="completed">Completed</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
                      School Supervisor
                    </label>
                    <select
                      value={editSupervisorId}
                      onChange={(e) => setEditSupervisorId(e.target.value)}
                      className="w-full text-sm rounded-lg border border-outline-variant bg-surface-container-lowest text-on-surface px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="">Unassigned</option>
                      {departmentSupervisors.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} ({s.email})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsEditingPlacement(false)}
                      className="px-4 py-2 rounded-lg border border-outline-variant text-sm font-semibold text-on-surface hover:bg-surface-container transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isUpdatingPlacement}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-on-primary text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50"
                    >
                      {isUpdatingPlacement ? (
                        <>
                          <Loader2 className="size-4 animate-spin" />
                          <span>Saving Changes...</span>
                        </>
                      ) : (
                        <>
                          <Save className="size-4" />
                          <span>Save Changes</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          ) : (
            /* No Placement Configured — Creation Form */
            <div className="space-y-6">
              <div>
                <h2 className="font-heading font-bold text-base text-on-surface flex items-center gap-2">
                  <Briefcase className="size-4.5 text-primary" />
                  <span>Assign Placement to Student</span>
                </h2>
                <p className="text-xs text-on-surface-variant mt-0.5">
                  Configure training organization and academic supervisor for {student.name}
                </p>
              </div>

              <form onSubmit={handleCreatePlacement} className="space-y-5">
                {/* Organization Selection / Creation Toggle */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
                      Training Organization *
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsNewOrg(!isNewOrg)}
                      className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1"
                    >
                      {isNewOrg ? (
                        <span>Choose from existing directory</span>
                      ) : (
                        <>
                          <Plus className="size-3" />
                          <span>+ Add new organization</span>
                        </>
                      )}
                    </button>
                  </div>

                  {!isNewOrg ? (
                    organizations.length === 0 ? (
                      <div className="p-3 rounded-lg bg-amber-500/10 text-amber-800 dark:text-amber-200 text-xs">
                        No organizations currently registered. Click &quot;+ Add new organization&quot; above to create one.
                      </div>
                    ) : (
                      <select
                        value={selectedOrgId}
                        onChange={(e) => setSelectedOrgId(e.target.value)}
                        className="w-full text-sm rounded-lg border border-outline-variant bg-surface-container-lowest text-on-surface px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary"
                      >
                        {organizations.map((org) => (
                          <option key={org.id} value={org.id}>
                            {org.name} — {org.address}, {org.stateRegion} ({org.industryType})
                          </option>
                        ))}
                      </select>
                    )
                  ) : (
                    /* Inline New Organization Fields */
                    <div className="p-4 rounded-xl border border-outline-variant bg-surface-container-low/40 space-y-3">
                      <div className="text-xs font-bold text-primary uppercase tracking-wider">
                        New Organization Details
                      </div>

                      <div className="space-y-1">
                        <label className="block text-xs font-medium text-on-surface-variant">
                          Organization Name *
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Chevron Nigeria Limited"
                          value={newOrgName}
                          onChange={(e) => setNewOrgName(e.target.value)}
                          className="w-full text-sm rounded-lg border border-outline-variant bg-surface-container-lowest text-on-surface px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="block text-xs font-medium text-on-surface-variant">
                          Office / Site Address *
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. 2 Chevron Drive, Lekki"
                          value={newOrgAddress}
                          onChange={(e) => setNewOrgAddress(e.target.value)}
                          className="w-full text-sm rounded-lg border border-outline-variant bg-surface-container-lowest text-on-surface px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="block text-xs font-medium text-on-surface-variant">
                            State / Region *
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. Lagos State"
                            value={newOrgStateRegion}
                            onChange={(e) => setNewOrgStateRegion(e.target.value)}
                            className="w-full text-sm rounded-lg border border-outline-variant bg-surface-container-lowest text-on-surface px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="block text-xs font-medium text-on-surface-variant">
                            Industry Type *
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. Oil & Gas / Energy"
                            value={newOrgIndustryType}
                            onChange={(e) => setNewOrgIndustryType(e.target.value)}
                            className="w-full text-sm rounded-lg border border-outline-variant bg-surface-container-lowest text-on-surface px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Supervisor Selection */}
                <div className="space-y-1">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
                    Assigned School Supervisor *
                  </label>
                  {departmentSupervisors.length === 0 ? (
                    <div className="p-3 rounded-lg bg-amber-500/10 text-amber-800 dark:text-amber-200 text-xs">
                      No School Supervisors in this department. Please create one in Admin first.
                    </div>
                  ) : (
                    <select
                      value={creationSupervisorId}
                      onChange={(e) => setCreationSupervisorId(e.target.value)}
                      className="w-full text-sm rounded-lg border border-outline-variant bg-surface-container-lowest text-on-surface px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      {departmentSupervisors.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} ({s.email})
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Dates & Target Days */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
                      Start Date *
                    </label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      required
                      className="w-full text-sm rounded-lg border border-outline-variant bg-surface-container-lowest text-on-surface px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
                      End Date *
                    </label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      required
                      className="w-full text-sm rounded-lg border border-outline-variant bg-surface-container-lowest text-on-surface px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
                      Target Days
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="365"
                      value={targetDays}
                      onChange={(e) => setTargetDays(parseInt(e.target.value, 10))}
                      className="w-full text-sm rounded-lg border border-outline-variant bg-surface-container-lowest text-on-surface px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>

                {/* Submit Button */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={
                      isCreatingPlacement ||
                      departmentSupervisors.length === 0 ||
                      (!isNewOrg && organizations.length === 0)
                    }
                    className="w-full inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-on-primary text-sm font-semibold hover:bg-primary/90 transition-colors shadow-xs disabled:opacity-50"
                  >
                    {isCreatingPlacement ? (
                      <>
                        <Loader2 className="size-4 animate-spin" />
                        <span>Creating Placement...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="size-4" />
                        <span>Create Department Placement</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
