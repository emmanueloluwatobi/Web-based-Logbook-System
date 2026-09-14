"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Award,
  CheckCircle2,
  AlertCircle,
  Save,
  Loader2,
  ShieldCheck,
  Calendar,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { submitMonthlyReview } from "@/actions/assessment";
import { RUBRIC_WEIGHTS, calculateRubricScore, calculateFinalGrade } from "@/lib/utils";
import type { RubricScores } from "@/db/schema";

export interface ExistingReviewData {
  id: string;
  reviewMonth: string;
  scores: RubricScores;
  comment: string;
  attestationName: string;
  attestationOfficeId: string;
  reviewedAt: string;
}

interface MonthlyReviewFormProps {
  placementId: string;
  studentName: string;
  defaultSupervisorName: string;
  currentMonth: string; // e.g. "2026-03"
  existingReview?: ExistingReviewData | null;
}

interface CriterionConfig {
  key: keyof RubricScores;
  title: string;
  weightLabel: string;
  description: string;
}

const CRITERIA: CriterionConfig[] = [
  {
    key: "punctuality",
    title: "Punctuality & Attendance",
    weightLabel: "10% Weight",
    description: "Arrives on time, adheres to official work schedule, and demonstrates reliable attendance.",
  },
  {
    key: "technicalCompetence",
    title: "Technical Competence & Practical Skills",
    weightLabel: "25% Weight",
    description: "Applies academic principles, learns company tools and methods, and executes practical tasks.",
  },
  {
    key: "communication",
    title: "Communication & Reporting",
    weightLabel: "15% Weight",
    description: "Expresses ideas clearly, asks insightful questions, and submits coherent progress updates.",
  },
  {
    key: "teamwork",
    title: "Teamwork & Interpersonal Relations",
    weightLabel: "15% Weight",
    description: "Cooperates effectively with colleagues, respects workplace hierarchy, and integrates into company culture.",
  },
  {
    key: "problemSolving",
    title: "Problem Solving & Initiative",
    weightLabel: "15% Weight",
    description: "Shows resourcefulness, thinks analytically, and proactively seeks solutions when faced with challenges.",
  },
  {
    key: "professionalism",
    title: "Professionalism & Work Ethic",
    weightLabel: "15% Weight",
    description: "Maintains high ethical standards, adheres to safety guidelines, and takes responsibility for actions.",
  },
  {
    key: "overallPerformance",
    title: "Overall Work Performance",
    weightLabel: "20% Weight",
    description: "Holistic evaluation of general work productivity, adaptability, and workplace contribution.",
  },
];

