import Link from "next/link";
import { requireAuth } from "@/lib/auth/session";
import { getSnackSessions } from "@/lib/actions/snacks";
import { Header } from "@/components/shared/header";
import { CreateSnackForm } from "@/components/community/create-snack-form";
import { SnackList } from "@/components/community/snack-list";

export const dynamic = "force-dynamic";

export default async function SnacksPage() {
  const { profile } = await requireAuth();
  const sessions = await getSnackSessions();

  return (
    <div className="min-h-screen bg-background/50">
      <Header name={profile.name} role={profile.role} />
      <main className="mx-auto max-w-6xl space-y-6 md:space-y-8 px-4 py-6 md:py-10">
        <div>
          <Link
            href="/community"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            ← Community
          </Link>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">Snack time</h1>
          <p className="text-muted-foreground">
            Any employee can organise. Others send orders, scan QR, and mark paid.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-1">
            <CreateSnackForm />
          </div>
          <div className="lg:col-span-2">
            <h2 className="mb-4 text-xl font-semibold">Active snack times</h2>
            <SnackList sessions={sessions} />
          </div>
        </div>
      </main>
    </div>
  );
}
