"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Briefcase,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  AlertTriangle,
  X,
  Search,
  CheckCircle2,
  Clock,
  UserCheck,
  Calendar,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import {
  approveStudentPlacement,
  createDepartmentPlacement,
  updatePlacement,
  deletePlacement,
} from "@/actions/placement";

export interface PlacementRowItem {
  id: string;
  status: "pending" | "active" | "completed";
  placementSource: "self_secured" | "department_assigned";
  startDate: string;
  endDate: string;
  targetDays: number;
  student: {
    id: string;
    name: string | null;
    email: string;
    matricNumber: string | null;
    departmentName: string | null;
  };
  organization: {
    id: string;
    name: string;
    industryType: string;
    stateRegion: string;
    address: string;
  };
  schoolSupervisor: {
    id: string;
    name: string | null;
    email: string | null;
  } | null;
}

export interface SupervisorOption {
  id: string;
  name: string | null;
  email: string;
  departmentName: string | null;
}

export interface UnassignedStudentOption {
  profileId: string;
  name: string | null;
  email: string;
  matricNumber: string | null;
  departmentName: string | null;
}

export interface OrganizationOption {
  id: string;
  name: string;
  industryType: string;
  stateRegion: string;
}

interface PlacementListProps {
  placements: PlacementRowItem[];
  supervisors: SupervisorOption[];
  unassignedStudents: UnassignedStudentOption[];
  organizations: OrganizationOption[];
}

