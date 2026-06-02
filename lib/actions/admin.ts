"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/session";
import { getTodayDateString } from "@/lib/utils/date";
import type { AttendanceWithProfile } from "@/types";
import { normalizeProfileJoin } from "@/lib/utils/supabase";

export async function getAdminDashboardData() {
  await requireRole(["admin"]);
  const supabase = await createClient();
  const today = getTodayDateString();

  const [{ count: todayCount }, { count: totalEmployees }, { data: todayRecords }] =
    await Promise.all([
      supabase
        .from("attendance")
        .select("*", { count: "exact", head: true })
        .eq("attendance_date", today),
      supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .eq("role", "employee"),
      supabase
        .from("attendance")
        .select(
          "id, user_id, attendance_date, marked_at, latitude, longitude, profiles(name, role)"
        )
        .eq("attendance_date", today)
        .order("marked_at", { ascending: false }),
    ]);

  return {
    today,
    todayCount: todayCount ?? 0,
    totalEmployees: totalEmployees ?? 0,
    todayRecords: (todayRecords ?? []).map((record) => ({
      ...record,
      profiles: normalizeProfileJoin(record.profiles),
    })) as AttendanceWithProfile[],
  };
}

export async function getAttendanceByDate(date: string) {
  await requireRole(["admin"]);
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("attendance")
    .select(
      "id, user_id, attendance_date, marked_at, latitude, longitude, profiles(name, role)"
    )
    .eq("attendance_date", date)
    .order("marked_at", { ascending: false });

  if (error) {
    return { error: error.message, records: [] as AttendanceWithProfile[] };
  }

  return {
    records: (data ?? []).map((record) => ({
      ...record,
      profiles: normalizeProfileJoin(record.profiles),
    })) as AttendanceWithProfile[],
  };
}

export async function updateOfficeSettingsAction(
  latitude: number,
  longitude: number,
  radius: number
) {
  await requireRole(["admin"]);
  const supabase = await createClient();

  if (
    Number.isNaN(latitude) ||
    Number.isNaN(longitude) ||
    Number.isNaN(radius) ||
    radius < 10 ||
    radius > 5000
  ) {
    return { error: "Invalid office settings. Radius must be between 10 and 5000 meters." };
  }

  const { data: existing } = await supabase
    .from("office_settings")
    .select("id")
    .order("id", { ascending: true })
    .limit(1)
    .maybeSingle();

  let error;

  if (existing) {
    ({ error } = await supabase
      .from("office_settings")
      .update({
        latitude,
        longitude,
        radius,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id));
  } else {
    ({ error } = await supabase.from("office_settings").insert({
      latitude,
      longitude,
      radius,
    }));
  }

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/admin/settings");
  revalidatePath("/dashboard");
  return { success: true };
}
