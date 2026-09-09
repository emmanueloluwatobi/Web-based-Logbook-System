"use client";

import React, { useState } from "react";
import {
  Clock,
  UploadCloud,
  Save,
  Send,
  Paperclip,
  X,
  ArrowLeft,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { EntryStatus } from "./EntryStatusBadge";
import { createEntry, updateEntry, resubmitEntry } from "@/actions/logbook";

export interface LogbookEntryFormData {
  id?: string;
  entryDate: string;
  hoursWorked: number;
  activityDescription: string;
  skillsGained: string;
  challenges: string;
  attachmentName?: string;
  attachmentUrl?: string;
  status: EntryStatus;
  versionNumber?: number;
  submittedAt?: string;
}

interface EntryFormProps {
  onSubmit?: (data: LogbookEntryFormData, isDraft: boolean) => void;
  onCancel?: () => void;
  initialData?: LogbookEntryFormData | null;
  mode?: "create" | "edit" | "resubmit";
}

export function EntryForm({
  onSubmit,
  onCancel,
  initialData,
  mode,
}: EntryFormProps) {
  const today = new Date().toISOString().split("T")[0];

  const [entryDate, setEntryDate] = useState(initialData?.entryDate || today);
  const [startTime, setStartTime] = useState("08:00");
  const [endTime, setEndTime] = useState("16:00");
  const [hoursWorked, setHoursWorked] = useState<number>(initialData?.hoursWorked || 8.0);
  const [activityDescription, setActivityDescription] = useState(
    initialData?.activityDescription || ""
  );
  const [skillsGained, setSkillsGained] = useState(initialData?.skillsGained || "");
  const [challenges, setChallenges] = useState(initialData?.challenges || "");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [attachmentName, setAttachmentName] = useState(
    initialData?.attachmentName || ""
  );
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Derive hoursWorked from Start Time and End Time (UI convenience only)
  const calculateDerivedHours = (sTime: string, eTime: string) => {
    if (sTime && eTime) {
      const [startH, startM] = sTime.split(":").map(Number);
      const [endH, endM] = eTime.split(":").map(Number);
      const startMinutes = startH * 60 + startM;
      const endMinutes = endH * 60 + endM;
      const diffMinutes = endMinutes - startMinutes;

      if (diffMinutes > 0) {
        const calculated = Math.round((diffMinutes / 60) * 10) / 10;
        setHoursWorked(calculated);
      }
    }
  };

  const handleFile = (file: File | undefined) => {
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Attachment must be smaller than 10MB");
      return;
    }
    setSelectedFile(file);
    setAttachmentName(file.name);
    toast.info(`Attachment "${file.name}" attached`);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    handleFile(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    handleFile(file);
  };

  const isResubmitMode = mode === "resubmit" || initialData?.status === "needs_correction";

  const handleFormSubmit = async (isDraft: boolean) => {
    if (!isDraft && !activityDescription.trim()) {
      toast.error("Please enter a description of the daily activities completed.");
      return;
    }

    if (!entryDate) {
      toast.error("Please select an entry date.");
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      if (initialData?.id) {
        formData.append("id", initialData.id);
        formData.append("originalEntryId", initialData.id);
      }
      formData.append("entryDate", entryDate);
      formData.append("hoursWorked", String(hoursWorked));
      formData.append("activityDescription", activityDescription);
      formData.append("skillsGained", skillsGained);
      formData.append("challenges", challenges);
      formData.append("isDraft", isDraft ? "true" : "false");
      if (selectedFile) {
        formData.append("attachment", selectedFile);
      }

      const res = isResubmitMode
        ? await resubmitEntry(formData)
        : initialData?.id
        ? await updateEntry(formData)
        : await createEntry(formData);

      if (res.success && res.data) {
        if (isResubmitMode) {
          toast.success(
            `Correction submitted as Version ${res.data.versionNumber || (initialData?.versionNumber || 1) + 1}. Awaiting supervisor review.`
          );
        } else {
          toast.success(
            isDraft
              ? "Entry saved as draft"
              : "Daily logbook entry submitted for supervisor review"
          );
        }

        // Reset fields if newly created
        if (!initialData?.id) {
          setActivityDescription("");
          setSkillsGained("");
          setChallenges("");
          setSelectedFile(null);
          setAttachmentName("");
        }

        if (onSubmit) {
          onSubmit(
            {
              id: res.data.id,
              entryDate,
              hoursWorked,
              activityDescription,
              skillsGained,
              challenges,
              attachmentName: selectedFile?.name || attachmentName,
              status: isResubmitMode ? "submitted" : isDraft ? "draft" : "submitted",
              submittedAt: isDraft && !isResubmitMode ? undefined : new Date().toISOString(),
              versionNumber: res.data.versionNumber,
            },
            isDraft && !isResubmitMode
          );
        }
      } else {
        toast.error(res.error || "Failed to save logbook entry");
      }
    } catch (err) {
      console.error("[EntryForm.handleFormSubmit]", err);
      toast.error("An unexpected error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDiscard = () => {
    if (onCancel) {
      onCancel();
    } else {
      setActivityDescription("");
      setSkillsGained("");
      setChallenges("");
      setSelectedFile(null);
      setAttachmentName("");
      setStartTime("08:00");
      setEndTime("16:00");
      setHoursWorked(8.0);
      toast.info("Form reset");
    }
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Page / Section Header */}
      <div>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary-container transition-colors mb-2 group"
          >
            <ArrowLeft className="size-3.5 group-hover:-translate-x-0.5 transition-transform" />
            <span>Back to All Entries</span>
          </button>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-on-surface">
              {isResubmitMode
                ? "Revise & Resubmit Entry"
                : initialData
                ? "Edit Logbook Entry"
                : "Add Daily Activity"}
            </h1>
            <p className="font-sans text-xs sm:text-sm text-on-surface-variant mt-1">
              {isResubmitMode
                ? `Address supervisor feedback and submit this revision as Version ${(initialData?.versionNumber || 1) + 1}.`
                : "Record your daily tasks, learning outcomes, and challenges."}
            </p>
          </div>

          <div className="shrink-0 flex items-center gap-2">
            {isResubmitMode ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-error-container/40 text-on-error-container text-xs font-semibold border border-error/30">
                <span className="w-1.5 h-1.5 rounded-full bg-error" />
                <span>Revision Mode (v{(initialData?.versionNumber || 1) + 1})</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-container text-on-surface-variant text-xs font-semibold border border-outline-variant/50">
                <span className="w-1.5 h-1.5 rounded-full bg-outline" />
                <span>{initialData ? "Editing Draft" : "Draft"}</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Main Full-Page Form Card */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-6 sm:p-8 shadow-xs space-y-6">
        {/* Row 1: Date, Start Time, End Time */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant font-heading mb-1.5">
              Date *
            </label>
            <div className="relative">
              <input
                type="date"
                required
                value={entryDate}
                onChange={(e) => setEntryDate(e.target.value)}
                className="w-full h-10 px-3 text-sm rounded-md bg-surface-container-lowest border border-outline-variant text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant font-heading mb-1.5">
              Start Time
            </label>
            <div className="relative">
              <input
                type="time"
                value={startTime}
                onChange={(e) => {
                  setStartTime(e.target.value);
                  calculateDerivedHours(e.target.value, endTime);
                }}
                className="w-full h-10 px-3 text-sm rounded-md bg-surface-container-lowest border border-outline-variant text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant font-heading mb-1.5">
              End Time
            </label>
            <div className="relative">
              <input
                type="time"
                value={endTime}
                onChange={(e) => {
                  setEndTime(e.target.value);
                  calculateDerivedHours(startTime, e.target.value);
                }}
                className="w-full h-10 px-3 text-sm rounded-md bg-surface-container-lowest border border-outline-variant text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              />
            </div>
          </div>
        </div>

        {/* Derived Hours Worked Indicator */}
        <div className="flex items-center justify-between px-3.5 py-2 rounded-xl bg-surface-container-low/60 border border-outline-variant/40 text-xs">
          <div className="flex items-center gap-2 text-on-surface-variant">
            <Clock className="size-3.5 text-primary shrink-0" />
            <span>Derived training time:</span>
            <span className="font-mono font-bold text-on-surface">
              {hoursWorked.toFixed(1)} hours
            </span>
          </div>
          <span className="text-[11px] text-on-surface-variant/70">
            Standard SIWES full day: 8.0h
          </span>
        </div>

        {/* Row 2: Activity Description (Plain Textarea Only) */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant font-heading">
              Activity Performed *
            </label>
            <span className="text-[11px] text-on-surface-variant font-medium">
              Required
            </span>
          </div>
          <textarea
            required
            rows={5}
            placeholder="Describe the tasks you completed today in detail..."
            value={activityDescription}
            onChange={(e) => setActivityDescription(e.target.value)}
            className="w-full p-3.5 text-sm rounded-md bg-surface-container-lowest border border-outline-variant text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all resize-y"
          />
          <p className="text-[11px] text-on-surface-variant/80 mt-1">
            Provide a comprehensive overview of your daily responsibilities.
          </p>
        </div>

        {/* Row 3: Skills Gained & Challenges Faced */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant font-heading mb-1.5">
              Skills Gained / Applied
            </label>
            <textarea
              rows={3}
              placeholder="e.g., React.js, Project Management..."
              value={skillsGained}
              onChange={(e) => setSkillsGained(e.target.value)}
              className="w-full p-3 text-sm rounded-md bg-surface-container-lowest border border-outline-variant text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all resize-y"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant font-heading mb-1.5">
              Challenges Faced
            </label>
            <textarea
              rows={3}
              placeholder="Any issues encountered and how you resolved them..."
              value={challenges}
              onChange={(e) => setChallenges(e.target.value)}
              className="w-full p-3 text-sm rounded-md bg-surface-container-lowest border border-outline-variant text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all resize-y"
            />
          </div>
        </div>

        {/* Row 4: Attachments Dropzone */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant font-heading mb-2">
            Attachments
          </label>
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-xl p-6 text-center transition-all ${
              isDragging
                ? "border-primary bg-primary-fixed/20"
                : "border-outline-variant/70 bg-surface-container-low/30 hover:bg-surface-container-low/50"
            }`}
          >
            {attachmentName ? (
              <div className="inline-flex items-center gap-3 p-3 rounded-xl bg-surface-container-lowest border border-outline-variant shadow-xs">
                <Paperclip className="size-4 text-primary" />
                <span className="text-xs font-semibold text-on-surface truncate max-w-xs">
                  {attachmentName}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedFile(null);
                    setAttachmentName("");
                  }}
                  className="p-1 rounded-md text-on-surface-variant hover:text-error hover:bg-error-container/30 transition-colors"
                  title="Remove attachment"
                >
                  <X className="size-3.5" />
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center">
                <div className="w-12 h-12 rounded-xl bg-surface-container text-primary flex items-center justify-center mb-3 shadow-xs">
                  <UploadCloud className="size-6" />
                </div>
                <label className="text-sm text-on-surface cursor-pointer">
                  <span className="font-semibold text-primary hover:underline">
                    Upload a file
                  </span>{" "}
                  <span className="text-on-surface-variant">or drag and drop</span>
                  <input
                    type="file"
                    accept="image/*,application/pdf,.docx"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </label>
                <p className="text-[11px] text-on-surface-variant/80 mt-1">
                  PDF, PNG, JPG, DOCX up to 10MB
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons Row */}
        <div className="pt-4 border-t border-outline-variant/60 flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={handleDiscard}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-outline-variant bg-surface-container-lowest text-on-surface text-xs font-medium hover:bg-surface-container-low active:scale-[0.98] transition-all shadow-xs disabled:opacity-50"
          >
            Discard
          </button>

          <div className="w-full sm:w-auto flex items-center gap-3">
            {!isResubmitMode && (
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => handleFormSubmit(true)}
                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-outline-variant bg-surface-container-lowest text-on-surface text-xs font-semibold hover:bg-surface-container-low active:scale-[0.98] transition-all shadow-xs disabled:opacity-50"
              >
                {isSubmitting ? (
                  <Loader2 className="size-3.5 animate-spin text-on-surface-variant" />
                ) : (
                  <Save className="size-3.5 text-on-surface-variant" />
                )}
                <span>Save as Draft</span>
              </button>
            )}

            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleFormSubmit(false)}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-on-primary text-xs font-semibold hover:bg-primary-container active:scale-[0.98] transition-all shadow-xs disabled:opacity-50"
            >
              {isSubmitting ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Send className="size-3.5" />
              )}
              <span>{isResubmitMode ? "Resubmit" : "Submit for Review"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
