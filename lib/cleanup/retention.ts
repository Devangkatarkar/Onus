import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

const DEFAULT_TZ = "Asia/Kolkata";

function getTimezone(): string {
  return process.env.CRON_TIMEZONE?.trim() || DEFAULT_TZ;
}

function getZonedParts(date: Date, timeZone: string) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const parts = formatter.formatToParts(date);
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value ?? "";

  return {
    year: get("year"),
    month: get("month"),
    day: get("day"),
    weekday: get("weekday"),
    hour: Number(get("hour")),
    minute: Number(get("minute")),
  };
}

/** Monday 00:00 through Sunday (inclusive) for the week containing `anchor`. */
export function getWeekDateRange(anchor: Date, timeZone: string) {
  const { year, month, day, weekday } = getZonedParts(anchor, timeZone);
  const anchorDate = new Date(`${year}-${month}-${day}T12:00:00`);

  const dayMap: Record<string, number> = {
    Mon: 0,
    Tue: 1,
    Wed: 2,
    Thu: 3,
    Fri: 4,
    Sat: 5,
    Sun: 6,
  };
  const offset = dayMap[weekday] ?? 0;
  const monday = new Date(anchorDate);
  monday.setDate(anchorDate.getDate() - offset);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  const fmt = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${dd}`;
  };

  const weekLabel = `${fmt(monday)}_to_${fmt(sunday)}`;

  return {
    weekLabel,
    startDate: fmt(monday),
    endDate: fmt(sunday),
  };
}

function startOfTodayIso(timeZone: string): string {
  const { year, month, day } = getZonedParts(new Date(), timeZone);
  return `${year}-${month}-${day}T00:00:00`;
}

export async function runDailyRetention() {
  const supabase = createAdminClient();
  const tz = getTimezone();
  const cutoff = startOfTodayIso(tz);

  const { error: eventsError, count: eventsDeleted } = await supabase
    .from("community_events")
    .delete({ count: "exact" })
    .lt("created_at", cutoff);

  if (eventsError) {
    return { ok: false as const, job: "daily", error: eventsError.message };
  }

  const { error: snacksError, count: snacksDeleted } = await supabase
    .from("snack_sessions")
    .delete({ count: "exact" })
    .lt("created_at", cutoff);

  if (snacksError) {
    return { ok: false as const, job: "daily", error: snacksError.message };
  }

  return {
    ok: true as const,
    job: "daily",
    timezone: tz,
    cutoffBefore: cutoff,
    communityEventsDeleted: eventsDeleted ?? 0,
    snackSessionsDeleted: snacksDeleted ?? 0,
  };
}

export async function runWeeklyAttendanceRetention() {
  const supabase = createAdminClient();
  const tz = getTimezone();
  const now = new Date();
  const { weekLabel, startDate, endDate } = getWeekDateRange(now, tz);

  const { data: rows, error: fetchError } = await supabase
    .from("attendance")
    .select("id, user_id, attendance_date, marked_at, latitude, longitude")
    .gte("attendance_date", startDate)
    .lte("attendance_date", endDate);

  if (fetchError) {
    return { ok: false as const, job: "weekly", error: fetchError.message };
  }

  const records = rows ?? [];

  if (records.length > 0) {
    const archiveRows = records.map((row) => ({
      original_id: row.id,
      user_id: row.user_id,
      attendance_date: row.attendance_date,
      marked_at: row.marked_at,
      latitude: row.latitude,
      longitude: row.longitude,
      week_label: weekLabel,
    }));

    const { error: archiveError } = await supabase
      .from("attendance_archive")
      .insert(archiveRows);

    if (archiveError) {
      return { ok: false as const, job: "weekly", error: archiveError.message };
    }

    const json = JSON.stringify(
      { weekLabel, startDate, endDate, archivedAt: new Date().toISOString(), records },
      null,
      2
    );

    const filePath = `attendance/${weekLabel}.json`;
    await supabase.storage.from("backups").upload(filePath, json, {
      contentType: "application/json",
      upsert: true,
    });
  }

  const { error: deleteError, count: deleted } = await supabase
    .from("attendance")
    .delete({ count: "exact" })
    .gte("attendance_date", startDate)
    .lte("attendance_date", endDate);

  if (deleteError) {
    return { ok: false as const, job: "weekly", error: deleteError.message };
  }

  return {
    ok: true as const,
    job: "weekly",
    timezone: tz,
    weekLabel,
    startDate,
    endDate,
    archivedCount: records.length,
    attendanceDeleted: deleted ?? 0,
  };
}

export function shouldRunScheduledJob(
  job: "daily" | "weekly",
  now = new Date()
): boolean {
  const tz = getTimezone();
  const { weekday, hour, minute } = getZonedParts(now, tz);

  if (job === "daily") {
    return hour === 0 && minute < 15;
  }

  return weekday === "Sun" && hour === 23 && minute < 15;
}
