import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAuth } from "@/lib/auth/session";
import { getEventDetail } from "@/lib/actions/community";
import { formatDateTime } from "@/lib/utils/date";
import { Header } from "@/components/shared/header";
import { EventDetailSections } from "@/components/community/event-detail-sections";

export const dynamic = "force-dynamic";

export default async function CommunityEventPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { profile } = await requireAuth();
  const { id } = await params;
  const eventId = Number(id);

  if (Number.isNaN(eventId)) notFound();

  const data = await getEventDetail(eventId);
  if (!data) notFound();

  return (
    <div className="min-h-full bg-muted/20">
      <Header name={profile.name} role={profile.role} />
      <main className="mx-auto max-w-6xl space-y-6 px-4 py-8">
        <div>
          <Link href="/community" className="text-sm text-muted-foreground hover:text-foreground">
            ← All topics
          </Link>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">{data.event.title}</h1>
          {data.event.description && (
            <p className="mt-2 text-muted-foreground">{data.event.description}</p>
          )}
          <div className="mt-2 flex flex-wrap gap-4 text-sm text-muted-foreground">
            <span>Started {formatDateTime(data.event.created_at)}</span>
            {data.event.location && <span>{data.event.location}</span>}
            <span>By {data.event.profiles?.name ?? "Unknown"}</span>
          </div>
        </div>

        <EventDetailSections data={data} />
      </main>
    </div>
  );
}
