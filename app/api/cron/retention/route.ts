import { NextResponse } from "next/server";
import {
  runDailyRetention,
  runWeeklyAttendanceRetention,
  shouldRunScheduledJob,
} from "@/lib/cleanup/retention";

function authorize(request: Request): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return false;

  const auth = request.headers.get("authorization");
  if (auth === `Bearer ${secret}`) return true;

  const url = new URL(request.url);
  return url.searchParams.get("secret") === secret;
}

export async function GET(request: Request) {
  if (!authorize(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const job = searchParams.get("job");
  const force = searchParams.get("force") === "true";

  const results: Record<string, unknown> = {
    ranAt: new Date().toISOString(),
  };

  try {
    if (job === "daily" || (!job && (force || shouldRunScheduledJob("daily")))) {
      results.daily = await runDailyRetention();
    }

    if (job === "weekly" || (!job && (force || shouldRunScheduledJob("weekly")))) {
      results.weekly = await runWeeklyAttendanceRetention();
    }

    if (!results.daily && !results.weekly) {
      return NextResponse.json({
        message:
          "No job ran. Use ?job=daily or ?job=weekly, or ?force=true, or call at scheduled time.",
        timezone: process.env.CRON_TIMEZONE ?? "Asia/Kolkata",
        hint: "Daily: 00:00. Weekly attendance: Sunday 23:00.",
      });
    }

    return NextResponse.json(results);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Retention failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  return GET(request);
}
