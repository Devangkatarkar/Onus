import { redirect } from "next/navigation";
import { getSessionUser, getProfile } from "@/lib/auth/session";

export default async function HomePage() {
  const user = await getSessionUser();

  if (!user) {
    redirect("/login");
  }

  const profile = await getProfile(user.id);
  if (!profile) {
    redirect("/profile-setup");
  }

  redirect(profile.role === "admin" ? "/admin" : "/dashboard");
}
