import {
  pgTable,
  uuid,
  text,
  timestamp,
  numeric,
  date,
  boolean,
  jsonb,
  integer,
  time,
  AnyPgColumn,
} from "drizzle-orm/pg-core";

// --- Academic Structure ---

export const department = pgTable("department", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  code: text("code").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const program = pgTable("program", {
  id: uuid("id").primaryKey().defaultRandom(),
  departmentId: uuid("department_id")
    .notNull()
    .references(() => department.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
});

export const academicSession = pgTable("academic_session", {
  id: uuid("id").primaryKey().defaultRandom(),
  label: text("label").notNull(), // e.g. "2025/2026"
  isActive: boolean("is_active").default(false).notNull(),
});

// --- Better Auth Tables (Extended) ---

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  image: text("image"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  // Extended fields
  role: text("role", {
    enum: ["student", "school_supervisor", "hod", "admin", "industry_supervisor"],
  }).notNull(),
  departmentId: uuid("department_id").references(() => department.id, { onDelete: "set null" }),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  issuer: text("issuer").default("local:credential").notNull(),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at", { withTimezone: true }),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at", { withTimezone: true }),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// --- Student Profile ---

export const studentProfile = pgTable("student_profile", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id")
    .notNull()
    .unique()
    .references(() => user.id, { onDelete: "cascade" }),
  matricNumber: text("matric_number").unique(), // nullable, filled on dashboard
  programId: uuid("program_id").references(() => program.id, { onDelete: "set null" }),
  level: text("level"), // e.g. "300"
  sessionId: uuid("session_id").references(() => academicSession.id, { onDelete: "set null" }),
  phone: text("phone"),
  profilePhotoUrl: text("profile_photo_url"),
  isProfileComplete: boolean("is_profile_complete").default(false).notNull(),
});

// --- Placement & Organization ---

export const organization = pgTable("organization", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  address: text("address").notNull(),
  stateRegion: text("state_region").notNull(),
  industryType: text("industry_type").notNull(),
});

