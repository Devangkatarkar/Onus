import Link from "next/link";
import { requireAuth } from "@/lib/auth/session";
import { getCommunityEvents } from "@/lib/actions/community";
import { Header } from "@/components/shared/header";
import { CreateEventForm } from "@/components/community/create-event-form";
import { EventList } from "@/components/community/event-list";

export const dynamic = "force-dynamic";

export default async function CommunityPage() {
  const { profile } = await requireAuth();
  const events = await getCommunityEvents();

  const homeHref = profile.role === "admin" ? "/admin" : "/dashboard";

  return (
    <div className="min-h-screen bg-background/50">
      <Header name={profile.name} role={profile.role} />
      <main className="mx-auto max-w-6xl space-y-6 md:space-y-8 px-4 py-6 md:py-10">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Community</h1>
            <p className="text-muted-foreground">
              Message teammates, active topics, polls, and payments
            </p>
          </div>
          <Link
            href={homeHref}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            ← Back to {profile.role === "admin" ? "admin" : "dashboard"}
          </Link>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Link
            href="/community/messages"
            className="flex items-center justify-between rounded-xl border border-border bg-card p-5 shadow-sm transition-shadow hover:shadow-md"
          >
            <div>
              <p className="text-lg font-semibold">Messages</p>
              <p className="text-sm text-muted-foreground">
                Chat privately with teammates
              </p>
            </div>
            <span className="text-2xl text-muted-foreground">→</span>
          </Link>
          <Link
            href="/community/snacks"
            className="flex items-center justify-between rounded-xl border border-border bg-card p-5 shadow-sm transition-shadow hover:shadow-md"
          >
            <div>
              <p className="text-lg font-semibold">Snack time</p>
              <p className="text-sm text-muted-foreground">
                Orders, QR payment, mark paid — anyone can organise
              </p>
            </div>
            <span className="text-2xl text-muted-foreground">→</span>
          </Link>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-1 space-y-4">
            <CreateEventForm />
            <p className="text-xs text-muted-foreground px-1">
              Topics, snack orders, and payments are open to every employee.
            </p>
          </div>
          <div className="lg:col-span-2">
            <h2 className="mb-4 text-xl font-semibold">Active topics</h2>
            <EventList events={events} />
          </div>
        </div>
      </main>
    </div>
  );
}
