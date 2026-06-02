"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth/session";
import { getTodayDateString } from "@/lib/utils/date";
import { isWithinRadius } from "@/lib/utils/distance";
import type { Attendance, OfficeSettings } from "@/types";

export async function getOfficeSettings(): Promise<OfficeSettings | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("office_settings")
    .select("*")
    .order("id", { ascending: true })
    .limit(1)
    .maybeSingle();

  return data as OfficeSettings | null;
}

export async function getTodayAttendance(): Promise<Attendance | null> {
  const { user } = await requireAuth();
  const supabase = await createClient();
  const today = getTodayDateString();

  const { data } = await supabase
    .from("attendance")
    .select("*")
    .eq("user_id", user.id)
    .eq("attendance_date", today)
    .maybeSingle();

  return data as Attendance | null;
}

export async function getAttendanceHistory(limit = 30): Promise<Attendance[]> {
  const { user } = await requireAuth();
  const supabase = await createClient();

  const { data } = await supabase
    .from("attendance")
    .select("*")
    .eq("user_id", user.id)
    .order("attendance_date", { ascending: false })
    .limit(limit);

  return (data ?? []) as Attendance[];
}

export async function markAttendanceAction(latitude: number, longitude: number) {
  const { user } = await requireAuth();
  const supabase = await createClient();
  const today = getTodayDateString();

  if (
    typeof latitude !== "number" ||
    typeof longitude !== "number" ||
    Number.isNaN(latitude) ||
    Number.isNaN(longitude)
  ) {
    return { error: "Invalid location coordinates." };
  }

  const office = await getOfficeSettings();
  if (!office) {
    return { error: "Office location is not configured. Contact your admin." };
  }

  const withinRange = isWithinRadius(
    latitude,
    longitude,
    office.latitude,
    office.longitude,
    office.radius
  );

  if (!withinRange) {
    return {
      error: `You are outside the office radius (${office.radius}m). Move closer to mark attendance.`,
    };
  }

  const { error } = await supabase.from("attendance").insert({
    user_id: user.id,
    attendance_date: today,
    latitude,
    longitude,
  });

  if (error) {
    if (error.code === "23505") {
      return { error: "Attendance already marked for today." };
    }
    return { error: error.message };
  }

  revalidatePath("/dashboard");
  revalidatePath("/admin");
  return { success: true };
}