export const placement = pgTable("placement", {
  id: uuid("id").primaryKey().defaultRandom(),
  studentId: uuid("student_id")
    .notNull()
    .references(() => studentProfile.id, { onDelete: "cascade" }),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organization.id, { onDelete: "restrict" }),
  schoolSupervisorId: text("school_supervisor_id").references(() => user.id, {
    onDelete: "restrict",
  }),
  industrySupervisorId: text("industry_supervisor_id").references(() => user.id, {
    onDelete: "set null",
  }),
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  targetDays: integer("target_days").notNull(), // e.g. 60
  placementSource: text("placement_source", {
    enum: ["self_secured", "department_assigned"],
  }).notNull(),
  status: text("status", {
    enum: ["pending", "active", "completed"],
  })
    .default("pending")
    .notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// --- Logbook Entries & Supervision ---

export const logbookEntry = pgTable("logbook_entry", {
  id: uuid("id").primaryKey().defaultRandom(),
  studentId: uuid("student_id")
    .notNull()
    .references(() => studentProfile.id, { onDelete: "cascade" }),
  placementId: uuid("placement_id")
    .notNull()
    .references(() => placement.id, { onDelete: "cascade" }),
  parentEntryId: uuid("parent_entry_id").references((): AnyPgColumn => logbookEntry.id, {
    onDelete: "set null",
  }),
  versionNumber: integer("version_number").default(1).notNull(),
  entryDate: date("entry_date").notNull(),
  activityDescription: text("activity_description").notNull(),
  skillsGained: text("skills_gained"),
  challenges: text("challenges"),
  hoursWorked: numeric("hours_worked").notNull(),
  attachmentUrl: text("attachment_url"),
  status: text("status", {
    enum: ["draft", "submitted", "approved", "rejected", "needs_correction"],
  })
    .default("draft")
    .notNull(),
  submittedAt: timestamp("submitted_at", { withTimezone: true }),
});

export const supervisorFeedback = pgTable("supervisor_feedback", {
  id: uuid("id").primaryKey().defaultRandom(),
  entryId: uuid("entry_id")
    .notNull()
    .references(() => logbookEntry.id, { onDelete: "cascade" }),
  supervisorId: text("supervisor_id")
    .notNull()
    .references(() => user.id, { onDelete: "restrict" }),
  action: text("action", { enum: ["approved", "rejected"] }).notNull(),
  comment: text("comment"), // required when action = rejected (enforced in Server Action)
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// --- Attendance ---

export const attendance = pgTable("attendance", {
  id: uuid("id").primaryKey().defaultRandom(),
  studentId: uuid("student_id")
    .notNull()
    .references(() => studentProfile.id, { onDelete: "cascade" }),
  placementId: uuid("placement_id")
    .notNull()
    .references(() => placement.id, { onDelete: "cascade" }),
  date: date("date").notNull(),
  checkIn: time("check_in").notNull(),
  checkOut: time("check_out"),
  hours: numeric("hours"), // derived, stored for query speed
  status: text("status", { enum: ["present", "absent", "late"] }).notNull(),
});

// --- Review Rubric Type ---

export type RubricScores = {
  punctuality: number;
  technicalCompetence: number;
  communication: number;
  teamwork: number;
  problemSolving: number;
  professionalism: number;
  overallPerformance: number;
};

// --- Monthly Industry Review & Final Assessment ---

export const monthlyIndustryReview = pgTable("monthly_industry_review", {
  id: uuid("id").primaryKey().defaultRandom(),
  placementId: uuid("placement_id")
    .notNull()
    .references(() => placement.id, { onDelete: "cascade" }),
  industrySupervisorId: text("industry_supervisor_id")
    .notNull()
    .references(() => user.id, { onDelete: "restrict" }),
  reviewMonth: text("review_month").notNull(), // e.g. "2026-03"
  scores: jsonb("scores").$type<RubricScores>().notNull(),
  comment: text("comment").notNull(),
  attestationName: text("attestation_name").notNull(),
  attestationOfficeId: text("attestation_office_id").notNull(),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }).defaultNow().notNull(),
});

export const assessment = pgTable("assessment", {
  id: uuid("id").primaryKey().defaultRandom(),
  placementId: uuid("placement_id")
    .notNull()
    .unique()
    .references(() => placement.id, { onDelete: "cascade" }),
  academicScores: jsonb("academic_scores").$type<RubricScores>().notNull(),
  industryScores: jsonb("industry_scores").$type<RubricScores>().notNull(),
  combinedScore: numeric("combined_score").notNull(),
  combinedGrade: text("combined_grade").notNull(), // e.g. "A" / "Distinction"
  finalizedAt: timestamp("finalized_at", { withTimezone: true }).defaultNow().notNull(),
});

// --- Notifications ---

export const notificationLog = pgTable("notification_log", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  type: text("type", {
    enum: [
      "entry_rejected",
      "entry_submitted",
      "overdue_summary",
      "placement_approved",
      "industry_invite",
      "account_invite",
    ],
  }).notNull(),
  message: text("message").notNull(),
  sentAt: timestamp("sent_at", { withTimezone: true }).defaultNow().notNull(),
});

// --- Inferred TypeScript Types ---

export type Department = typeof department.$inferSelect;
export type NewDepartment = typeof department.$inferInsert;

export type Program = typeof program.$inferSelect;
export type NewProgram = typeof program.$inferInsert;

export type AcademicSession = typeof academicSession.$inferSelect;
export type NewAcademicSession = typeof academicSession.$inferInsert;

export type User = typeof user.$inferSelect;
export type NewUser = typeof user.$inferInsert;

export type Session = typeof session.$inferSelect;
export type NewSession = typeof session.$inferInsert;

export type Account = typeof account.$inferSelect;
export type NewAccount = typeof account.$inferInsert;

export type Verification = typeof verification.$inferSelect;
export type NewVerification = typeof verification.$inferInsert;

export type StudentProfile = typeof studentProfile.$inferSelect;
export type NewStudentProfile = typeof studentProfile.$inferInsert;

export type Organization = typeof organization.$inferSelect;
export type NewOrganization = typeof organization.$inferInsert;

export type Placement = typeof placement.$inferSelect;
export type NewPlacement = typeof placement.$inferInsert;

export type LogbookEntry = typeof logbookEntry.$inferSelect;
export type NewLogbookEntry = typeof logbookEntry.$inferInsert;

export type SupervisorFeedback = typeof supervisorFeedback.$inferSelect;
export type NewSupervisorFeedback = typeof supervisorFeedback.$inferInsert;

export type Attendance = typeof attendance.$inferSelect;
export type NewAttendance = typeof attendance.$inferInsert;

export type MonthlyIndustryReview = typeof monthlyIndustryReview.$inferSelect;
export type NewMonthlyIndustryReview = typeof monthlyIndustryReview.$inferInsert;

export type Assessment = typeof assessment.$inferSelect;
export type NewAssessment = typeof assessment.$inferInsert;

export type NotificationLog = typeof notificationLog.$inferSelect;
export type NewNotificationLog = typeof notificationLog.$inferInsert;
