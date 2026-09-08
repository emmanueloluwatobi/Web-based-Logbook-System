"use client";

import React, { useState } from "react";
import {
  Building2,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  AlertTriangle,
  X,
  BookOpen,
} from "lucide-react";
import { toast } from "sonner";
import {
  createDepartment,
  updateDepartment,
  deleteDepartment,
} from "@/actions/admin";

export interface DepartmentItem {
  id: string;
  name: string;
  code: string;
  createdAt: string | Date;
  programCount: number;
}

interface DepartmentListProps {
  initialDepartments: DepartmentItem[];
}

export function DepartmentList({ initialDepartments }: DepartmentListProps) {
  const [departments] = useState<DepartmentItem[]>(initialDepartments);

  // Dialog states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<DepartmentItem | null>(null);
  const [deletingDept, setDeletingDept] = useState<DepartmentItem | null>(null);

  // Form states
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Open Create Dialog
  const handleOpenCreate = () => {
    setName("");
    setCode("");
    setFormError(null);
    setIsCreateOpen(true);
  };

  // Open Edit Dialog
  const handleOpenEdit = (dept: DepartmentItem) => {
    setName(dept.name);
    setCode(dept.code);
    setFormError(null);
    setEditingDept(dept);
  };

  // Submit Create
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!name.trim() || !code.trim()) {
      setFormError("Please provide both department name and code.");
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await createDepartment({ name, code });
      if (!res.success) {
        setFormError(res.error || "Failed to create department.");
        toast.error(res.error || "Failed to create department");
        setIsSubmitting(false);
        return;
      }

      toast.success("Department created successfully");
      setIsCreateOpen(false);
      setIsSubmitting(false);
    } catch (err) {
      console.error(err);
      toast.error("An unexpected error occurred");
      setIsSubmitting(false);
    }
  };

  // Submit Edit
  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDept) return;
    setFormError(null);

    if (!name.trim() || !code.trim()) {
      setFormError("Please provide both department name and code.");
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await updateDepartment({
        id: editingDept.id,
        name,
        code,
      });

      if (!res.success) {
        setFormError(res.error || "Failed to update department.");
        toast.error(res.error || "Failed to update department");
        setIsSubmitting(false);
        return;
      }

      toast.success("Department updated successfully");
      setEditingDept(null);
      setIsSubmitting(false);
    } catch (err) {
      console.error(err);
      toast.error("An unexpected error occurred");
      setIsSubmitting(false);
    }
  };

  // Submit Delete
  const handleDelete = async () => {
    if (!deletingDept) return;

    try {
      setIsSubmitting(true);
      const res = await deleteDepartment(deletingDept.id);
      if (!res.success) {
        toast.error(res.error || "Failed to delete department");
        setIsSubmitting(false);
        return;
      }

      toast.success("Department removed");
      setDeletingDept(null);
      setIsSubmitting(false);
    } catch (err) {
      console.error(err);
      toast.error("An unexpected error occurred");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Top action header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight text-on-surface">
            Departments
          </h1>
          <p className="font-sans text-sm text-on-surface-variant mt-0.5">
            Manage institutional academic faculties and departments.
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-on-primary text-sm font-medium hover:bg-primary-container active:scale-[0.98] transition-all shadow-xs"
        >
          <Plus className="size-4" />
          <span>New Department</span>
        </button>
      </div>

      {/* Main Table Card */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl overflow-hidden shadow-xs">
        {departments.length === 0 ? (
          <div className="text-center py-16 px-4">
            <div className="w-12 h-12 rounded-xl bg-surface-container-low text-primary flex items-center justify-center mx-auto mb-3">
              <Building2 className="size-6" />
            </div>
            <h3 className="font-heading text-base font-semibold text-on-surface">
              No departments registered
            </h3>
            <p className="text-xs text-on-surface-variant max-w-sm mx-auto mt-1 mb-6">
              Create university departments before creating degree programs or student accounts.
            </p>
            <button
              onClick={handleOpenCreate}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-on-primary text-sm font-medium hover:bg-primary-container transition-all"
            >
              <Plus className="size-4" />
              <span>Create First Department</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-outline-variant/70 bg-surface-container-low/40">
                  <th className="py-3 px-6 text-xs font-semibold text-on-surface-variant uppercase tracking-wider font-heading">
                    Department Name
                  </th>
                  <th className="py-3 px-6 text-xs font-semibold text-on-surface-variant uppercase tracking-wider font-heading">
                    Code
                  </th>
                  <th className="py-3 px-6 text-xs font-semibold text-on-surface-variant uppercase tracking-wider font-heading">
                    Programs
                  </th>
                  <th className="py-3 px-6 text-xs font-semibold text-on-surface-variant uppercase tracking-wider font-heading">
                    Registered
                  </th>
                  <th className="py-3 px-6 text-xs font-semibold text-on-surface-variant uppercase tracking-wider font-heading text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/40">
                {departments.map((dept) => (
                  <tr
                    key={dept.id}
                    className="hover:bg-surface-container-low transition-colors text-sm"
                  >
                    <td className="py-4 px-6 font-medium text-on-surface">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-primary shrink-0">
                          <Building2 className="size-4" />
                        </div>
                        <span>{dept.name}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className="px-2.5 py-1 rounded-md bg-surface-container-low border border-outline-variant/60 font-mono text-xs font-semibold text-primary">
                        {dept.code}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-secondary-container text-on-secondary-container text-xs font-medium">
                        <BookOpen className="size-3" />
                        <span>{dept.programCount} {dept.programCount === 1 ? "Program" : "Programs"}</span>
                      </span>
                    </td>
                    <td className="py-4 px-6 text-xs text-on-surface-variant">
                      {new Date(dept.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button
                          onClick={() => handleOpenEdit(dept)}
                          className="p-1.5 text-on-surface-variant hover:text-primary hover:bg-surface-container rounded-md transition-colors"
                          title="Edit department"
                        >
                          <Pencil className="size-4" />
                        </button>
                        <button
                          onClick={() => setDeletingDept(dept)}
                          className="p-1.5 text-on-surface-variant hover:text-error hover:bg-error-container/20 rounded-md transition-colors"
                          title="Delete department"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CREATE DIALOG MODAL */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-surface-container-lowest rounded-2xl border border-outline-variant p-6 shadow-xl relative animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-outline-variant">
              <h2 className="font-heading text-lg font-semibold text-on-surface">
                Create Department
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
                  Department Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Computer Science"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full h-10 px-3 text-sm rounded-md bg-surface-container-lowest border border-outline-variant text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant font-heading mb-1.5">
                  Department Code *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. CSC"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="w-full h-10 px-3 text-sm rounded-md bg-surface-container-lowest border border-outline-variant text-on-surface uppercase placeholder:normal-case placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                />
                <p className="text-[11px] text-on-surface-variant mt-1">
                  Unique short code used across matriculation and course catalogs.
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
                  <span>Create Department</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT DIALOG MODAL */}
      {editingDept && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-surface-container-lowest rounded-2xl border border-outline-variant p-6 shadow-xl relative animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-outline-variant">
              <h2 className="font-heading text-lg font-semibold text-on-surface">
                Edit Department
              </h2>
              <button
                onClick={() => setEditingDept(null)}
                className="p-1 text-on-surface-variant hover:text-on-surface rounded-md"
              >
                <X className="size-5" />
              </button>
            </div>

            <form onSubmit={handleEdit} className="space-y-4 pt-4">
              {formError && (
                <div className="p-3 rounded-lg bg-error-container/40 border border-error/30 text-xs text-on-error-container flex items-start gap-2">
                  <AlertTriangle className="size-4 shrink-0 text-error mt-0.5" />
                  <span>{formError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant font-heading mb-1.5">
                  Department Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full h-10 px-3 text-sm rounded-md bg-surface-container-lowest border border-outline-variant text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant font-heading mb-1.5">
                  Department Code *
                </label>
                <input
                  type="text"
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="w-full h-10 px-3 text-sm rounded-md bg-surface-container-lowest border border-outline-variant text-on-surface uppercase focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-outline-variant">
                <button
                  type="button"
                  onClick={() => setEditingDept(null)}
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
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRM DIALOG */}
      {deletingDept && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-surface-container-lowest rounded-2xl border border-outline-variant p-6 shadow-xl relative animate-in fade-in zoom-in-95 duration-150">
            <div className="w-11 h-11 rounded-xl bg-error-container text-on-error-container flex items-center justify-center mb-4">
              <AlertTriangle className="size-5 text-error" />
            </div>

            <h3 className="font-heading text-lg font-semibold text-on-surface">
              Delete Department
            </h3>
            <p className="text-sm text-on-surface-variant mt-2">
              Are you sure you want to delete <span className="font-semibold text-on-surface">{deletingDept.name}</span> ({deletingDept.code})?
            </p>

            {deletingDept.programCount > 0 && (
              <div className="mt-3 p-3 rounded-lg bg-error-container/30 border border-error/30 text-xs text-error leading-relaxed">
                Warning: This department has <span className="font-semibold">{deletingDept.programCount}</span> registered programs. You must delete or reassign those programs before deleting this department.
              </div>
            )}

            <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-outline-variant">
              <button
                type="button"
                onClick={() => setDeletingDept(null)}
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
                <span>Delete Department</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
