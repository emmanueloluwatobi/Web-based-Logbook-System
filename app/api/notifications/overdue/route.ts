import { NextRequest, NextResponse } from "next/server";
import { triggerOverdueNotificationCheck } from "@/actions/notifications";

/**
 * Route handler to trigger overdue logbook submission checks.
 * Supports GET and POST methods so it can be called by external crons,
 * monitoring scripts, or manual administrative triggers.
 */
export async function GET() {
  try {
    const result = await triggerOverdueNotificationCheck();
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
    const result = await triggerOverdueNotificationCheck();
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
