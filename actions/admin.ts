"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { eq, and, sql } from "drizzle-orm";
import { hashPassword } from "better-auth/crypto";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import * as schema from "@/db/schema";
import { sendAccountInviteEmail } from "@/lib/resend";

type ActionResponse<T = unknown> = {
  success: boolean;
  error?: string;
  data?: T;
};

/**
 * Ensures the requesting user is authenticated and possesses the "admin" role.
 */
async function assertAdmin() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || session.user.role !== "admin") {
    return { authorized: false as const, error: "Unauthorized. Administrator privileges required." };
  }

  return { authorized: true as const, user: session.user };
}

// ---------------------------------------------------------------------------
// 1. Department CRUD
// ---------------------------------------------------------------------------

export async function createDepartment(input: {
  name: string;
  code: string;
}): Promise<ActionResponse<{ id: string; name: string; code: string }>> {
  try {
    const authCheck = await assertAdmin();
    if (!authCheck.authorized) return { success: false, error: authCheck.error };

    const name = input.name.trim();
    const code = input.code.trim().toUpperCase();

    if (!name || !code) {
      return { success: false, error: "Department name and code are required." };
    }

    // Check for duplicate code
    const [existing] = await db
      .select()
      .from(schema.department)
      .where(eq(schema.department.code, code))
      .limit(1);

    if (existing) {
      return { success: false, error: `Department code "${code}" already exists.` };
    }

    const [created] = await db
      .insert(schema.department)
      .values({ name, code })
      .returning();

    revalidatePath("/admin/departments");
    revalidatePath("/admin");
    return { success: true, data: created };
  } catch (error) {
    console.error("[actions/admin.createDepartment]", error);
    return { success: false, error: "Failed to create department. Please try again." };
  }
}

export async function updateDepartment(input: {
  id: string;
  name: string;
  code: string;
}): Promise<ActionResponse> {
  try {
    const authCheck = await assertAdmin();
    if (!authCheck.authorized) return { success: false, error: authCheck.error };

    const name = input.name.trim();
    const code = input.code.trim().toUpperCase();

    if (!name || !code) {
      return { success: false, error: "Department name and code are required." };
    }

    // Check code collision
    const [existing] = await db
      .select()
      .from(schema.department)
      .where(and(eq(schema.department.code, code), sql`${schema.department.id} != ${input.id}`))
      .limit(1);

    if (existing) {
      return { success: false, error: `Department code "${code}" is already in use.` };
    }

    await db
      .update(schema.department)
      .set({ name, code })
      .where(eq(schema.department.id, input.id));

    revalidatePath("/admin/departments");
    revalidatePath("/admin");
    return { success: true };
  } catch (error) {
    console.error("[actions/admin.updateDepartment]", error);
    return { success: false, error: "Failed to update department." };
  }
}

export async function deleteDepartment(id: string): Promise<ActionResponse> {
  try {
    const authCheck = await assertAdmin();
    if (!authCheck.authorized) return { success: false, error: authCheck.error };

    // Check if programs depend on this department
    const [hasPrograms] = await db
      .select()
      .from(schema.program)
      .where(eq(schema.program.departmentId, id))
      .limit(1);

    if (hasPrograms) {
      return {
        success: false,
        error: "Cannot delete this department because academic programs are currently linked to it. Delete or reassign the programs first.",
      };
    }

    await db.delete(schema.department).where(eq(schema.department.id, id));

    revalidatePath("/admin/departments");
    revalidatePath("/admin");
    return { success: true };
  } catch (error) {
    console.error("[actions/admin.deleteDepartment]", error);
    return { success: false, error: "Failed to delete department." };
  }
}

// ---------------------------------------------------------------------------
// 2. Program CRUD
// ---------------------------------------------------------------------------

export async function createProgram(input: {
  departmentId: string;
  name: string;
}): Promise<ActionResponse<{ id: string; name: string }>> {
  try {
    const authCheck = await assertAdmin();
    if (!authCheck.authorized) return { success: false, error: authCheck.error };

    const name = input.name.trim();
    if (!name || !input.departmentId) {
      return { success: false, error: "Program name and department are required." };
    }

    const [created] = await db
      .insert(schema.program)
      .values({
        departmentId: input.departmentId,
        name,
      })
      .returning();

    revalidatePath("/admin/programs");
    revalidatePath("/admin/departments");
    revalidatePath("/admin");
    return { success: true, data: created };
  } catch (error) {
    console.error("[actions/admin.createProgram]", error);
    return { success: false, error: "Failed to create program." };
  }
}

