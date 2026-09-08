"use client";

import React, { useState, useTransition } from "react";
import {
  User,
  GraduationCap,
  Building2,
  BookOpen,
  Calendar,
  Phone,
  Camera,
  CheckCircle2,
  Pencil,
  Save,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { updateStudentProfile, uploadStudentAvatar } from "@/actions/profile";

export interface StudentProfileInitialData {
  name: string;
  department: string;
  matricNumber?: string | null;
  programId?: string | null;
  level?: string | null;
  sessionId?: string | null;
  phone?: string | null;
  profilePhotoUrl?: string | null;
}

export interface ProgramOption {
  id: string;
  name: string;
}

export interface SessionOption {
  id: string;
  label: string;
  isActive?: boolean;
}

interface StudentProfileCardProps {
  initialProfile: StudentProfileInitialData;
  programs: ProgramOption[];
  sessions: SessionOption[];
}

export function StudentProfileCard({
  initialProfile,
  programs = [],
  sessions = [],
}: StudentProfileCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, startTransition] = useTransition();
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  const [profile, setProfile] = useState<StudentProfileInitialData>(initialProfile);
  const [formData, setFormData] = useState({
    matricNumber: initialProfile.matricNumber || "",
    programId: initialProfile.programId || (programs[0]?.id ?? ""),
    level: initialProfile.level || "400 Level",
    sessionId: initialProfile.sessionId || (sessions.find((s) => s.isActive)?.id || sessions[0]?.id || ""),
    phone: initialProfile.phone || "",
    profilePhotoUrl: initialProfile.profilePhotoUrl || "",
  });

  const handleStartEdit = () => {
    setFormData({
      matricNumber: profile.matricNumber || "",
      programId: profile.programId || (programs[0]?.id ?? ""),
      level: profile.level || "400 Level",
      sessionId: profile.sessionId || (sessions.find((s) => s.isActive)?.id || sessions[0]?.id || ""),
      phone: profile.phone || "",
      profilePhotoUrl: profile.profilePhotoUrl || "",
    });
    setIsEditing(true);
  };

  const handleCancel = () => {
    setFormData({
      matricNumber: profile.matricNumber || "",
      programId: profile.programId || "",
      level: profile.level || "",
      sessionId: profile.sessionId || "",
      phone: profile.phone || "",
      profilePhotoUrl: profile.profilePhotoUrl || "",
    });
    setIsEditing(false);
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be smaller than 5MB");
      return;
    }

    try {
      setIsUploadingPhoto(true);
      const data = new FormData();
      data.append("file", file);

      const res = await uploadStudentAvatar(data);
      if (res.success && res.data?.url) {
        setFormData((prev) => ({ ...prev, profilePhotoUrl: res.data!.url }));
        setProfile((prev) => ({ ...prev, profilePhotoUrl: res.data!.url }));
        toast.success("Profile photo uploaded to Supabase Storage");
      } else {
        toast.error(res.error || "Failed to upload photo");
      }
    } catch (err) {
      console.error("Photo upload failed:", err);
      toast.error("Photo upload failed. Please try again.");
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    startTransition(async () => {
      const res = await updateStudentProfile({
        matricNumber: formData.matricNumber,
        programId: formData.programId,
        level: formData.level,
        sessionId: formData.sessionId,
        phone: formData.phone,
        profilePhotoUrl: formData.profilePhotoUrl,
      });

      if (res.success) {
        setProfile({
          ...profile,
          matricNumber: formData.matricNumber,
          programId: formData.programId,
          level: formData.level,
          sessionId: formData.sessionId,
          phone: formData.phone,
          profilePhotoUrl: formData.profilePhotoUrl,
        });
        setIsEditing(false);
        toast.success("Profile updated successfully");
      } else {
        toast.error(res.error || "Failed to update profile");
      }
    });
  };

  // Helper labels
  const selectedProgramName =
    programs.find((p) => p.id === profile.programId)?.name ||
    (profile.programId ? "Assigned Program" : null);

  const selectedSessionLabel =
    sessions.find((s) => s.id === profile.sessionId)?.label ||
    (profile.sessionId ? "Active Session" : null);

  return (
    <div
      id="profile-card"
      className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-6 shadow-xs flex flex-col gap-6"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-outline-variant/60">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-surface-container-low text-primary flex items-center justify-center">
            <User className="size-5" />
          </div>
          <div>
            <h3 className="font-heading text-lg font-semibold text-on-surface">
              Academic & Personal Identification
            </h3>
            <p className="text-xs text-on-surface-variant font-sans">
              Institutional credentials, degree program, and verified contact details.
            </p>
          </div>
        </div>

        {!isEditing ? (
          <button
            type="button"
            onClick={handleStartEdit}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-surface-container-low hover:bg-surface-container border border-outline-variant/60 text-primary text-xs font-semibold transition-all active:scale-[0.98] self-start sm:self-auto shadow-xs"
          >
            <Pencil className="size-3.5" />
            <span>Edit Profile</span>
          </button>
        ) : (
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              type="button"
              disabled={isSaving}
              onClick={handleCancel}
              className="px-3 py-1.5 rounded-lg border border-outline-variant bg-surface-container-lowest text-on-surface text-xs font-medium hover:bg-surface-container-low transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              form="profile-form"
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-primary text-on-primary text-xs font-semibold hover:bg-primary-container active:scale-[0.98] transition-all shadow-xs disabled:opacity-70"
            >
              {isSaving ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="size-3.5" />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>

      <form id="profile-form" onSubmit={handleSave} className="space-y-6">
        {/* Photo + Name Row */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 p-4 rounded-xl bg-surface-container-low/50 border border-outline-variant/40">
          {/* Avatar Container with visible Camera Badge */}
          <div className="relative shrink-0">
            <div className="w-20 h-20 rounded-2xl bg-primary text-on-primary font-heading text-2xl font-bold flex items-center justify-center shadow-xs overflow-hidden border-2 border-white relative">
              {isUploadingPhoto ? (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white">
                  <Loader2 className="size-6 animate-spin" />
                </div>
              ) : formData.profilePhotoUrl ? (
                <img
                  src={formData.profilePhotoUrl}
                  alt={profile.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span>{profile.name.charAt(0)}</span>
              )}
            </div>

            {/* Always-interactive camera badge on avatar */}
            <label
              className="absolute -bottom-1.5 -right-1.5 w-7 h-7 rounded-full bg-primary text-on-primary border-2 border-white flex items-center justify-center cursor-pointer shadow-sm hover:bg-primary-container active:scale-95 transition-all"
              title="Upload passport photo"
            >
              <Camera className="size-3.5" />
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                disabled={isUploadingPhoto}
                onChange={handlePhotoUpload}
              />
            </label>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h4 className="font-heading text-xl font-bold text-on-surface truncate">
                {profile.name}
              </h4>
              <span className="px-2 py-0.5 rounded-full bg-primary-fixed text-on-primary-fixed text-[10px] font-semibold uppercase tracking-wider font-heading">
                Undergraduate
              </span>
            </div>
            <p className="text-xs text-on-surface-variant mt-1 flex items-center gap-1.5">
              <Building2 className="size-3.5 text-primary" />
              <span>
                Department:{" "}
                <strong className="text-on-surface font-semibold">
                  {profile.department || "Computer Science"}
                </strong>{" "}
                <span className="text-on-surface-variant/80">(Read-only, set at registration)</span>
              </span>
            </p>

            {/* Explicit Upload Photo Button & File Hints */}
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-outline-variant bg-surface-container-lowest hover:bg-surface-container-low text-xs font-semibold text-primary cursor-pointer transition-all shadow-xs active:scale-[0.98]">
                {isUploadingPhoto ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin" />
                    <span>Uploading to Supabase...</span>
                  </>
                ) : (
                  <>
                    <Camera className="size-3.5" />
                    <span>{formData.profilePhotoUrl ? "Change Photo" : "Upload Passport Photo"}</span>
                  </>
                )}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  disabled={isUploadingPhoto}
                  onChange={handlePhotoUpload}
                />
              </label>
              <span className="text-[11px] text-on-surface-variant/80">
                JPG, PNG, or WebP · Max 5MB
              </span>
            </div>
          </div>
        </div>

        {/* Editable Fields Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Matric Number */}
          <div className="p-3.5 rounded-xl border border-outline-variant/60 bg-surface-container-lowest">
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant font-heading mb-1.5">
              Matriculation Number *
            </label>
            {isEditing ? (
              <input
                type="text"
                required
                placeholder="e.g. EKSU/2022/1049"
                value={formData.matricNumber}
                onChange={(e) => setFormData({ ...formData, matricNumber: e.target.value })}
                className="w-full h-9 px-3 text-xs rounded-md bg-surface-container-lowest border border-outline-variant text-on-surface uppercase focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              />
            ) : (
              <p className="text-sm font-semibold text-on-surface font-mono">
                {profile.matricNumber || <span className="text-error italic text-xs">Missing</span>}
              </p>
            )}
          </div>

          {/* Degree Program */}
          <div className="p-3.5 rounded-xl border border-outline-variant/60 bg-surface-container-lowest">
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant font-heading mb-1.5">
              Degree Program *
            </label>
            {isEditing ? (
              <select
                required
                value={formData.programId}
                onChange={(e) => setFormData({ ...formData, programId: e.target.value })}
                className="w-full h-9 px-2.5 text-xs rounded-md bg-surface-container-lowest border border-outline-variant text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all cursor-pointer"
              >
                <option value="" disabled>Select degree program</option>
                {programs.map((prog) => (
                  <option key={prog.id} value={prog.id}>
                    {prog.name}
                  </option>
                ))}
              </select>
            ) : (
              <p className="text-sm font-semibold text-on-surface">
                {selectedProgramName || <span className="text-error italic text-xs">Missing</span>}
              </p>
            )}
          </div>

          {/* Academic Level */}
          <div className="p-3.5 rounded-xl border border-outline-variant/60 bg-surface-container-lowest">
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant font-heading mb-1.5">
              Academic Level *
            </label>
            {isEditing ? (
              <select
                required
                value={formData.level}
                onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                className="w-full h-9 px-2.5 text-xs rounded-md bg-surface-container-lowest border border-outline-variant text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all cursor-pointer"
              >
                <option value="100 Level">100 Level</option>
                <option value="200 Level">200 Level</option>
                <option value="300 Level">300 Level</option>
                <option value="400 Level">400 Level</option>
                <option value="500 Level">500 Level</option>
              </select>
            ) : (
              <p className="text-sm font-semibold text-on-surface">
                {profile.level || <span className="text-error italic text-xs">Missing</span>}
              </p>
            )}
          </div>

          {/* Academic Session */}
          <div className="p-3.5 rounded-xl border border-outline-variant/60 bg-surface-container-lowest">
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant font-heading mb-1.5">
              Academic Session *
            </label>
            {isEditing ? (
              <select
                required
                value={formData.sessionId}
                onChange={(e) => setFormData({ ...formData, sessionId: e.target.value })}
                className="w-full h-9 px-2.5 text-xs rounded-md bg-surface-container-lowest border border-outline-variant text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all cursor-pointer"
              >
                <option value="" disabled>Select academic session</option>
                {sessions.map((sess) => (
                  <option key={sess.id} value={sess.id}>
                    {sess.label} {sess.isActive ? "(Active)" : ""}
                  </option>
                ))}
              </select>
            ) : (
              <p className="text-sm font-semibold text-on-surface">
                {selectedSessionLabel || <span className="text-error italic text-xs">Missing</span>}
              </p>
            )}
          </div>

          {/* Phone Number */}
          <div className="p-3.5 rounded-xl border border-outline-variant/60 bg-surface-container-lowest">
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant font-heading mb-1.5">
              Phone Number *
            </label>
            {isEditing ? (
              <input
                type="tel"
                required
                placeholder="e.g. +234 803 123 4567"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full h-9 px-3 text-xs rounded-md bg-surface-container-lowest border border-outline-variant text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              />
            ) : (
              <p className="text-sm font-semibold text-on-surface font-mono">
                {profile.phone || <span className="text-error italic text-xs">Missing</span>}
              </p>
            )}
          </div>

          {/* Passport Photo Status */}
          <div className="p-3.5 rounded-xl border border-outline-variant/60 bg-surface-container-lowest flex flex-col justify-between">
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant font-heading mb-1.5">
              Passport Photo *
            </label>
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-on-surface flex items-center gap-1.5">
                {profile.profilePhotoUrl ? (
                  <>
                    <CheckCircle2 className="size-3.5 text-success" />
                    <span>Photo Stored (Supabase)</span>
                  </>
                ) : (
                  <>
                    <span className="w-2 h-2 rounded-full bg-warning" />
                    <span>Default Avatar</span>
                  </>
                )}
              </span>
              <label className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline cursor-pointer">
                <Camera className="size-3" />
                <span>{formData.profilePhotoUrl ? "Change" : "Upload"}</span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  disabled={isUploadingPhoto}
                  onChange={handlePhotoUpload}
                />
              </label>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
