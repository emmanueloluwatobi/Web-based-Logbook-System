"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Building,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  AlertTriangle,
  X,
  Search,
  MapPin,
  Briefcase,
  Users,
  Building2,
} from "lucide-react";
import { toast } from "sonner";
import {
  createOrganization,
  updateOrganization,
  deleteOrganization,
} from "@/actions/placement";

export interface OrganizationItem {
  id: string;
  name: string;
  address: string;
  stateRegion: string;
  industryType: string;
  placementCount: number;
}

interface OrganizationListProps {
  organizations: OrganizationItem[];
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

export function OrganizationList({ organizations }: OrganizationListProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIndustry, setSelectedIndustry] = useState("all");

  // Modal dialog states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingOrg, setEditingOrg] = useState<OrganizationItem | null>(null);
  const [deletingOrg, setDeletingOrg] = useState<OrganizationItem | null>(null);

  // Form states
  const [name, setName] = useState("");
  const [industryType, setIndustryType] = useState(COMMON_INDUSTRIES[0]);
  const [address, setAddress] = useState("");
  const [stateRegion, setStateRegion] = useState("Ekiti");
  const [formError, setFormError] = useState<string | null>(null);

  // Filtered organizations
  const filteredOrgs = organizations.filter((org) => {
    const matchesSearch =
      org.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      org.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      org.stateRegion.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesIndustry =
      selectedIndustry === "all" || org.industryType === selectedIndustry;

    return matchesSearch && matchesIndustry;
  });

  // Open Create Dialog
  const handleOpenCreate = () => {
    setName("");
    setIndustryType(COMMON_INDUSTRIES[0]);
    setAddress("");
    setStateRegion("Ekiti");
    setFormError(null);
    setIsCreateOpen(true);
  };

  // Open Edit Dialog
  const handleOpenEdit = (org: OrganizationItem) => {
    setName(org.name);
    setIndustryType(org.industryType);
    setAddress(org.address);
    setStateRegion(org.stateRegion);
    setFormError(null);
    setEditingOrg(org);
  };