export async function updateProgram(input: {
  id: string;
  departmentId: string;
  name: string;
}): Promise<ActionResponse> {
  try {
    const authCheck = await assertAdmin();
    if (!authCheck.authorized) return { success: false, error: authCheck.error };

    const name = input.name.trim();
    if (!name || !input.departmentId) {
      return { success: false, error: "Program name and department are required." };
    }

    await db
      .update(schema.program)
      .set({
        departmentId: input.departmentId,
        name,
      })
      .where(eq(schema.program.id, input.id));

    revalidatePath("/admin/programs");
    revalidatePath("/admin");
    return { success: true };
  } catch (error) {
    console.error("[actions/admin.updateProgram]", error);
    return { success: false, error: "Failed to update program." };
  }
}

export async function deleteProgram(id: string): Promise<ActionResponse> {
  try {
    const authCheck = await assertAdmin();
    if (!authCheck.authorized) return { success: false, error: authCheck.error };

    await db.delete(schema.program).where(eq(schema.program.id, id));

    revalidatePath("/admin/programs");
    revalidatePath("/admin/departments");
    revalidatePath("/admin");
    return { success: true };
  } catch (error) {
    console.error("[actions/admin.deleteProgram]", error);
    return { success: false, error: "Failed to delete program." };
  }
}

// ---------------------------------------------------------------------------
// 3. Academic Session CRUD (Single-Active Invariant)
// ---------------------------------------------------------------------------

export async function createSession(input: {
  label: string;
  isActive?: boolean;
}): Promise<ActionResponse> {
  try {
    const authCheck = await assertAdmin();
    if (!authCheck.authorized) return { success: false, error: authCheck.error };

    const label = input.label.trim();
    if (!label) {
      return { success: false, error: "Session label is required (e.g. 2025/2026)." };
    }

    const isActive = Boolean(input.isActive);

    if (isActive) {
      // Transaction: deactivate all others, activate this new session
      await db.transaction(async (tx) => {
        await tx.update(schema.academicSession).set({ isActive: false });
        await tx.insert(schema.academicSession).values({ label, isActive: true });
      });
    } else {
      await db.insert(schema.academicSession).values({ label, isActive: false });
    }

    revalidatePath("/admin/sessions");
    revalidatePath("/admin");
    return { success: true };
  } catch (error) {
    console.error("[actions/admin.createSession]", error);
    return { success: false, error: "Failed to create academic session." };
  }
}

export async function updateSession(input: {
  id: string;
  label: string;
  isActive?: boolean;
}): Promise<ActionResponse> {
  try {
    const authCheck = await assertAdmin();
    if (!authCheck.authorized) return { success: false, error: authCheck.error };

    const label = input.label.trim();
    if (!label) return { success: false, error: "Session label is required." };

    if (input.isActive) {
      await db.transaction(async (tx) => {
        await tx.update(schema.academicSession).set({ isActive: false });
        await tx
          .update(schema.academicSession)
          .set({ label, isActive: true })
          .where(eq(schema.academicSession.id, input.id));
      });
    } else {
      await db
        .update(schema.academicSession)
        .set({ label, isActive: false })
        .where(eq(schema.academicSession.id, input.id));
    }

    revalidatePath("/admin/sessions");
    revalidatePath("/admin");
    return { success: true };
  } catch (error) {
    console.error("[actions/admin.updateSession]", error);
    return { success: false, error: "Failed to update session." };
  }
}

export async function setActiveSession(id: string): Promise<ActionResponse> {
  try {
    const authCheck = await assertAdmin();
    if (!authCheck.authorized) return { success: false, error: authCheck.error };

    // Atomically deactivate all sessions and set the target session active
    await db.transaction(async (tx) => {
      await tx.update(schema.academicSession).set({ isActive: false });
      await tx
        .update(schema.academicSession)
        .set({ isActive: true })
        .where(eq(schema.academicSession.id, id));
    });

    revalidatePath("/admin/sessions");
    revalidatePath("/admin");
    return { success: true };
  } catch (error) {
    console.error("[actions/admin.setActiveSession]", error);
    return { success: false, error: "Failed to set active session." };
  }
}

