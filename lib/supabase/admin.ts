import "server-only";
import { createClient } from "@supabase/supabase-js";
import { getServiceRoleKey } from "@/lib/env";

/** Server-only client with service role — never import in client components. */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = getServiceRoleKey();

  if (!url || !serviceKey) {
    throw new Error(
      "Missing SUPABASE_SERVICE_ROLE_KEY in .env.local. In Supabase: Project Settings → API → copy the service_role key (secret, not anon). Restart the dev server after saving."
    );
  }

  return createClient(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