export function PlacementList({
  placements,
  supervisors,
  unassignedStudents,
  organizations,
}: PlacementListProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Filter & Search states
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "active" | "completed">("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Dialog states
  const [reviewingPlacement, setReviewingPlacement] = useState<PlacementRowItem | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingPlacement, setEditingPlacement] = useState<PlacementRowItem | null>(null);
  const [deletingPlacement, setDeletingPlacement] = useState<PlacementRowItem | null>(null);

  // Form states for Supervisor Assignment / Approval
  const [selectedSupervisorId, setSelectedSupervisorId] = useState("");
  const [approvalStartDate, setApprovalStartDate] = useState("");
  const [approvalEndDate, setApprovalEndDate] = useState("");
  const [approvalTargetDays, setApprovalTargetDays] = useState("60");

  // Form states for Direct Department Assignment
  const [directStudentProfileId, setDirectStudentProfileId] = useState(
    unassignedStudents[0]?.profileId || ""
  );
  const [directOrgMode, setDirectOrgMode] = useState<"select" | "new">("select");
  const [directOrgId, setDirectOrgId] = useState(organizations[0]?.id || "");
  const [directNewOrgName, setDirectNewOrgName] = useState("");
  const [directNewOrgIndustry, setDirectNewOrgIndustry] = useState("Software & Information Technology");
  const [directNewOrgAddress, setDirectNewOrgAddress] = useState("");
  const [directNewOrgState, setDirectNewOrgState] = useState("Ekiti");
  const [directSupervisorId, setDirectSupervisorId] = useState(supervisors[0]?.id || "");
  const [directStartDate, setDirectStartDate] = useState("");
  const [directEndDate, setDirectEndDate] = useState("");
  const [directTargetDays, setDirectTargetDays] = useState("60");

  // Form states for Edit Placement
  const [editSupervisorId, setEditSupervisorId] = useState("");
  const [editStatus, setEditStatus] = useState<"pending" | "active" | "completed">("active");
  const [editStartDate, setEditStartDate] = useState("");
  const [editEndDate, setEditEndDate] = useState("");
  const [editTargetDays, setEditTargetDays] = useState("60");

  const [formError, setFormError] = useState<string | null>(null);

  // Filtered Placements
  const filteredPlacements = placements.filter((p) => {
    const matchesStatus = statusFilter === "all" || p.status === statusFilter;
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      (p.student.name?.toLowerCase().includes(query) ?? false) ||
      (p.student.matricNumber?.toLowerCase().includes(query) ?? false) ||
      p.organization.name.toLowerCase().includes(query) ||
      (p.schoolSupervisor?.name?.toLowerCase().includes(query) ?? false);

    return matchesStatus && matchesSearch;
  });

  const pendingCount = placements.filter((p) => p.status === "pending").length;
  const activeCount = placements.filter((p) => p.status === "active").length;
  const completedCount = placements.filter((p) => p.status === "completed").length;

  // Open Review Dialog for a Pending Placement
  const handleOpenReview = (p: PlacementRowItem) => {
    setReviewingPlacement(p);
    setSelectedSupervisorId(supervisors[0]?.id || "");
    setApprovalStartDate(p.startDate);
    setApprovalEndDate(p.endDate);
    setApprovalTargetDays(String(p.targetDays || 60));
    setFormError(null);
  };

  // Submit Approval & Supervisor Assignment
  const handleApprove = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewingPlacement) return;
    setFormError(null);

    if (!selectedSupervisorId) {
      setFormError("Please select an academic School Supervisor.");
      return;
    }

    const formData = new FormData();
    formData.append("placementId", reviewingPlacement.id);
    formData.append("schoolSupervisorId", selectedSupervisorId);
    formData.append("startDate", approvalStartDate);
    formData.append("endDate", approvalEndDate);
    formData.append("targetDays", approvalTargetDays);

    startTransition(async () => {
      const res = await approveStudentPlacement(formData);
      if (!res.success) {
        setFormError(res.error || "Failed to approve placement");
        toast.error(res.error || "Failed to approve placement");
      } else {
        toast.success("Placement approved and School Supervisor assigned!");
        setReviewingPlacement(null);
        router.refresh();
      }
    });
  };

  // Open Direct Department Assignment Dialog
  const handleOpenCreate = () => {
    setDirectStudentProfileId(unassignedStudents[0]?.profileId || "");
    setDirectOrgMode(organizations.length > 0 ? "select" : "new");
    setDirectOrgId(organizations[0]?.id || "");
    setDirectSupervisorId(supervisors[0]?.id || "");
    setDirectStartDate("");
    setDirectEndDate("");
    setDirectTargetDays("60");
    setFormError(null);
    setIsCreateOpen(true);
  };

  // Submit Direct Department Placement
  const handleCreateDepartmentPlacement = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!directStudentProfileId) {
      setFormError("Please select a student.");
      return;
    }
    if (!directSupervisorId) {
      setFormError("Please select a School Supervisor.");
      return;
    }
    if (!directStartDate || !directEndDate) {
      setFormError("Please provide both start and end dates.");
      return;
    }
    if (new Date(directEndDate) <= new Date(directStartDate)) {
      setFormError("End date must be after start date.");
      return;
    }

    const formData = new FormData();
    formData.append("studentProfileId", directStudentProfileId);
    formData.append("schoolSupervisorId", directSupervisorId);
    formData.append("startDate", directStartDate);
    formData.append("endDate", directEndDate);
    formData.append("targetDays", directTargetDays);

    if (directOrgMode === "select") {
      if (!directOrgId) {
        setFormError("Please select an organization.");
        return;
      }
      formData.append("organizationId", directOrgId);
      formData.append("isNewOrg", "false");
    } else {
      if (!directNewOrgName.trim() || !directNewOrgAddress.trim()) {
        setFormError("Please fill in the new organization name and address.");
        return;
      }
      formData.append("isNewOrg", "true");
      formData.append("orgName", directNewOrgName.trim());
      formData.append("orgIndustryType", directNewOrgIndustry);
      formData.append("orgAddress", directNewOrgAddress.trim());
      formData.append("orgStateRegion", directNewOrgState.trim());
    }

    startTransition(async () => {
      const res = await createDepartmentPlacement(formData);
      if (!res.success) {
        setFormError(res.error || "Failed to create placement");
        toast.error(res.error || "Failed to create placement");
      } else {
        toast.success("Department placement assigned successfully!");
        setIsCreateOpen(false);
        router.refresh();
      }
    });
  };

  // Open Edit Dialog
  const handleOpenEdit = (p: PlacementRowItem) => {
    setEditingPlacement(p);
    setEditSupervisorId(p.schoolSupervisor?.id || supervisors[0]?.id || "");
    setEditStatus(p.status);
    setEditStartDate(p.startDate);
    setEditEndDate(p.endDate);
    setEditTargetDays(String(p.targetDays));
    setFormError(null);
  };

  // Submit Edit
  const handleEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPlacement) return;
    setFormError(null);

    const formData = new FormData();
    formData.append("id", editingPlacement.id);
    formData.append("schoolSupervisorId", editSupervisorId);
    formData.append("status", editStatus);
    formData.append("startDate", editStartDate);
    formData.append("endDate", editEndDate);
    formData.append("targetDays", editTargetDays);

    startTransition(async () => {
      const res = await updatePlacement(formData);
      if (!res.success) {
        setFormError(res.error || "Failed to update placement");
        toast.error(res.error || "Failed to update placement");
      } else {
        toast.success("Placement updated successfully");
        setEditingPlacement(null);
        router.refresh();
      }
    });
  };

  // Submit Delete
  const handleDelete = (id: string) => {
    startTransition(async () => {
      const res = await deletePlacement(id);
      if (!res.success) {
        toast.error(res.error || "Failed to delete placement");
      } else {
        toast.success("Placement deleted successfully");
        setDeletingPlacement(null);
        router.refresh();
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Primary Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-primary-fixed text-on-primary-fixed flex items-center justify-center shadow-xs">
              <Briefcase className="size-5 text-primary" />
            </div>
            <div>
              <h1 className="font-heading text-2xl font-bold tracking-tight text-on-surface">
                SIWES Placements
              </h1>
              <p className="text-xs text-on-surface-variant">
                Student placement registrations, supervisor assignments, and approvals
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-on-primary text-xs font-semibold hover:bg-primary-container active:scale-[0.98] transition-all shadow-xs"
        >
          <Plus className="size-4" />
          <span>New Department Placement</span>
        </button>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-3 shadow-xs">
        {/* Status Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-surface-container-low rounded-xl w-full md:w-auto overflow-x-auto">
          <button
            type="button"
            onClick={() => setStatusFilter("all")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              statusFilter === "all"
                ? "bg-surface-container-lowest text-primary shadow-xs"
                : "text-on-surface-variant hover:text-on-surface"
            }`}
          >
            All Placements ({placements.length})
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter("pending")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
              statusFilter === "pending"
                ? "bg-surface-container-lowest text-amber-700 dark:text-amber-300 shadow-xs"
                : "text-on-surface-variant hover:text-on-surface"
            }`}
          >
            <Clock className="size-3 text-amber-600" />
            <span>Pending Review</span>
            {pendingCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-white text-[10px] font-bold">
                {pendingCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter("active")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              statusFilter === "active"
                ? "bg-surface-container-lowest text-primary shadow-xs"
                : "text-on-surface-variant hover:text-on-surface"
            }`}
          >
            Active ({activeCount})
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter("completed")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              statusFilter === "completed"
                ? "bg-surface-container-lowest text-primary shadow-xs"
                : "text-on-surface-variant hover:text-on-surface"
            }`}
          >
            Completed ({completedCount})
          </button>
        </div>

        {/* Search */}
        <div className="relative w-full md:w-72">
          <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
          <input
            type="text"
            placeholder="Search student, matric, or company..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3.5 py-1.5 rounded-xl border border-outline-variant bg-surface-container-lowest text-xs text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
        </div>
      </div>

      {/* Placements Table */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-outline-variant bg-surface-container-low text-on-surface-variant font-heading uppercase text-[11px] tracking-wider">
                <th className="py-3 px-4 font-semibold">Student</th>
                <th className="py-3 px-4 font-semibold">Organization / Employer</th>
                <th className="py-3 px-4 font-semibold">Source</th>
                <th className="py-3 px-4 font-semibold">School Supervisor</th>
                <th className="py-3 px-4 font-semibold">Training Period</th>
                <th className="py-3 px-4 font-semibold">Status</th>
                <th className="py-3 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/60">
              {filteredPlacements.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-on-surface-variant">
                    <Briefcase className="size-8 mx-auto mb-2 opacity-40 text-primary" />
                    <p className="font-semibold text-on-surface">No placements found</p>
                    <p className="text-[11px] mt-0.5">
                      {searchQuery || statusFilter !== "all"
                        ? "Try clearing filters to see more placements."
                        : "Click 'New Department Placement' to assign a student."}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredPlacements.map((p) => (
                  <tr
                    key={p.id}
                    className="hover:bg-surface-container-low/50 transition-colors"
                  >
                    {/* Student */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                          {p.student.name?.charAt(0) || "S"}
                        </div>
                        <div>
                          <p className="font-semibold text-on-surface">{p.student.name || "Student"}</p>
                          <div className="flex items-center gap-1.5 text-[10px] text-on-surface-variant">
                            <span className="font-mono">{p.student.matricNumber || "No Matric"}</span>
                            {p.student.departmentName && (
                              <>
                                <span>·</span>
                                <span>{p.student.departmentName}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Organization */}
                    <td className="py-3 px-4">
                      <div>
                        <p className="font-semibold text-on-surface">{p.organization.name}</p>
                        <p className="text-[11px] text-on-surface-variant">
                          {p.organization.industryType} ({p.organization.stateRegion})
                        </p>
                      </div>
                    </td>

                    {/* Source */}
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wider font-heading ${
                          p.placementSource === "self_secured"
                            ? "bg-blue-500/10 text-blue-700 dark:text-blue-300"
                            : "bg-purple-500/10 text-purple-700 dark:text-purple-300"
                        }`}
                      >
                        {p.placementSource === "self_secured" ? "Self-Secured" : "Dept-Assigned"}
                      </span>
                    </td>

                    {/* School Supervisor */}
                    <td className="py-3 px-4">
                      {p.schoolSupervisor ? (
                        <div className="flex items-center gap-1.5 text-on-surface">
                          <UserCheck className="size-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                          <span className="font-medium truncate max-w-[140px]">
                            {p.schoolSupervisor.name || p.schoolSupervisor.email}
                          </span>
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 text-[10px] font-semibold">
                          <Clock className="size-3" />
                          <span>Unassigned</span>
                        </span>
                      )}
                    </td>

                    {/* Dates */}
                    <td className="py-3 px-4 text-on-surface-variant text-[11px]">
                      <div className="flex items-center gap-1">
                        <Calendar className="size-3 opacity-60" />
                        <span>
                          {p.startDate} – {p.endDate}
                        </span>
                      </div>
                      <span className="text-[10px] opacity-80 block">
                        {p.targetDays} working days target
                      </span>
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold capitalize ${
                          p.status === "pending"
                            ? "bg-amber-500/15 text-amber-700 dark:text-amber-300"
                            : p.status === "active"
                            ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                            : "bg-surface-container-high text-on-surface-variant"
                        }`}
                      >
                        {p.status === "pending" && <Clock className="size-3" />}
                        {p.status === "active" && <CheckCircle2 className="size-3" />}
                        <span>{p.status}</span>
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {p.status === "pending" ? (
                          <button
                            onClick={() => handleOpenReview(p)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500 text-white text-xs font-semibold hover:bg-amber-600 transition-colors shadow-xs"
                          >
                            <ShieldCheck className="size-3.5" />
                            <span>Review & Assign</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => handleOpenEdit(p)}
                            className="p-1.5 rounded-lg text-on-surface-variant hover:text-primary hover:bg-surface-container-high transition-colors"
                            title="Edit Placement"
                          >
                            <Pencil className="size-3.5" />
                          </button>
                        )}

                        <button
                          onClick={() => setDeletingPlacement(p)}
                          className="p-1.5 rounded-lg text-on-surface-variant hover:text-error hover:bg-error-container/20 transition-colors"
                          title="Delete Placement"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Review & Assign School Supervisor Modal */}
      {reviewingPlacement && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-6 w-full max-w-lg shadow-xl relative animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-outline-variant mb-4">
              <div className="flex items-center gap-2">
                <ShieldCheck className="size-5 text-amber-600" />
                <h3 className="font-heading text-lg font-bold text-on-surface">
                  Verify Placement & Assign Supervisor
                </h3>
              </div>
              <button
                onClick={() => setReviewingPlacement(null)}
                className="p-1 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high"
              >
                <X className="size-4" />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-xl bg-error-container/20 border border-error-container text-error text-xs mb-4 flex items-center gap-2">
                <AlertTriangle className="size-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            {/* Placement Summary for Reviewer */}
            <div className="p-4 rounded-xl bg-surface-container-low border border-outline-variant mb-4 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-on-surface-variant">Student:</span>
                <strong className="text-on-surface">
                  {reviewingPlacement.student.name} ({reviewingPlacement.student.matricNumber || "No Matric"})
                </strong>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-on-surface-variant">Submitted Company:</span>
                <strong className="text-on-surface">{reviewingPlacement.organization.name}</strong>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-on-surface-variant">Industry Sector:</span>
                <span className="text-on-surface">{reviewingPlacement.organization.industryType}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-on-surface-variant">Location:</span>
                <span className="text-on-surface">{reviewingPlacement.organization.address}, {reviewingPlacement.organization.stateRegion}</span>
              </div>
            </div>

            <form onSubmit={handleApprove} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold font-heading text-on-surface mb-1">
                  Assign Academic School Supervisor <span className="text-error">*</span>
                </label>
                {supervisors.length === 0 ? (
                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-700 dark:text-amber-300">
                    No School Supervisors registered yet. Please create or assign a School Supervisor in the Users section first.
                  </div>
                ) : (
                  <select
                    required
                    value={selectedSupervisorId}
                    onChange={(e) => setSelectedSupervisorId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-outline-variant bg-surface-container-lowest text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  >
                    <option value="">-- Choose School Supervisor --</option>
                    {supervisors.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name || s.email} {s.departmentName ? `(${s.departmentName})` : ""}
                      </option>
                    ))}
                  </select>
                )}
                <p className="text-[10px] text-on-surface-variant mt-1">
                  This faculty supervisor will evaluate the student&apos;s daily logbook submissions.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold font-heading text-on-surface mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    required
                    min="2020-01-01"
                    max="2035-12-31"
                    value={approvalStartDate}
                    onChange={(e) => setApprovalStartDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-outline-variant bg-surface-container-lowest text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold font-heading text-on-surface mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    required
                    min="2020-01-01"
                    max="2035-12-31"
                    value={approvalEndDate}
                    onChange={(e) => setApprovalEndDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-outline-variant bg-surface-container-lowest text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold font-heading text-on-surface mb-1">
                  Target Working Days
                </label>
                <input
                  type="number"
                  min={10}
                  max={180}
                  value={approvalTargetDays}
                  onChange={(e) => setApprovalTargetDays(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-outline-variant bg-surface-container-lowest text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-outline-variant">
                <button
                  type="button"
                  onClick={() => setReviewingPlacement(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-on-surface-variant hover:bg-surface-container-high transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 disabled:opacity-50 transition-all shadow-xs"
                >
                  {isPending && <Loader2 className="size-3.5 animate-spin" />}
                  <span>Approve & Activate Placement</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Direct Department Placement Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-6 w-full max-w-xl shadow-xl relative animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-outline-variant mb-4">
              <div className="flex items-center gap-2">
                <Briefcase className="size-5 text-primary" />
                <h3 className="font-heading text-lg font-bold text-on-surface">
                  Create Department Placement
                </h3>
              </div>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="p-1 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high"
              >
                <X className="size-4" />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-xl bg-error-container/20 border border-error-container text-error text-xs mb-4 flex items-center gap-2">
                <AlertTriangle className="size-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleCreateDepartmentPlacement} className="space-y-4">
              {/* Student Select */}
              <div>
                <label className="block text-xs font-semibold font-heading text-on-surface mb-1">
                  Select Student <span className="text-error">*</span>
                </label>
                {unassignedStudents.length > 0 ? (
                  <select
                    required
                    value={directStudentProfileId}
                    onChange={(e) => setDirectStudentProfileId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-outline-variant bg-surface-container-lowest text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  >
                    {unassignedStudents.map((st) => (
                      <option key={st.profileId} value={st.profileId}>
                        {st.name} — {st.matricNumber || "No Matric"} ({st.departmentName || "No Dept"})
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="p-3 rounded-xl bg-surface-container-low text-xs text-on-surface-variant">
                    All registered students already have an active or pending placement.
                  </div>
                )}
              </div>

              {/* Organization Select or Create */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold font-heading text-on-surface">
                    Host Organization <span className="text-error">*</span>
                  </label>
                  <div className="flex items-center gap-1 text-[11px]">
                    <button
                      type="button"
                      onClick={() => setDirectOrgMode("select")}
                      className={`px-2 py-0.5 rounded font-medium ${
                        directOrgMode === "select"
                          ? "bg-primary text-on-primary font-semibold"
                          : "text-on-surface-variant hover:text-on-surface"
                      }`}
                    >
                      From Directory
                    </button>
                    <button
                      type="button"
                      onClick={() => setDirectOrgMode("new")}
                      className={`px-2 py-0.5 rounded font-medium ${
                        directOrgMode === "new"
                          ? "bg-primary text-on-primary font-semibold"
                          : "text-on-surface-variant hover:text-on-surface"
                      }`}
                    >
                      New Employer
                    </button>
                  </div>
                </div>

                {directOrgMode === "select" ? (
                  <select
                    value={directOrgId}
                    onChange={(e) => setDirectOrgId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-outline-variant bg-surface-container-lowest text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  >
                    {organizations.map((org) => (
                      <option key={org.id} value={org.id}>
                        {org.name} — {org.industryType} ({org.stateRegion})
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="p-3 rounded-xl bg-surface-container-low border border-outline-variant space-y-3">
                    <input
                      type="text"
                      placeholder="Company Name"
                      value={directNewOrgName}
                      onChange={(e) => setDirectNewOrgName(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg border border-outline-variant bg-surface-container-lowest text-xs text-on-surface"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="Industry Sector"
                        value={directNewOrgIndustry}
                        onChange={(e) => setDirectNewOrgIndustry(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg border border-outline-variant bg-surface-container-lowest text-xs text-on-surface"
                      />
                      <input
                        type="text"
                        placeholder="State / Region"
                        value={directNewOrgState}
                        onChange={(e) => setDirectNewOrgState(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg border border-outline-variant bg-surface-container-lowest text-xs text-on-surface"
                      />
                    </div>
                    <textarea
                      rows={2}
                      placeholder="Physical Address"
                      value={directNewOrgAddress}
                      onChange={(e) => setDirectNewOrgAddress(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg border border-outline-variant bg-surface-container-lowest text-xs text-on-surface resize-none"
                    />
                  </div>
                )}
              </div>

              {/* School Supervisor Select */}
              <div>
                <label className="block text-xs font-semibold font-heading text-on-surface mb-1">
                  Assign School Supervisor <span className="text-error">*</span>
                </label>
                <select
                  required
                  value={directSupervisorId}
                  onChange={(e) => setDirectSupervisorId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-outline-variant bg-surface-container-lowest text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                >
                  {supervisors.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name || s.email} {s.departmentName ? `(${s.departmentName})` : ""}
                    </option>
                  ))}
                </select>
              </div>

              {/* Dates and Duration */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold font-heading text-on-surface mb-1">
                    Start Date <span className="text-error">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    min="2020-01-01"
                    max="2035-12-31"
                    value={directStartDate}
                    onChange={(e) => setDirectStartDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-outline-variant bg-surface-container-lowest text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold font-heading text-on-surface mb-1">
                    End Date <span className="text-error">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    min="2020-01-01"
                    max="2035-12-31"
                    value={directEndDate}
                    onChange={(e) => setDirectEndDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-outline-variant bg-surface-container-lowest text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold font-heading text-on-surface mb-1">
                    Target Days
                  </label>
                  <input
                    type="number"
                    min={10}
                    max={180}
                    value={directTargetDays}
                    onChange={(e) => setDirectTargetDays(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-outline-variant bg-surface-container-lowest text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-outline-variant">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-on-surface-variant hover:bg-surface-container-high transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending || unassignedStudents.length === 0}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-on-primary text-xs font-semibold hover:bg-primary-container disabled:opacity-50 transition-all shadow-xs"
                >
                  {isPending && <Loader2 className="size-3.5 animate-spin" />}
                  <span>Create Placement</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Placement Modal */}
      {editingPlacement && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-6 w-full max-w-lg shadow-xl relative animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-outline-variant mb-4">
              <div className="flex items-center gap-2">
                <Pencil className="size-5 text-primary" />
                <h3 className="font-heading text-lg font-bold text-on-surface">
                  Edit Placement Details
                </h3>
              </div>
              <button
                onClick={() => setEditingPlacement(null)}
                className="p-1 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high"
              >
                <X className="size-4" />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-xl bg-error-container/20 border border-error-container text-error text-xs mb-4 flex items-center gap-2">
                <AlertTriangle className="size-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold font-heading text-on-surface mb-1">
                  School Supervisor
                </label>
                <select
                  value={editSupervisorId}
                  onChange={(e) => setEditSupervisorId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-outline-variant bg-surface-container-lowest text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                >
                  {supervisors.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name || s.email} {s.departmentName ? `(${s.departmentName})` : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold font-heading text-on-surface mb-1">
                  Placement Status
                </label>
                <select
                  value={editStatus}
                  onChange={(e) =>
                    setEditStatus(e.target.value as "pending" | "active" | "completed")
                  }
                  className="w-full px-3 py-2 rounded-xl border border-outline-variant bg-surface-container-lowest text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                >
                  <option value="pending">Pending Verification</option>
                  <option value="active">Active Placement</option>
                  <option value="completed">Completed SIWES</option>
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold font-heading text-on-surface mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    min="2020-01-01"
                    max="2035-12-31"
                    value={editStartDate}
                    onChange={(e) => setEditStartDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-outline-variant bg-surface-container-lowest text-xs text-on-surface"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold font-heading text-on-surface mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    min="2020-01-01"
                    max="2035-12-31"
                    value={editEndDate}
                    onChange={(e) => setEditEndDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-outline-variant bg-surface-container-lowest text-xs text-on-surface"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold font-heading text-on-surface mb-1">
                    Target Days
                  </label>
                  <input
                    type="number"
                    value={editTargetDays}
                    onChange={(e) => setEditTargetDays(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-outline-variant bg-surface-container-lowest text-xs text-on-surface"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-outline-variant">
                <button
                  type="button"
                  onClick={() => setEditingPlacement(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-on-surface-variant hover:bg-surface-container-high transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-on-primary text-xs font-semibold hover:bg-primary-container disabled:opacity-50 transition-all shadow-xs"
                >
                  {isPending && <Loader2 className="size-3.5 animate-spin" />}
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingPlacement && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-6 w-full max-w-md shadow-xl relative animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 text-error mb-3">
              <div className="w-10 h-10 rounded-xl bg-error-container/20 flex items-center justify-center">
                <AlertTriangle className="size-5" />
              </div>
              <h3 className="font-heading text-base font-bold text-on-surface">
                Delete Placement Record?
              </h3>
            </div>

            <p className="text-xs text-on-surface-variant mb-4 leading-relaxed">
              Are you sure you want to delete the placement for <strong className="text-on-surface">{deletingPlacement.student.name}</strong> at <strong className="text-on-surface">{deletingPlacement.organization.name}</strong>?
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-outline-variant">
              <button
                type="button"
                onClick={() => setDeletingPlacement(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-on-surface-variant hover:bg-surface-container-high transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isPending}
                onClick={() => handleDelete(deletingPlacement.id)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-error text-white text-xs font-semibold hover:bg-error/90 disabled:opacity-50 transition-all shadow-xs"
              >
                {isPending && <Loader2 className="size-3.5 animate-spin" />}
                <span>Delete Placement</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