export async function deleteSession(id: string): Promise<ActionResponse> {
  try {
    const authCheck = await assertAdmin();
    if (!authCheck.authorized) return { success: false, error: authCheck.error };

    const [target] = await db
      .select()
      .from(schema.academicSession)
      .where(eq(schema.academicSession.id, id))
      .limit(1);

    if (target?.isActive) {
      return {
        success: false,
        error: "Cannot delete the active academic session. Set another session active first.",
      };
    }

    await db.delete(schema.academicSession).where(eq(schema.academicSession.id, id));

    revalidatePath("/admin/sessions");
    revalidatePath("/admin");
    return { success: true };
  } catch (error) {
    console.error("[actions/admin.deleteSession]", error);
    return { success: false, error: "Failed to delete session." };
  }
}

// ---------------------------------------------------------------------------
// 4. Staff User Management & Password Invitation
// ---------------------------------------------------------------------------

export async function createStaffUser(input: {
  name: string;
  email: string;
  role: "school_supervisor" | "hod" | "admin";
  departmentId?: string | null;
}): Promise<ActionResponse> {
  try {
    const authCheck = await assertAdmin();
    if (!authCheck.authorized) return { success: false, error: authCheck.error };

    const name = input.name.trim();
    const email = input.email.trim().toLowerCase();
    const role = input.role;
    const departmentId = input.departmentId || null;

    if (!name || !email) {
      return { success: false, error: "Name and email are required." };
    }

    if (!["school_supervisor", "hod", "admin"].includes(role)) {
      return { success: false, error: "Invalid role specified for staff account." };
    }

    if (role !== "admin" && !departmentId) {
      return { success: false, error: "School Supervisors and HODs must be assigned to a department." };
    }

    // Check if email is already registered
    const [existing] = await db
      .select()
      .from(schema.user)
      .where(eq(schema.user.email, email))
      .limit(1);

    if (existing) {
      return { success: false, error: `A user with email ${email} already exists.` };
    }

    // One active HOD per department — soft block per project-overview.md invariant
    if (role === "hod" && departmentId) {
      const [existingHod] = await db
        .select({ id: schema.user.id, name: schema.user.name })
        .from(schema.user)
        .where(
          and(
            eq(schema.user.role, "hod"),
            eq(schema.user.departmentId, departmentId)
          )
        )
        .limit(1);

      if (existingHod) {
        return {
          success: false,
          error: `This department already has an active HOD (${existingHod.name}). Remove or reassign the existing HOD before creating a new one.`,
        };
      }
    }

    const userId = crypto.randomUUID();
    const inviteToken = crypto.randomUUID().replace(/-/g, "") + crypto.randomUUID().replace(/-/g, "");

    // Create user and invite verification record in a transaction
    await db.transaction(async (tx) => {
      await tx.insert(schema.user).values({
        id: userId,
        name,
        email,
        emailVerified: true,
        role,
        departmentId,
      });

      // Verification token expires in 48 hours
      await tx.insert(schema.verification).values({
        id: crypto.randomUUID(),
        identifier: `account-invite:${inviteToken}`,
        value: userId,
        expiresAt: new Date(Date.now() + 48 * 3600 * 1000),
      });

      await tx.insert(schema.notificationLog).values({
        userId,
        type: "account_invite",
        message: `Account invite dispatched for ${name} (${role}).`,
      });
    });

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const inviteUrl = `${baseUrl}/set-password?token=${inviteToken}`;

    // Send invitation email via Resend / Gmail SMTP
    await sendAccountInviteEmail(email, name, role, inviteUrl);

    revalidatePath("/admin/users");
    revalidatePath("/admin");
    return { success: true };
  } catch (error) {
    console.error("[actions/admin.createStaffUser]", error);
    return { success: false, error: "Failed to create staff account and dispatch invite." };
  }
}

