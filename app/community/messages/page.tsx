import Link from "next/link";
import { requireAuth } from "@/lib/auth/session";
import {
  getMessageableUsers,
  getRecentConversations,
} from "@/lib/actions/messages";
import { Header } from "@/components/shared/header";
import { MessagesHub } from "@/components/community/messages-hub";

export const dynamic = "force-dynamic";

export default async function CommunityMessagesPage() {
  const { profile } = await requireAuth();
  const [conversations, users] = await Promise.all([
    getRecentConversations(),
    getMessageableUsers(),
  ]);

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
          <h1 className="mt-2 text-3xl font-bold tracking-tight">Messages</h1>
          <p className="text-muted-foreground">
            Private chats with other team members
          </p>
        </div>
        <MessagesHub conversations={conversations} users={users} />
      </main>
    </div>
  );
}
