"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { eq, and, ne } from "drizzle-orm";
import { db } from "@/lib/db";
import { studentProfile } from "@/db/schema";
import { auth } from "@/lib/auth";
import { uploadAvatar } from "@/lib/supabase-storage";

async function assertStudent() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || !session.user) {
    return { error: "Authentication required", session: null };
  }

  if (session.user.role !== "student") {
    return { error: "Only students are authorized to access this action", session: null };
  }

  return { error: null, session };
}

export interface UpdateStudentProfileInput {
  matricNumber?: string | null;
  programId?: string | null;
  level?: string | null;
  sessionId?: string | null;
  phone?: string | null;
  profilePhotoUrl?: string | null;
}

export async function updateStudentProfile(input: UpdateStudentProfileInput) {
  try {
    const { error: authError, session } = await assertStudent();
    if (authError || !session) {
      return { success: false, error: authError || "Unauthorized" };
    }

    const userId = session.user.id;

    const matricNumber = input.matricNumber?.trim() ? input.matricNumber.trim().toUpperCase() : null;
    const programId = input.programId?.trim() ? input.programId.trim() : null;
    const level = input.level?.trim() ? input.level.trim() : null;
    const sessionId = input.sessionId?.trim() ? input.sessionId.trim() : null;
    const phone = input.phone?.trim() ? input.phone.trim() : null;
    const profilePhotoUrl = input.profilePhotoUrl?.trim() ? input.profilePhotoUrl.trim() : null;

    // Check matric number uniqueness if provided
    if (matricNumber) {
      const existing = await db
        .select({ id: studentProfile.id, userId: studentProfile.userId })
        .from(studentProfile)
        .where(
          and(
            eq(studentProfile.matricNumber, matricNumber),
            ne(studentProfile.userId, userId)
          )
        )
        .limit(1);

      if (existing.length > 0) {
        return {
          success: false,
          error: `Matriculation number "${matricNumber}" is already registered to another student.`,
        };
      }
    }

    // Recalculate is_profile_complete per architecture.md invariant:
    // true once matric_number, program, level, session, and phone are all non-null
    const isProfileComplete = Boolean(
      matricNumber &&
      programId &&
      level &&
      sessionId &&
      phone
    );

    // Check if student_profile row exists
    const [existingProfile] = await db
      .select({ id: studentProfile.id })
      .from(studentProfile)
      .where(eq(studentProfile.userId, userId))
      .limit(1);

    if (existingProfile) {
      await db
        .update(studentProfile)
        .set({
          matricNumber,
          programId,
          level,
          sessionId,
          phone,
          profilePhotoUrl,
          isProfileComplete,
        })
        .where(eq(studentProfile.userId, userId));
    } else {
      // Safety net: insert if missing
      await db.insert(studentProfile).values({
        userId,
        matricNumber,
        programId,
        level,
        sessionId,
        phone,
        profilePhotoUrl,
        isProfileComplete,
      });
    }

    // Revalidate both /student/profile and /student dashboard
    revalidatePath("/student/profile");
    revalidatePath("/student");

    return {
      success: true,
      data: {
        isProfileComplete,
        matricNumber,
        programId,
        level,
        sessionId,
        phone,
        profilePhotoUrl,
      },
    };
  } catch (error) {
    console.error("[actions/profile.updateStudentProfile]", error);
    return {
      success: false,
      error: "Failed to update profile. Please check your network connection and try again.",
    };
  }
}

export async function uploadStudentAvatar(formData: FormData) {
  try {
    const { error: authError, session } = await assertStudent();
    if (authError || !session) {
      return { success: false, error: authError || "Unauthorized" };
    }

    const file = formData.get("file") as File | null;
    if (!file || file.size === 0) {
      return { success: false, error: "No image file provided" };
    }

    // Validate mime type
    const validTypes = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
    if (!validTypes.includes(file.type)) {
      return { success: false, error: "File must be a JPEG, PNG, or WebP image" };
    }

    // Max 5MB
    if (file.size > 5 * 1024 * 1024) {
      return { success: false, error: "Image size must be less than 5MB" };
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const filename = `avatar-${Date.now()}.${ext}`;

    const uploadResult = await uploadAvatar({
      userId: session.user.id,
      file: buffer,
      filename,
      contentType: file.type,
    });

    if (uploadResult.error || !uploadResult.url) {
      return { success: false, error: uploadResult.error || "Failed to upload image" };
    }

    // Update photo URL in database
    await db
      .update(studentProfile)
      .set({
        profilePhotoUrl: uploadResult.url,
      })
      .where(eq(studentProfile.userId, session.user.id));

    revalidatePath("/student/profile");
    revalidatePath("/student");

    return {
      success: true,
      data: { url: uploadResult.url },
    };
  } catch (error) {
    console.error("[actions/profile.uploadStudentAvatar]", error);
    return {
      success: false,
      error: "Failed to upload avatar image. Please try again.",
    };
  }
}