export async function resendStaffInvite(userId: string): Promise<ActionResponse> {
  try {
    const authCheck = await assertAdmin();
    if (!authCheck.authorized) return { success: false, error: authCheck.error };

    const [user] = await db
      .select()
      .from(schema.user)
      .where(eq(schema.user.id, userId))
      .limit(1);

    if (!user) return { success: false, error: "User not found." };

    // Clean up any old invite tokens for this user
    await db
      .delete(schema.verification)
      .where(
        and(
          eq(schema.verification.value, userId),
          sql`${schema.verification.identifier} LIKE 'account-invite:%'`
        )
      );

    const inviteToken = crypto.randomUUID().replace(/-/g, "") + crypto.randomUUID().replace(/-/g, "");

    await db.insert(schema.verification).values({
      id: crypto.randomUUID(),
      identifier: `account-invite:${inviteToken}`,
      value: userId,
      expiresAt: new Date(Date.now() + 48 * 3600 * 1000),
    });

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const inviteUrl = `${baseUrl}/set-password?token=${inviteToken}`;

    await sendAccountInviteEmail(user.email, user.name, user.role, inviteUrl);

    return { success: true };
  } catch (error) {
    console.error("[actions/admin.resendStaffInvite]", error);
    return { success: false, error: "Failed to resend invitation email." };
  }
}

export async function deleteStaffUser(userId: string): Promise<ActionResponse> {
  try {
    const authCheck = await assertAdmin();
    if (!authCheck.authorized) return { success: false, error: authCheck.error };

    if (authCheck.user.id === userId) {
      return { success: false, error: "You cannot delete your own administrator account." };
    }

    await db.delete(schema.user).where(eq(schema.user.id, userId));

    revalidatePath("/admin/users");
    revalidatePath("/admin");
    return { success: true };
  } catch (error) {
    console.error("[actions/admin.deleteStaffUser]", error);
    return { success: false, error: "Failed to delete user." };
  }
}

// ---------------------------------------------------------------------------
// 5. Password Setup for Invited Users (Token-Gated)
// ---------------------------------------------------------------------------

export async function setPasswordWithToken(
  input: FormData | { token: string; password: string }
): Promise<ActionResponse> {
  try {
    let token = "";
    let password = "";

    if (input instanceof FormData) {
      token = (input.get("token") as string || "").trim();
      password = (input.get("password") as string || "");
    } else {
      token = (input.token || "").trim();
      password = input.password || "";
    }

    if (!token || !password || password.length < 8) {
      return {
        success: false,
        error: "Password must be at least 8 characters long.",
      };
    }

    // Lookup verification token
    const [verificationRecord] = await db
      .select()
      .from(schema.verification)
      .where(eq(schema.verification.identifier, `account-invite:${token}`))
      .limit(1);

    if (!verificationRecord) {
      return {
        success: false,
        error: "Invalid or expired invitation token. Please ask your administrator to resend the invite.",
      };
    }

    if (new Date() > verificationRecord.expiresAt) {
      await db
        .delete(schema.verification)
        .where(eq(schema.verification.id, verificationRecord.id));

      return {
        success: false,
        error: "This invitation link has expired. Please contact your administrator for a fresh invite.",
      };
    }

    const userId = verificationRecord.value;
    const hashedPassword = await hashPassword(password);

    await db.transaction(async (tx) => {
      // Check if credential account already exists
      const [existingAccount] = await tx
        .select()
        .from(schema.account)
        .where(
          and(
            eq(schema.account.userId, userId),
            eq(schema.account.providerId, "credential")
          )
        )
        .limit(1);

      if (existingAccount) {
        await tx
          .update(schema.account)
          .set({
            password: hashedPassword,
            issuer: "local:credential",
            updatedAt: new Date(),
          })
          .where(eq(schema.account.id, existingAccount.id));
      } else {
        await tx.insert(schema.account).values({
          id: crypto.randomUUID(),
          accountId: userId,
          providerId: "credential",
          userId,
          issuer: "local:credential",
          password: hashedPassword,
        });
      }

      // Mark user email verified
      await tx
        .update(schema.user)
        .set({ emailVerified: true })
        .where(eq(schema.user.id, userId));

      // Remove the consumed verification token
      await tx
        .delete(schema.verification)
        .where(eq(schema.verification.id, verificationRecord.id));
    });

    return { success: true };
  } catch (error) {
    console.error("[actions/admin.setPasswordWithToken]", error);
    return { success: false, error: "Failed to set password. Please try again." };
  }
}
