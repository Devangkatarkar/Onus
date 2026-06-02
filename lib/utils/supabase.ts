import type { Profile } from "@/types";

type ProfileJoin = Pick<Profile, "name" | "role"> | Pick<Profile, "name" | "role">[] | null;

export function normalizeProfileJoin(
  profile: ProfileJoin
): Pick<Profile, "name" | "role"> | null {
  if (!profile) return null;
  if (Array.isArray(profile)) return profile[0] ?? null;
  return profile;
}