  // Submit Create
  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!name.trim() || !address.trim() || !stateRegion.trim()) {
      setFormError("All organization fields are required.");
      return;
    }

    const formData = new FormData();
    formData.append("name", name.trim());
    formData.append("industryType", industryType);
    formData.append("address", address.trim());
    formData.append("stateRegion", stateRegion.trim());

    startTransition(async () => {
      const res = await createOrganization(formData);
      if (!res.success) {
        setFormError(res.error || "Failed to create organization");
        toast.error(res.error || "Failed to create organization");
      } else {
        toast.success("Organization added to directory");
        setIsCreateOpen(false);
        router.refresh();
      }
    });
  };

  // Submit Edit
  const handleEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOrg) return;
    setFormError(null);

    if (!name.trim() || !address.trim() || !stateRegion.trim()) {
      setFormError("All organization fields are required.");
      return;
    }

    const formData = new FormData();
    formData.append("id", editingOrg.id);
    formData.append("name", name.trim());
    formData.append("industryType", industryType);
    formData.append("address", address.trim());
    formData.append("stateRegion", stateRegion.trim());

    startTransition(async () => {
      const res = await updateOrganization(formData);
      if (!res.success) {
        setFormError(res.error || "Failed to update organization");
        toast.error(res.error || "Failed to update organization");
      } else {
        toast.success("Organization updated successfully");
        setEditingOrg(null);
        router.refresh();
      }
    });
  };

  // Submit Delete
  const handleDelete = (id: string) => {
    startTransition(async () => {
      const res = await deleteOrganization(id);
      if (!res.success) {
        toast.error(res.error || "Failed to delete organization");
      } else {
        toast.success("Organization deleted from directory");
        setDeletingOrg(null);
        router.refresh();
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-primary-fixed text-on-primary-fixed flex items-center justify-center shadow-xs">
              <Building className="size-5 text-primary" />
            </div>
            <div>
              <h1 className="font-heading text-2xl font-bold tracking-tight text-on-surface">
                Organizations & Employers
              </h1>
              <p className="text-xs text-on-surface-variant">
                Directory of companies, institutions, and industrial training establishments
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-on-primary text-xs font-semibold hover:bg-primary-container active:scale-[0.98] transition-all shadow-xs"
        >
          <Plus className="size-4" />
          <span>New Organization</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-3 shadow-xs">
        <div className="relative w-full md:w-80">
          <Search className="size-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant" />
          <input
            type="text"
            placeholder="Search by name, state, or address..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-outline-variant bg-surface-container-lowest text-xs text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={selectedIndustry}
            onChange={(e) => setSelectedIndustry(e.target.value)}
            className="w-full md:w-64 px-3 py-2 rounded-xl border border-outline-variant bg-surface-container-lowest text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          >
            <option value="all">All Industry Sectors</option>
            {COMMON_INDUSTRIES.map((ind) => (
              <option key={ind} value={ind}>
                {ind}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Organizations Table */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-outline-variant bg-surface-container-low text-on-surface-variant font-heading uppercase text-[11px] tracking-wider">
                <th className="py-3 px-4 font-semibold">Company / Establishment</th>
                <th className="py-3 px-4 font-semibold">Industry Sector</th>
                <th className="py-3 px-4 font-semibold">Location</th>
                <th className="py-3 px-4 font-semibold text-center">Placements</th>
                <th className="py-3 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/60">
              {filteredOrgs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-on-surface-variant">
                    <Building2 className="size-8 mx-auto mb-2 opacity-40 text-primary" />
                    <p className="font-semibold text-on-surface">No organizations found</p>
                    <p className="text-[11px] mt-0.5">
                      {searchQuery || selectedIndustry !== "all"
                        ? "Try clearing your filters to see more results."
                        : "Click 'New Organization' above to register the first employer."}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredOrgs.map((org) => (
                  <tr
                    key={org.id}
                    className="hover:bg-surface-container-low/50 transition-colors"
                  >
                    <td className="py-3.5 px-4 font-medium text-on-surface">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-surface-container-high flex items-center justify-center text-primary shrink-0">
                          <Building className="size-3.5" />
                        </div>
                        <span className="font-semibold">{org.name}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-on-surface-variant">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-surface-container-high text-on-surface text-[11px] font-medium">
                        <Briefcase className="size-3 opacity-60" />
                        <span>{org.industryType}</span>
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-on-surface-variant">
                      <div className="flex items-center gap-1.5 max-w-xs truncate" title={`${org.address}, ${org.stateRegion}`}>
                        <MapPin className="size-3.5 shrink-0 opacity-60" />
                        <span className="truncate">
                          {org.address}, <strong className="font-medium text-on-surface">{org.stateRegion}</strong>
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                          org.placementCount > 0
                            ? "bg-primary/10 text-primary"
                            : "bg-surface-container text-on-surface-variant"
                        }`}
                      >
                        <Users className="size-3" />
                        <span>{org.placementCount}</span>
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleOpenEdit(org)}
                          className="p-1.5 rounded-lg text-on-surface-variant hover:text-primary hover:bg-surface-container-high transition-colors"
                          title="Edit Organization"
                        >
                          <Pencil className="size-3.5" />
                        </button>
                        <button
                          onClick={() => setDeletingOrg(org)}
                          className="p-1.5 rounded-lg text-on-surface-variant hover:text-error hover:bg-error-container/20 transition-colors"
                          title="Delete Organization"
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

      {/* Create Modal Dialog */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-6 w-full max-w-lg shadow-xl relative animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-outline-variant mb-4">
              <div className="flex items-center gap-2">
                <Building className="size-4 text-primary" />
                <h3 className="font-heading text-lg font-bold text-on-surface">
                  Register New Organization
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

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold font-heading text-on-surface mb-1">
                  Company / Organization Name <span className="text-error">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Chevron Nigeria Limited"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-outline-variant bg-surface-container-lowest text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold font-heading text-on-surface mb-1">
                    Industry Sector <span className="text-error">*</span>
                  </label>
                  <select
                    value={industryType}
                    onChange={(e) => setIndustryType(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-outline-variant bg-surface-container-lowest text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  >
                    {COMMON_INDUSTRIES.map((ind) => (
                      <option key={ind} value={ind}>
                        {ind}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold font-heading text-on-surface mb-1">
                    State / Region <span className="text-error">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Lagos, Ekiti, Abuja"
                    value={stateRegion}
                    onChange={(e) => setStateRegion(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-outline-variant bg-surface-container-lowest text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold font-heading text-on-surface mb-1">
                  Physical Office Address <span className="text-error">*</span>
                </label>
                <textarea
                  required
                  rows={2}
                  placeholder="e.g. 2 Chevron Drive, Lekki Peninsula"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-outline-variant bg-surface-container-lowest text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
                />
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
                  disabled={isPending}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-on-primary text-xs font-semibold hover:bg-primary-container disabled:opacity-50 transition-all shadow-xs"
                >
                  {isPending && <Loader2 className="size-3.5 animate-spin" />}
                  <span>Save Organization</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal Dialog */}
      {editingOrg && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-6 w-full max-w-lg shadow-xl relative animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-outline-variant mb-4">
              <div className="flex items-center gap-2">
                <Pencil className="size-4 text-primary" />
                <h3 className="font-heading text-lg font-bold text-on-surface">
                  Edit Organization
                </h3>
              </div>
              <button
                onClick={() => setEditingOrg(null)}
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
                  Company / Organization Name <span className="text-error">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-outline-variant bg-surface-container-lowest text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold font-heading text-on-surface mb-1">
                    Industry Sector <span className="text-error">*</span>
                  </label>
                  <select
                    value={industryType}
                    onChange={(e) => setIndustryType(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-outline-variant bg-surface-container-lowest text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  >
                    {COMMON_INDUSTRIES.map((ind) => (
                      <option key={ind} value={ind}>
                        {ind}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold font-heading text-on-surface mb-1">
                    State / Region <span className="text-error">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={stateRegion}
                    onChange={(e) => setStateRegion(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-outline-variant bg-surface-container-lowest text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold font-heading text-on-surface mb-1">
                  Physical Office Address <span className="text-error">*</span>
                </label>
                <textarea
                  required
                  rows={2}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-outline-variant bg-surface-container-lowest text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-outline-variant">
                <button
                  type="button"
                  onClick={() => setEditingOrg(null)}
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

      {/* Delete Confirmation Dialog */}
      {deletingOrg && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-6 w-full max-w-md shadow-xl relative animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 text-error mb-3">
              <div className="w-10 h-10 rounded-xl bg-error-container/20 flex items-center justify-center">
                <AlertTriangle className="size-5" />
              </div>
              <h3 className="font-heading text-base font-bold text-on-surface">
                Delete Organization?
              </h3>
            </div>

            <p className="text-xs text-on-surface-variant mb-4 leading-relaxed">
              Are you sure you want to remove <strong className="text-on-surface">{deletingOrg.name}</strong> from the university directory?
            </p>

            {deletingOrg.placementCount > 0 ? (
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-700 dark:text-amber-300 mb-4 flex items-center gap-2">
                <AlertTriangle className="size-4 shrink-0" />
                <span>
                  This organization has <strong>{deletingOrg.placementCount}</strong> active student placement(s) attached and cannot be deleted.
                </span>
              </div>
            ) : null}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-outline-variant">
              <button
                type="button"
                onClick={() => setDeletingOrg(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-on-surface-variant hover:bg-surface-container-high transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isPending || deletingOrg.placementCount > 0}
                onClick={() => handleDelete(deletingOrg.id)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-error text-white text-xs font-semibold hover:bg-error/90 disabled:opacity-50 transition-all shadow-xs"
              >
                {isPending && <Loader2 className="size-3.5 animate-spin" />}
                <span>Delete Organization</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
