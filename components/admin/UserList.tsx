"use client";

import React, { useState } from "react";
import {
  Users,
  Plus,
  Trash2,
  Send,
  Loader2,
  AlertTriangle,
  X,
  Shield,
  Briefcase,
  Building2,
  Mail,
} from "lucide-react";
import { toast } from "sonner";
import {
  createStaffUser,
  resendStaffInvite,
  deleteStaffUser,
} from "@/actions/admin";

export interface StaffUserItem {
  id: string;
  name: string;
  email: string;
  role: "admin" | "hod" | "school_supervisor" | "student" | "industry_supervisor";
  departmentId: string | null;
  departmentName: string | null;
  departmentCode: string | null;
  createdAt: string | Date;
}

export interface DeptOption {
  id: string;
  name: string;
  code: string;
}

interface UserListProps {
  initialUsers: StaffUserItem[];
  departments: DeptOption[];
  currentAdminId: string;
}

export function UserList({
  initialUsers,
  departments,
  currentAdminId,
}: UserListProps) {
  const [users] = useState<StaffUserItem[]>(initialUsers);
  const [filterRole, setFilterRole] = useState<string>("all");

  // Dialog states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [deletingUser, setDeletingUser] = useState<StaffUserItem | null>(null);

  // Form states
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"school_supervisor" | "hod" | "admin">("school_supervisor");
  const [departmentId, setDepartmentId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resendingId, setResendingId] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  // Open Create Dialog
  const handleOpenCreate = () => {
    setName("");
    setEmail("");
    setRole("school_supervisor");
    setDepartmentId(departments[0]?.id || "");
    setFormError(null);
    setIsCreateOpen(true);
  };

  // Submit Create
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!name.trim() || !email.trim()) {
      setFormError("Name and email are required.");
      return;
    }

    if (role !== "admin" && !departmentId) {
      setFormError("Please select a department for this role.");
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await createStaffUser({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        role,
        departmentId: role === "admin" ? null : departmentId,
      });

      if (!res.success) {
        setFormError(res.error || "Failed to create staff user.");
        toast.error(res.error || "Failed to create staff user");
        setIsSubmitting(false);
        return;
      }

      toast.success(`Account created! Invitation email sent to ${email}`);
      setIsCreateOpen(false);
      setIsSubmitting(false);
    } catch (err) {
      console.error(err);
      toast.error("An unexpected error occurred");
      setIsSubmitting(false);
    }
  };

  // Resend Invite
  const handleResendInvite = async (user: StaffUserItem) => {
    try {
      setResendingId(user.id);
      const res = await resendStaffInvite(user.id);

      if (!res.success) {
        toast.error(res.error || "Failed to resend invitation email");
        setResendingId(null);
        return;
      }

      toast.success(`Fresh invitation link sent to ${user.email}`);
      setResendingId(null);
    } catch (err) {
      console.error(err);
      toast.error("An unexpected error occurred");
      setResendingId(null);
    }
  };

  // Submit Delete
  const handleDelete = async () => {
    if (!deletingUser) return;

    try {
      setIsSubmitting(true);
      const res = await deleteStaffUser(deletingUser.id);
      if (!res.success) {
        toast.error(res.error || "Failed to delete user");
        setIsSubmitting(false);
        return;
      }

      toast.success("Staff user removed");
      setDeletingUser(null);
      setIsSubmitting(false);
    } catch (err) {
      console.error(err);
      toast.error("An unexpected error occurred");
      setIsSubmitting(false);
    }
  };

  // Filtered users
  const filteredUsers = users.filter((u) => {
    if (filterRole === "all") return true;
    return u.role === filterRole;
  });

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "admin":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary-fixed text-on-primary-fixed text-xs font-semibold uppercase tracking-wider">
            <Shield className="size-3" />
            <span>Admin</span>
          </span>
        );
      case "hod":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-secondary-container text-on-secondary-container text-xs font-semibold uppercase tracking-wider">
            <Building2 className="size-3" />
            <span>Head of Dept</span>
          </span>
        );
      case "school_supervisor":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-surface-container text-on-surface-variant text-xs font-semibold uppercase tracking-wider">
            <Briefcase className="size-3" />
            <span>Supervisor</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-surface-container text-on-surface-variant text-xs font-medium">
            <span>{role}</span>
          </span>
        );
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight text-on-surface">
            Staff & User Provisioning
          </h1>
          <p className="font-sans text-sm text-on-surface-variant mt-0.5">
            Create and manage institutional accounts for School Supervisors, HODs, and Administrators.
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-on-primary text-sm font-medium hover:bg-primary-container active:scale-[0.98] transition-all shadow-xs"
        >
          <Plus className="size-4" />
          <span>Invite Staff Member</span>
        </button>
      </div>

      {/* Role Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-outline-variant/60 pb-3">
        {[
          { label: "All Staff", value: "all" },
          { label: "Supervisors", value: "school_supervisor" },
          { label: "HODs", value: "hod" },
          { label: "Admins", value: "admin" },
        ].map((tab) => (
          <button
            key={tab.value}
            onClick={() => setFilterRole(tab.value)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              filterRole === tab.value
                ? "bg-primary text-on-primary shadow-xs"
                : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Main Table Card */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl overflow-hidden shadow-xs">
        {filteredUsers.length === 0 ? (
          <div className="text-center py-16 px-4">
            <div className="w-12 h-12 rounded-xl bg-surface-container-low text-primary flex items-center justify-center mx-auto mb-3">
              <Users className="size-6" />
            </div>
            <h3 className="font-heading text-base font-semibold text-on-surface">
              No staff users found
            </h3>
            <p className="text-xs text-on-surface-variant max-w-sm mx-auto mt-1 mb-6">
              Invite faculty members and administrators to access their respective departmental dashboards.
            </p>
            <button
              onClick={handleOpenCreate}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-on-primary text-sm font-medium hover:bg-primary-container transition-all"
            >
              <Plus className="size-4" />
              <span>Invite Staff Member</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-outline-variant/70 bg-surface-container-low/40">
                  <th className="py-3 px-6 text-xs font-semibold text-on-surface-variant uppercase tracking-wider font-heading">
                    Staff Member
                  </th>
                  <th className="py-3 px-6 text-xs font-semibold text-on-surface-variant uppercase tracking-wider font-heading">
                    Role
                  </th>
                  <th className="py-3 px-6 text-xs font-semibold text-on-surface-variant uppercase tracking-wider font-heading">
                    Department
                  </th>
                  <th className="py-3 px-6 text-xs font-semibold text-on-surface-variant uppercase tracking-wider font-heading">
                    Date Added
                  </th>
                  <th className="py-3 px-6 text-xs font-semibold text-on-surface-variant uppercase tracking-wider font-heading text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/40">
                {filteredUsers.map((u) => {
                  const isCurrentAdmin = u.id === currentAdminId;
                  return (
                    <tr
                      key={u.id}
                      className="hover:bg-surface-container-low transition-colors text-sm"
                    >
                      <td className="py-4 px-6 font-medium text-on-surface">
                        <div>
                          <p className="font-semibold text-on-surface flex items-center gap-1.5">
                            <span>{u.name}</span>
                            {isCurrentAdmin && (
                              <span className="text-[10px] text-primary font-normal bg-primary-fixed/50 px-1.5 py-0.2 rounded">
                                You
                              </span>
                            )}
                          </p>
                          <p className="text-xs text-on-surface-variant font-normal">
                            {u.email}
                          </p>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        {getRoleBadge(u.role)}
                      </td>
                      <td className="py-4 px-6">
                        {u.departmentName ? (
                          <div className="inline-flex items-center gap-1.5 text-xs text-on-surface">
                            <span>{u.departmentName}</span>
                            <span className="font-mono text-[10px] font-semibold text-primary px-1.5 py-0.5 rounded bg-surface-container">
                              {u.departmentCode}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-on-surface-variant italic">
                            {u.role === "admin" ? "Institutional (All Departments)" : "Unassigned"}
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-xs text-on-surface-variant">
                        {new Date(u.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="inline-flex items-center gap-1">
                          <button
                            onClick={() => handleResendInvite(u)}
                            disabled={resendingId === u.id}
                            className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-md bg-surface-container-low hover:bg-surface-container text-primary border border-outline-variant/60 transition-colors disabled:opacity-50"
                            title="Resend password setup invitation email"
                          >
                            {resendingId === u.id ? (
                              <Loader2 className="size-3 animate-spin" />
                            ) : (
                              <Send className="size-3" />
                            )}
                            <span className="hidden sm:inline">Resend Invite</span>
                          </button>

                          {!isCurrentAdmin && (
                            <button
                              onClick={() => setDeletingUser(u)}
                              className="p-1.5 text-on-surface-variant hover:text-error hover:bg-error-container/20 rounded-md transition-colors"
                              title="Delete user"
                            >
                              <Trash2 className="size-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CREATE STAFF USER MODAL */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-surface-container-lowest rounded-2xl border border-outline-variant p-6 shadow-xl relative animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-outline-variant">
              <h2 className="font-heading text-lg font-semibold text-on-surface">
                Invite Staff Member
              </h2>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="p-1 text-on-surface-variant hover:text-on-surface rounded-md"
              >
                <X className="size-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4 pt-4">
              {formError && (
                <div className="p-3 rounded-lg bg-error-container/40 border border-error/30 text-xs text-on-error-container flex items-start gap-2">
                  <AlertTriangle className="size-4 shrink-0 text-error mt-0.5" />
                  <span>{formError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant font-heading mb-1.5">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr. Jane Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full h-10 px-3 text-sm rounded-md bg-surface-container-lowest border border-outline-variant text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant font-heading mb-1.5">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  placeholder="e.g. jdoe@eksu.edu.ng"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-10 px-3 text-sm rounded-md bg-surface-container-lowest border border-outline-variant text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant font-heading mb-1.5">
                  Staff Role *
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as "school_supervisor" | "hod" | "admin")}
                  className="w-full h-10 px-3 text-sm rounded-md bg-surface-container-lowest border border-outline-variant text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all cursor-pointer"
                >
                  <option value="school_supervisor">School Supervisor (Departmental Reviewer)</option>
                  <option value="hod">Head of Department (HOD - Oversight & Placement)</option>
                  <option value="admin">System Administrator (Global Oversight)</option>
                </select>
              </div>

              {role !== "admin" && (
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant font-heading mb-1.5">
                    Department *
                  </label>
                  <select
                    required
                    value={departmentId}
                    onChange={(e) => setDepartmentId(e.target.value)}
                    className="w-full h-10 px-3 text-sm rounded-md bg-surface-container-lowest border border-outline-variant text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all cursor-pointer"
                  >
                    <option value="" disabled>
                      Select Department
                    </option>
                    {departments.map((dept) => (
                      <option key={dept.id} value={dept.id}>
                        {dept.name} ({dept.code})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="p-3 rounded-lg bg-surface-container-low border border-outline-variant/60 text-xs text-on-surface-variant flex items-start gap-2">
                <Mail className="size-4 shrink-0 text-primary mt-0.5" />
                <p>
                  An invitation email with a secure 48-hour password setup link will be dispatched automatically to this email.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-outline-variant">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-md border border-outline-variant bg-surface-container-lowest text-on-surface text-sm font-medium hover:bg-surface-container-low transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-on-primary text-sm font-medium hover:bg-primary-container active:scale-[0.98] transition-all disabled:opacity-50 shadow-xs"
                >
                  {isSubmitting && <Loader2 className="size-4 animate-spin" />}
                  <span>Send Invitation</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRM DIALOG */}
      {deletingUser && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-surface-container-lowest rounded-2xl border border-outline-variant p-6 shadow-xl relative animate-in fade-in zoom-in-95 duration-150">
            <div className="w-11 h-11 rounded-xl bg-error-container text-on-error-container flex items-center justify-center mb-4">
              <AlertTriangle className="size-5 text-error" />
            </div>

            <h3 className="font-heading text-lg font-semibold text-on-surface">
              Remove Staff User
            </h3>
            <p className="text-sm text-on-surface-variant mt-2">
              Are you sure you want to remove <span className="font-semibold text-on-surface">{deletingUser.name}</span> ({deletingUser.email})?
            </p>
            <p className="text-xs text-on-surface-variant mt-2">
              Their access to the portal will be immediately terminated.
            </p>

            <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-outline-variant">
              <button
                type="button"
                onClick={() => setDeletingUser(null)}
                disabled={isSubmitting}
                className="px-4 py-2 rounded-md border border-outline-variant bg-surface-container-lowest text-on-surface text-sm font-medium hover:bg-surface-container-low transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-error text-on-error text-sm font-medium hover:bg-error/90 active:scale-[0.98] transition-all disabled:opacity-50 shadow-xs"
              >
                {isSubmitting && <Loader2 className="size-4 animate-spin" />}
                <span>Remove Staff Member</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
