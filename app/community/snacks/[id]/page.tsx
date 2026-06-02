import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAuth } from "@/lib/auth/session";
import { getSnackSessionDetail } from "@/lib/actions/snacks";
import { Header } from "@/components/shared/header";
import { SnackDetail } from "@/components/community/snack-detail";

export const dynamic = "force-dynamic";

export default async function SnackSessionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { profile } = await requireAuth();
  const { id } = await params;
  const sessionId = Number(id);

  if (Number.isNaN(sessionId)) notFound();

  const data = await getSnackSessionDetail(sessionId);
  if (!data) notFound();

  return (
    <div className="min-h-full bg-muted/20">
      <Header name={profile.name} role={profile.role} />
      <main className="mx-auto max-w-3xl space-y-6 px-4 py-8">
        <div>
          <Link
            href="/community/snacks"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            ← Snack times
          </Link>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">{data.session.title}</h1>
          <p className="text-sm text-muted-foreground">
            Organiser: {data.session.profiles?.name ?? "Unknown"}
          </p>
        </div>
        <SnackDetail data={data} />
      </main>
    </div>
  );
}