export function MonthlyReviewForm({
  placementId,
  studentName,
  defaultSupervisorName,
  currentMonth,
  existingReview,
}: MonthlyReviewFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Use currentMonth from server
  const reviewCycleMonth = existingReview?.reviewMonth || currentMonth;

  // Rubric Scores (0-100)
  const [scores, setScores] = useState<RubricScores>({
    punctuality: existingReview?.scores.punctuality ?? 75,
    technicalCompetence: existingReview?.scores.technicalCompetence ?? 75,
    communication: existingReview?.scores.communication ?? 75,
    teamwork: existingReview?.scores.teamwork ?? 75,
    problemSolving: existingReview?.scores.problemSolving ?? 75,
    professionalism: existingReview?.scores.professionalism ?? 75,
    overallPerformance: existingReview?.scores.overallPerformance ?? 75,
  });

  const [comment, setComment] = useState(existingReview?.comment || "");
  const [attestationName, setAttestationName] = useState(
    existingReview?.attestationName || defaultSupervisorName
  );
  const [attestationOfficeId, setAttestationOfficeId] = useState(
    existingReview?.attestationOfficeId || ""
  );
  const [attested, setAttested] = useState(Boolean(existingReview));

  const weightedTotal = calculateRubricScore(scores);
  const { grade } = calculateFinalGrade(weightedTotal, weightedTotal);

  const handleScoreChange = (key: keyof RubricScores, value: number) => {
    setScores((prev) => ({
      ...prev,
      [key]: Math.max(0, Math.min(100, isNaN(value) ? 0 : value)),
    }));
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!comment.trim()) {
      toast.error("Please provide qualitative supervisor feedback and comments.");
      return;
    }

    if (!attestationName.trim() || !attestationOfficeId.trim()) {
      toast.error("Please complete the legal attestation with your full name and Office/Staff ID.");
      return;
    }

    if (!attested) {
      toast.error("Please check the attestation box to certify this evaluation.");
      return;
    }

    startTransition(async () => {
      const formData = new FormData();
      formData.append("placementId", placementId);
      formData.append("reviewMonth", reviewCycleMonth);
      formData.append("comment", comment.trim());
      formData.append("attestationName", attestationName.trim());
      formData.append("attestationOfficeId", attestationOfficeId.trim());
      formData.append("attested", attested ? "true" : "false");

      Object.entries(scores).forEach(([key, val]) => {
        formData.append(key, String(val));
      });

      const res = await submitMonthlyReview(formData);
      if (res.success) {
        toast.success(
          existingReview
            ? "Monthly evaluation updated successfully!"
            : "Monthly evaluation and rubric scores submitted successfully!"
        );
        router.refresh();
      } else {
        toast.error(res.error || "Failed to submit evaluation. Please try again.");
      }
    });
  };

  return (
    <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/60 shadow-xs overflow-hidden">
      {/* Existing Review Alert */}
      {existingReview && (
        <div className="bg-success-container/40 border-b border-success-container px-6 py-3 flex items-center justify-between text-xs text-on-success-container">
          <span className="flex items-center gap-2 font-medium">
            <CheckCircle2 className="size-4 text-primary shrink-0" />
            <span>
              This evaluation was submitted on{" "}
              <strong>{new Date(existingReview.reviewedAt).toLocaleDateString()}</strong>. You can make
              adjustments and save changes below.
            </span>
          </span>
          <span className="font-heading font-bold text-sm bg-surface-container-lowest px-2.5 py-0.5 rounded border border-outline-variant/60">
            Current Score: {calculateRubricScore(existingReview.scores)}%
          </span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {/* Header & Month Selector */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-outline-variant/60">
          <div>
            <h3 className="font-heading font-bold text-lg text-on-surface">
              Performance Evaluation Rubric
            </h3>
            <p className="font-sans text-xs text-on-surface-variant mt-0.5">
              Score <strong className="text-on-surface font-semibold">{studentName}</strong> across the
              7 standard SIWES competency areas (0 to 100 marks each).
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant font-heading">
              Review Cycle:
            </span>
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-container-low border border-outline-variant text-xs font-semibold text-on-surface font-mono">
              <Calendar className="size-3.5 text-primary" />
              <span>{reviewCycleMonth}</span>
            </div>
          </div>
        </div>

        {/* Real-time Weighted Score Header Summary Banner */}
        <div className="p-4 rounded-xl bg-surface-container-low border border-outline-variant/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-heading font-bold text-lg border border-primary/20 shrink-0">
              <Award className="size-5" />
            </div>
            <div>
              <p className="text-xs text-on-surface-variant font-medium">Weighted Rubric Aggregate</p>
              <div className="flex items-baseline gap-2">
                <span className="font-heading text-2xl font-bold text-on-surface">
                  {weightedTotal}%
                </span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary font-heading">
                  Equivalent: {grade}
                </span>
              </div>
            </div>
          </div>
          <p className="text-[11px] text-on-surface-variant max-w-xs sm:text-right">
            Automatically computed using official SIWES category weighting formulas.
          </p>
        </div>

        {/* The 7 Rubric Sliders / Inputs */}
        <div className="space-y-4 pt-2">
          {CRITERIA.map((criterion) => {
            const scoreVal = scores[criterion.key];
            return (
              <div
                key={criterion.key}
                className="p-4 rounded-xl bg-surface-container-low border border-outline-variant/40 hover:border-outline-variant transition-all space-y-2.5"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-heading font-semibold text-sm text-on-surface">
                        {criterion.title}
                      </h4>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-surface-container-high text-on-surface-variant uppercase tracking-wider font-heading">
                        {criterion.weightLabel}
                      </span>
                    </div>
                    <p className="text-xs text-on-surface-variant mt-0.5 leading-normal">
                      {criterion.description}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center mt-2 sm:mt-0">
                    <input
                      type="number"
                      min={0}
                      max={100}
                      required
                      value={scoreVal}
                      onChange={(e) => handleScoreChange(criterion.key, Number(e.target.value))}
                      className="w-16 h-8 text-center text-sm font-heading font-bold rounded-lg bg-surface-container-lowest border border-outline-variant text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <span className="text-xs font-medium text-on-surface-variant">/ 100</span>
                  </div>
                </div>

                {/* Range Slider for Fluid UX */}
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={scoreVal}
                  onChange={(e) => handleScoreChange(criterion.key, Number(e.target.value))}
                  className="w-full h-1.5 bg-surface-container-high rounded-lg appearance-none cursor-pointer accent-primary"
                />
              </div>
            );
          })}
        </div>

        {/* Qualitative Supervisor Comments */}
        <div className="pt-3">
          <label
            htmlFor="feedback-comment"
            className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant font-heading mb-1.5"
          >
            Supervisor Feedback & Recommendations <span className="text-error">*</span>
          </label>
          <textarea
            id="feedback-comment"
            rows={4}
            required
            placeholder="Describe the student's key contributions, strengths, areas for technical improvement, and overall conduct during this month..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="w-full p-3 text-xs rounded-xl bg-surface-container-low border border-outline-variant text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all leading-relaxed"
          />
        </div>

        {/* Formal Attestation Section */}
        <div className="p-5 rounded-xl bg-surface-container-low border border-outline-variant/60 space-y-4">
          <div className="flex items-center gap-2 text-on-surface">
            <ShieldCheck className="size-5 text-primary" />
            <h4 className="font-heading font-bold text-sm">Supervisor Formal Attestation</h4>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label
                htmlFor="attestation-name"
                className="block text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant font-heading mb-1"
              >
                Supervisor Full Legal Name <span className="text-error">*</span>
              </label>
              <input
                id="attestation-name"
                type="text"
                required
                value={attestationName}
                onChange={(e) => setAttestationName(e.target.value)}
                placeholder="e.g. Engr. Babatunde Adeleke"
                className="w-full h-9 px-3 text-xs rounded-lg bg-surface-container-lowest border border-outline-variant text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label
                htmlFor="attestation-id"
                className="block text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant font-heading mb-1"
              >
                Official Company Staff / Office ID <span className="text-error">*</span>
              </label>
              <input
                id="attestation-id"
                type="text"
                required
                value={attestationOfficeId}
                onChange={(e) => setAttestationOfficeId(e.target.value)}
                placeholder="e.g. EMP-9824 or Staff No"
                className="w-full h-9 px-3 text-xs rounded-lg bg-surface-container-lowest border border-outline-variant text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          <label className="flex items-start gap-2.5 cursor-pointer pt-1">
            <input
              type="checkbox"
              id="attestation-checkbox"
              name="attested"
              value="true"
              required
              checked={attested}
              onChange={(e) => setAttested(e.target.checked)}
              className="mt-0.5 rounded border-outline-variant text-primary focus:ring-primary size-4"
            />
            <span className="text-xs text-on-surface-variant leading-relaxed select-none">
              I formally attest that this evaluation accurately reflects the student&apos;s attendance,
              conduct, and workplace performance at our organization during this review cycle.
            </span>
          </label>
        </div>

        {/* Submit Action */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-outline-variant/60">
          <button
            type="submit"
            disabled={isPending || !attested}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary text-on-primary rounded-xl text-xs font-semibold font-heading uppercase tracking-wider hover:bg-primary-container active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none shadow-xs"
          >
            {isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                <span>Saving Evaluation...</span>
              </>
            ) : (
              <>
                <Save className="size-4" />
                <span>{existingReview ? "Update Monthly Evaluation" : "Submit Monthly Evaluation"}</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
