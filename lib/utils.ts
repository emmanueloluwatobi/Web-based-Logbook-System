import type { RubricScores } from "@/db/schema";

/**
 * Standard rubric criteria weights specified in context/architecture.md.
 * Sums to 1.0 (100%).
 */
export const RUBRIC_WEIGHTS = {
  punctuality: 0.10,
  technicalCompetence: 0.25,
  communication: 0.15,
  teamwork: 0.15,
  problemSolving: 0.15,
  professionalism: 0.15,
  overallPerformance: 0.20,
} as const;

export const SUPERVISOR_WEIGHT = { academic: 0.5, industry: 0.5 } as const;

/**
 * Calculates the weighted score (0 - 100) from the 7 rubric criteria.
 */
export function calculateRubricScore(scores: RubricScores): number {
  const total = Object.entries(RUBRIC_WEIGHTS).reduce((acc, [key, weight]) => {
    const rawVal = scores[key as keyof typeof RUBRIC_WEIGHTS];
    const val = typeof rawVal === "number" && !isNaN(rawVal) ? rawVal : 0;
    return acc + val * weight;
  }, 0);

  return Math.round(total * 10) / 10;
}

/**
 * Calculates final SIWES score and letter grade combining academic (50%) and industry (50%).
 */
export function calculateFinalGrade(
  academicScore: number,
  industryScore: number
): { score: number; grade: string } {
  const combinedScore =
    academicScore * SUPERVISOR_WEIGHT.academic + industryScore * SUPERVISOR_WEIGHT.industry;
  const rounded = Math.round(combinedScore * 10) / 10;

  let grade = "F";
  if (rounded >= 70) grade = "A (Distinction)";
  else if (rounded >= 60) grade = "B (Credit)";
  else if (rounded >= 50) grade = "C (Pass)";
  else if (rounded >= 45) grade = "D (Fair)";
  else if (rounded >= 40) grade = "E (Marginal)";

  return { score: rounded, grade };
}
