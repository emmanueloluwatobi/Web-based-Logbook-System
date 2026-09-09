"use client";

import React, { useState } from "react";
import {
  BookOpen,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  AlertTriangle,
  X,
} from "lucide-react";
import { toast } from "sonner";
import {
  createProgram,
  updateProgram,
  deleteProgram,
} from "@/actions/admin";

export interface ProgramItem {
  id: string;
  name: string;
  departmentId: string;
  departmentName: string;
  departmentCode: string;
}

export interface DeptOption {
  id: string;
  name: string;
  code: string;
}

interface ProgramListProps {
  initialPrograms: ProgramItem[];
  departments: DeptOption[];
}

export function ProgramList({
  initialPrograms,
  departments,
}: ProgramListProps) {
  const [programs] = useState<ProgramItem[]>(initialPrograms);

  // Dialog states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingProg, setEditingProg] = useState<ProgramItem | null>(null);
  const [deletingProg, setDeletingProg] = useState<ProgramItem | null>(null);

  // Form states
  const [name, setName] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Open Create Dialog
  const handleOpenCreate = () => {
    setName("");
    setDepartmentId(departments[0]?.id || "");
    setFormError(null);
    setIsCreateOpen(true);
  };

  // Open Edit Dialog
  const handleOpenEdit = (prog: ProgramItem) => {
    setName(prog.name);
    setDepartmentId(prog.departmentId);
    setFormError(null);
    setEditingProg(prog);
  };

  // Submit Create
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!name.trim() || !departmentId) {
      setFormError("Please provide program name and select a department.");
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await createProgram({
        name: name.trim(),
        departmentId,
      });

      if (!res.success) {
        setFormError(res.error || "Failed to create program.");
        toast.error(res.error || "Failed to create program");
        setIsSubmitting(false);
        return;
      }

      toast.success("Degree program created successfully");
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
    if (!editingProg) return;
    setFormError(null);

    if (!name.trim() || !departmentId) {
      setFormError("Please provide program name and select a department.");
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await updateProgram({
        id: editingProg.id,
        name: name.trim(),
        departmentId,
      });

      if (!res.success) {
        setFormError(res.error || "Failed to update program.");
        toast.error(res.error || "Failed to update program");
        setIsSubmitting(false);
        return;
      }

      toast.success("Degree program updated successfully");
      setEditingProg(null);
      setIsSubmitting(false);
    } catch (err) {
      console.error(err);
      toast.error("An unexpected error occurred");
      setIsSubmitting(false);
    }
  };

  // Submit Delete
  const handleDelete = async () => {
    if (!deletingProg) return;

    try {
      setIsSubmitting(true);
      const res = await deleteProgram(deletingProg.id);
      if (!res.success) {
        toast.error(res.error || "Failed to delete program");
        setIsSubmitting(false);
        return;
      }

      toast.success("Degree program removed");
      setDeletingProg(null);
      setIsSubmitting(false);
    } catch (err) {
      console.error(err);
      toast.error("An unexpected error occurred");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight text-on-surface">
            Degree Programs
          </h1>
          <p className="font-sans text-sm text-on-surface-variant mt-0.5">
            Configure academic courses and degrees offered by university departments.
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          disabled={departments.length === 0}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-on-primary text-sm font-medium hover:bg-primary-container active:scale-[0.98] transition-all disabled:opacity-50 shadow-xs"
        >
          <Plus className="size-4" />
          <span>New Program</span>
        </button>
      </div>

      {departments.length === 0 && (
        <div className="p-4 rounded-xl bg-error-container/30 border border-error/30 text-xs text-on-error-container flex items-center gap-3">
          <AlertTriangle className="size-5 shrink-0 text-error" />
          <span>
            You must register at least one Department before creating degree programs.
          </span>
        </div>
      )}

      {/* Main Table Card */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl overflow-hidden shadow-xs">
        {programs.length === 0 ? (
          <div className="text-center py-16 px-4">
            <div className="w-12 h-12 rounded-xl bg-surface-container-low text-primary flex items-center justify-center mx-auto mb-3">
              <BookOpen className="size-6" />
            </div>
            <h3 className="font-heading text-base font-semibold text-on-surface">
              No programs registered
            </h3>
            <p className="text-xs text-on-surface-variant max-w-sm mx-auto mt-1 mb-6">
              Degree programs allow students to specify their field of study during profile onboarding.
            </p>
            <button
              onClick={handleOpenCreate}
              disabled={departments.length === 0}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-on-primary text-sm font-medium hover:bg-primary-container transition-all disabled:opacity-50"
            >
              <Plus className="size-4" />
              <span>Create First Program</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-outline-variant/70 bg-surface-container-low/40">
                  <th className="py-3 px-6 text-xs font-semibold text-on-surface-variant uppercase tracking-wider font-heading">
                    Program Name
                  </th>
                  <th className="py-3 px-6 text-xs font-semibold text-on-surface-variant uppercase tracking-wider font-heading">
                    Parent Department
                  </th>
                  <th className="py-3 px-6 text-xs font-semibold text-on-surface-variant uppercase tracking-wider font-heading text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/40">
                {programs.map((prog) => (
                  <tr
                    key={prog.id}
                    className="hover:bg-surface-container-low transition-colors text-sm"
                  >
                    <td className="py-4 px-6 font-medium text-on-surface">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-primary shrink-0">
                          <BookOpen className="size-4" />
                        </div>
                        <span>{prog.name}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="inline-flex items-center gap-2">
                        <span className="text-sm text-on-surface">
                          {prog.departmentName}
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-surface-container font-mono text-[11px] font-semibold text-primary">
                          {prog.departmentCode}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button
                          onClick={() => handleOpenEdit(prog)}
                          className="p-1.5 text-on-surface-variant hover:text-primary hover:bg-surface-container rounded-md transition-colors"
                          title="Edit program"
                        >
                          <Pencil className="size-4" />
                        </button>
                        <button
                          onClick={() => setDeletingProg(prog)}
                          className="p-1.5 text-on-surface-variant hover:text-error hover:bg-error-container/20 rounded-md transition-colors"
                          title="Delete program"
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
                Create Degree Program
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
                  Program Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. B.Sc. Computer Science"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full h-10 px-3 text-sm rounded-md bg-surface-container-lowest border border-outline-variant text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant font-heading mb-1.5">
                  Parent Department *
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
                  <span>Create Program</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT DIALOG MODAL */}
      {editingProg && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-surface-container-lowest rounded-2xl border border-outline-variant p-6 shadow-xl relative animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-outline-variant">
              <h2 className="font-heading text-lg font-semibold text-on-surface">
                Edit Degree Program
              </h2>
              <button
                onClick={() => setEditingProg(null)}
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
                  Program Name *
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
                  Parent Department *
                </label>
                <select
                  required
                  value={departmentId}
                  onChange={(e) => setDepartmentId(e.target.value)}
                  className="w-full h-10 px-3 text-sm rounded-md bg-surface-container-lowest border border-outline-variant text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all cursor-pointer"
                >
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name} ({dept.code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-outline-variant">
                <button
                  type="button"
                  onClick={() => setEditingProg(null)}
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
      {deletingProg && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-surface-container-lowest rounded-2xl border border-outline-variant p-6 shadow-xl relative animate-in fade-in zoom-in-95 duration-150">
            <div className="w-11 h-11 rounded-xl bg-error-container text-on-error-container flex items-center justify-center mb-4">
              <AlertTriangle className="size-5 text-error" />
            </div>

            <h3 className="font-heading text-lg font-semibold text-on-surface">
              Delete Program
            </h3>
            <p className="text-sm text-on-surface-variant mt-2">
              Are you sure you want to delete <span className="font-semibold text-on-surface">{deletingProg.name}</span>?
            </p>

            <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-outline-variant">
              <button
                type="button"
                onClick={() => setDeletingProg(null)}
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
                <span>Delete Program</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
