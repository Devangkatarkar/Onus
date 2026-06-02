import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Profile, UserRole } from "@/types";

export async function getSessionUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function getProfile(userId: string): Promise<Profile | null> {
  const { profile } = await getProfileStatus(userId);
  return profile;
}

export async function getProfileStatus(userId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, name, role, created_at")
    .eq("id", userId)
    .maybeSingle();

  return {
    profile: (data as Profile | null) ?? null,
    error: error?.message ?? null,
    errorCode: error?.code ?? null,
  };
}

export async function requireAuth() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const profile = await getProfile(user.id);
  if (!profile) redirect("/profile-setup");

  return { user, profile };
}

export async function requireRole(allowedRoles: UserRole[]) {
  const { user, profile } = await requireAuth();
  if (!allowedRoles.includes(profile.role)) {
    redirect(profile.role === "admin" ? "/admin" : "/dashboard");
  }
  return { user, profile };
}
