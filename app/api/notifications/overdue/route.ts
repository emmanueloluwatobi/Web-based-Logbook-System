import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { triggerOverdueNotificationCheck } from "@/actions/notifications";
import { auth } from "@/lib/auth";

/**
 * Validates whether the incoming request is authorized either via
 * a server-side CRON_SECRET header or an authenticated Admin/HOD session.
 */
async function isAuthorized(req: NextRequest): Promise<boolean> {
  // 1. Verify Cron Secret if configured
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authHeader = req.headers.get("authorization");
    const customHeader = req.headers.get("x-cron-secret");

    if (
      (authHeader && authHeader === `Bearer ${cronSecret}`) ||
      (customHeader && customHeader === cronSecret)
    ) {
      return true;
    }
  }

  // 2. Fall back to authenticated Staff Session (Admin or HOD)
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (session?.user && (session.user.role === "admin" || session.user.role === "hod")) {
      return true;
    }
  } catch (err) {
    console.error("[api/notifications/overdue] Session auth error:", err);
  }

  return false;
}

/**
 * Route handler to trigger overdue logbook submission checks.
 * Protected by CRON_SECRET or Admin/HOD session.
 */
export async function GET(req: NextRequest) {
  try {
    if (!(await isAuthorized(req))) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized. Provide a valid CRON_SECRET or authenticated staff session.",
        },
        { status: 401 }
      );
    }

    const force = req.nextUrl.searchParams.get("force") === "true";
    const result = await triggerOverdueNotificationCheck({ force });

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || "Failed to process overdue check." },
        { status: 500 }
      );
    }
    return NextResponse.json({ success: true, data: result.data });
  } catch (error) {
    console.error("[api/notifications/overdue.GET]", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!(await isAuthorized(req))) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized. Provide a valid CRON_SECRET or authenticated staff session.",
        },
        { status: 401 }
      );
    }

    let force = req.nextUrl.searchParams.get("force") === "true";
    try {
      const body = await req.json();
      if (body && typeof body.force === "boolean") {
        force = body.force;
      }
    } catch {
      // Body parsing is optional
    }

    const result = await triggerOverdueNotificationCheck({ force });

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || "Failed to process overdue check." },
        { status: 500 }
      );
    }
    return NextResponse.json({ success: true, data: result.data });
  } catch (error) {
    console.error("[api/notifications/overdue.POST]", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
