import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { magicLink, emailOTP } from "better-auth/plugins";
import { eq, and } from "drizzle-orm";
import { db } from "@/lib/db";
import * as schema from "@/db/schema";
import { studentProfile, department } from "@/db/schema";
import {
  sendMagicLinkEmail,
  sendOTPEmail,
  sendStudentWelcomeEmail,
  logNotification,
} from "@/lib/resend";

/**
 * Checks whether an email belongs to an assigned Industry Supervisor with at least
 * one currently active student placement (placement.status = 'active').
 * Prevents dispatching login OTP/links to arbitrary emails, students, staff, or unassigned mentors.
 */
async function isEligibleIndustrySupervisor(email: string): Promise<boolean> {
  try {
    const cleanEmail = email.trim().toLowerCase();
    const [foundUser] = await db
      .select({ id: schema.user.id, role: schema.user.role })
      .from(schema.user)
      .where(eq(schema.user.email, cleanEmail))
      .limit(1);

    if (!foundUser || foundUser.role !== "industry_supervisor") {
      return false;
    }

    const [activePlacement] = await db
      .select({ id: schema.placement.id })
      .from(schema.placement)
      .where(
        and(
          eq(schema.placement.industrySupervisorId, foundUser.id),
          eq(schema.placement.status, "active")
        )
      )
      .limit(1);

    return !!activePlacement;
  } catch (error) {
    console.error("[lib/auth] Error checking industry supervisor eligibility:", error);
    return false;
  }
}

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: "pg", schema }),
  emailAndPassword: {
    enabled: true,
  },
  plugins: [
    nextCookies(),
    magicLink({
      disableSignUp: true,
      sendMagicLink: async ({ email, url }) => {
        const eligible = await isEligibleIndustrySupervisor(email);
        if (!eligible) {
          console.warn(`[lib/auth.magicLink] Suppressed magic link dispatch to ineligible address: ${email}`);
          return;
        }
        await sendMagicLinkEmail(email, url);
      },
    }),
    emailOTP({
      disableSignUp: true,
      sendVerificationOTP: async ({ email, otp }) => {
        const eligible = await isEligibleIndustrySupervisor(email);
        if (!eligible) {
          console.warn(`[lib/auth.emailOTP] Suppressed OTP dispatch to ineligible address: ${email}`);
          return;
        }
        await sendOTPEmail(email, otp);
      },
    }),
  ],
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: true,
        defaultValue: "student",
        input: false, // Security: Never allow client to specify or override role
      },
      departmentId: {
        type: "string",
        required: false,
        input: true,
      },
    },
  },
  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          // Security: Guarantee that any user created through auth flows is strictly a student
          return {
            data: {
              ...user,
              role: "student",
            },
          };
        },
        after: async (user) => {
          if (user.role === "student") {
            try {
              await db.insert(studentProfile).values({
                userId: user.id,
                matricNumber: null,
                programId: null,
                level: null,
                sessionId: null,
                phone: null,
                profilePhotoUrl: null,
                isProfileComplete: false,
              });
            } catch (error) {
              console.error("[lib/auth.databaseHooks.user.create.after] Failed to create student profile:", error);
            }

            // Feature 15: Send Student Welcome Email & log notification
            try {
              let departmentName: string | null = null;
              const deptId = (user as Record<string, unknown>).departmentId;
              if (typeof deptId === "string" && deptId) {
                const [dept] = await db
                  .select({ name: department.name })
                  .from(department)
                  .where(eq(department.id, deptId))
                  .limit(1);
                if (dept) departmentName = dept.name;
              }

              await sendStudentWelcomeEmail({
                to: user.email,
                name: user.name,
                departmentName,
              });

              await logNotification({
                userId: user.id,
                type: "welcome_student",
                message: `Welcome email dispatched to ${user.email}.`,
              });
            } catch (notifyError) {
              console.error("[lib/auth.databaseHooks.user.create.after] Failed to send welcome email:", notifyError);
            }
          }
        },
      },
    },
  },
});

export type Session = typeof auth.$Infer.Session;
