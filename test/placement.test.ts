import test from "node:test";
import assert from "node:assert/strict";

test("Placement status union includes valid operational states", () => {
  const allowedStatuses = ["pending", "active", "completed", "rejected"] as const;
  type PlacementStatus = (typeof allowedStatuses)[number];

  const testStatus1: PlacementStatus = "pending";
  const testStatus2: PlacementStatus = "rejected";
  const testStatus3: PlacementStatus = "active";
  const testStatus4: PlacementStatus = "completed";

  assert.strictEqual(allowedStatuses.includes(testStatus1), true);
  assert.strictEqual(allowedStatuses.includes(testStatus2), true);
  assert.strictEqual(allowedStatuses.includes(testStatus3), true);
  assert.strictEqual(allowedStatuses.includes(testStatus4), true);
});

test("Date validation logic: start date must be strictly earlier than end date", () => {
  const isValidDateRange = (startDateStr: string, endDateStr: string) => {
    const start = new Date(startDateStr);
    const end = new Date(endDateStr);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return false;
    const startYear = start.getFullYear();
    const endYear = end.getFullYear();
    if (startYear < 2020 || startYear > 2040 || endYear < 2020 || endYear > 2040) return false;
    return end > start;
  };

  assert.strictEqual(isValidDateRange("2026-03-01", "2026-06-01"), true);
  assert.strictEqual(isValidDateRange("2026-06-01", "2026-03-01"), false);
  assert.strictEqual(isValidDateRange("2026-03-01", "2026-03-01"), false);
  assert.strictEqual(isValidDateRange("invalid", "2026-03-01"), false);
  assert.strictEqual(isValidDateRange("2019-01-01", "2019-06-01"), false);
});

test("Rejection reason normalization and fallback logic", () => {
  const normalizeRejectionReason = (reason?: string | null) => {
    const trimmed = reason?.trim();
    return trimmed && trimmed.length > 0 ? trimmed : "Declined by department SIWES coordinator.";
  };

  assert.strictEqual(
    normalizeRejectionReason("Organization lacks required engineering equipment"),
    "Organization lacks required engineering equipment"
  );
  assert.strictEqual(
    normalizeRejectionReason("   "),
    "Declined by department SIWES coordinator."
  );
  assert.strictEqual(
    normalizeRejectionReason(null),
    "Declined by department SIWES coordinator."
  );
  assert.strictEqual(
    normalizeRejectionReason(undefined),
    "Declined by department SIWES coordinator."
  );
});
