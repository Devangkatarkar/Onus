import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAuth } from "@/lib/auth/session";
import { getDirectMessages } from "@/lib/actions/messages";
import { Header } from "@/components/shared/header";
import { DirectMessageThread } from "@/components/community/direct-message-thread";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export default async function DirectMessagePage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { user, profile } = await requireAuth();
  const { userId } = await params;
  const { messages, otherUser } = await getDirectMessages(userId);

  if (!otherUser) notFound();

  return (
    <div className="min-h-full bg-muted/20">
      <Header name={profile.name} role={profile.role} />
      <main className="mx-auto max-w-2xl space-y-6 px-4 py-8">
        <div>
          <Link
            href="/community/messages"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            ← All messages
          </Link>
          <div className="mt-2 flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">{otherUser.name}</h1>
            <Badge variant="secondary">{otherUser.role}</Badge>
          </div>
        </div>

        <DirectMessageThread
          otherUserId={userId}
          currentUserId={user.id}
          messages={messages}
        />
      </main>
    </div>
  );
}
