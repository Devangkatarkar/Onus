import Link from "next/link";
import { formatDateTime } from "@/lib/utils/date";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { MessageThreadPartner, Profile } from "@/types";

interface MessagesHubProps {
  conversations: MessageThreadPartner[];
  users: Profile[];
}

export function MessagesHub({ conversations, users }: MessagesHubProps) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Recent chats</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {conversations.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No conversations yet. Message someone from the team list.
            </p>
          ) : (
            conversations.map((chat) => (
              <Link
                key={chat.user_id}
                href={`/community/messages/${chat.user_id}`}
                className="block rounded-lg border border-border p-3 hover:bg-muted/50"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium">{chat.name}</span>
                  <Badge variant="secondary">{chat.role}</Badge>
                </div>
                <p className="mt-1 truncate text-sm text-muted-foreground">
                  {chat.last_message}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {formatDateTime(chat.last_message_at)}
                </p>
              </Link>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Message a teammate</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {users.length === 0 ? (
            <p className="text-sm text-muted-foreground">No other users yet.</p>
          ) : (
            users.map((user) => (
              <Link
                key={user.id}
                href={`/community/messages/${user.id}`}
                className="flex items-center justify-between rounded-lg border border-border p-3 hover:bg-muted/50"
              >
                <span className="font-medium">{user.name}</span>
                <Badge variant="secondary">{user.role}</Badge>
              </Link>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
