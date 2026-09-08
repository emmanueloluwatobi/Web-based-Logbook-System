import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { magicLink } from "better-auth/plugins";
import { db } from "@/lib/db";
import * as schema from "@/db/schema";
import { studentProfile } from "@/db/schema";
import { sendMagicLinkEmail } from "@/lib/resend";

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: "pg", schema }),
  emailAndPassword: {
    enabled: true,
  },
  plugins: [
    nextCookies(),
    magicLink({
      sendMagicLink: async ({ email, url }) => {
        await sendMagicLinkEmail(email, url);
      },
    }),
  ],
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: true,
        defaultValue: "student",
        input: true,
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
          }
        },
      },
    },
  },
});

export type Session = typeof auth.$Infer.Session;
