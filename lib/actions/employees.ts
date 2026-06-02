"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Profile, UserRole } from "@/types";

export type EmployeeFormState = {
  error?: string;
  success?: string;
} | null;

export async function getEmployees(): Promise<Profile[]> {
  await requireRole(["admin"]);
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("profiles")
    .select("id, name, role, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    return [];
  }

  return (data ?? []) as Profile[];
}

export async function createEmployeeAction(
  _prevState: EmployeeFormState,
  formData: FormData
): Promise<EmployeeFormState> {
  await requireRole(["admin"]);

  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const role = String(formData.get("role") ?? "employee") as UserRole;

  if (!name) {
    return { error: "Name is required." };
  }

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: "A valid email is required." };
  }

  if (password.length < 6) {
    return { error: "Password must be at least 6 characters." };
  }

  if (role !== "employee" && role !== "admin") {
    return { error: "Invalid role selected." };
  }

  let adminClient;
  try {
    adminClient = createAdminClient();
  } catch (err) {
    return {
      error:
        err instanceof Error
          ? err.message
          : "Server is not configured for user creation.",
    };
  }

  const { data: authData, error: authError } =
    await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

  if (authError) {
    return { error: authError.message };
  }

  if (!authData.user) {
    return { error: "User was not created." };
  }

  const { error: profileError } = await adminClient.from("profiles").insert({
    id: authData.user.id,
    name,
    role,
  });

  if (profileError) {
    await adminClient.auth.admin.deleteUser(authData.user.id);
    return { error: profileError.message };
  }

  revalidatePath("/admin");
  revalidatePath("/admin/employees");

  return {
    success: `${role === "admin" ? "Admin" : "Employee"} "${name}" created. They can sign in with the email and password you set.`,
  };
}
