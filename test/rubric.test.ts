import test from "node:test";
import assert from "node:assert/strict";
import {
  RUBRIC_WEIGHTS,
  SUPERVISOR_WEIGHT,
  calculateRubricScore,
  calculateFinalGrade,
} from "../lib/utils";
import { escapeHtml } from "../lib/resend";
import { auth } from "../lib/auth";

test("RUBRIC_WEIGHTS sum to exactly 1.0 (100%)", () => {
  const sum = Object.values(RUBRIC_WEIGHTS).reduce((acc, weight) => acc + weight, 0);
  const roundedSum = Math.round(sum * 1000) / 1000;
  assert.strictEqual(roundedSum, 1.0, `Expected rubric weights to sum to 1.0, got ${sum}`);
});

test("calculateRubricScore: seven scores of 100 produces exactly 100", () => {
  const perfectScores = {
    punctuality: 100,
    technicalCompetence: 100,
    communication: 100,
    teamwork: 100,
    problemSolving: 100,
    professionalism: 100,
    overallPerformance: 100,
  };

  const score = calculateRubricScore(perfectScores);
  assert.strictEqual(score, 100, `Expected score of 100, got ${score}`);
});

test("calculateRubricScore: seven scores of 0 produces 0", () => {
  const zeroScores = {
    punctuality: 0,
    technicalCompetence: 0,
    communication: 0,
    teamwork: 0,
    problemSolving: 0,
    professionalism: 0,
    overallPerformance: 0,
  };

  const score = calculateRubricScore(zeroScores);
  assert.strictEqual(score, 0, `Expected score of 0, got ${score}`);
});

test("calculateRubricScore: calculates expected weighted average for mixed scores", () => {
  const mixedScores = {
    punctuality: 90, // 90 * 0.10 = 9
    technicalCompetence: 80, // 80 * 0.20 = 16
    communication: 70, // 70 * 0.10 = 7
    teamwork: 85, // 85 * 0.10 = 8.5
    problemSolving: 75, // 75 * 0.15 = 11.25
    professionalism: 95, // 95 * 0.15 = 14.25
    overallPerformance: 85, // 85 * 0.20 = 17
  };
  // 9 + 16 + 7 + 8.5 + 11.25 + 14.25 + 17 = 83.0

  const score = calculateRubricScore(mixedScores);
  assert.strictEqual(score, 83.0, `Expected score of 83.0, got ${score}`);
});

test("calculateFinalGrade: 50% academic + 50% industry weights combine to 100 with Distinction", () => {
  const result = calculateFinalGrade(100, 100);
  assert.strictEqual(result.score, 100);
  assert.strictEqual(result.grade, "A (Distinction)");
});

test("calculateFinalGrade: mixed academic and industry scores", () => {
  // 80 * 0.5 + 60 * 0.5 = 70 -> A (Distinction)
  const result = calculateFinalGrade(80, 60);
  assert.strictEqual(result.score, 70);
  assert.strictEqual(result.grade, "A (Distinction)");
});

test("escapeHtml: safely sanitizes HTML injection and special characters", () => {
  assert.strictEqual(
    escapeHtml("<script>alert('xss')</script>"),
    "&lt;script&gt;alert(&#39;xss&#39;)&lt;/script&gt;"
  );
  assert.strictEqual(
    escapeHtml('Acme & "Sons" <Staff>'),
    "Acme &amp; &quot;Sons&quot; &lt;Staff&gt;"
  );
  assert.strictEqual(escapeHtml(null), "");
  assert.strictEqual(escapeHtml(undefined), "");
  assert.strictEqual(escapeHtml("John Doe"), "John Doe");
});

test("auth configuration: emailOTP and magicLink plugins exist and role input is forbidden", () => {
  const plugins = auth.options.plugins;
  assert.ok(plugins && plugins.length >= 2, "Plugins must be registered on auth");
  const pluginIds = plugins.map((p) => p.id);
  assert.ok(pluginIds.includes("email-otp"), "email-otp plugin must be installed");
  assert.ok(pluginIds.includes("magic-link"), "magic-link plugin must be installed");

  // Verify client role input is explicitly disabled in user schema
  assert.strictEqual(
    (auth.options.user?.additionalFields as Record<string, { input?: boolean }>)?.role?.input,
    false,
    "Client input for user role must be disabled"
  );
});


