import "server-only";
import { loadEnvConfig } from "@next/env";

let envLoaded = false;

function ensureEnvLoaded() {
  if (!envLoaded) {
    loadEnvConfig(process.cwd());
    envLoaded = true;
  }
}

/** Server-only. Never import in client components. */
export function getServiceRoleKey(): string {
  ensureEnvLoaded();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ?? "";
  return key.replace(/^["']|["']$/g, "");
}

export function isServiceRoleConfigured(): boolean {
  return getServiceRoleKey().length > 0;
}

export const SERVICE_ROLE_SETUP_MESSAGE =
  "Service role key not detected. Save .env.local, stop the terminal (Ctrl+C), run npm run dev again, then hard-refresh this page (Ctrl+Shift+R).";
