"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";
import {
  sendDirectMessageAction,
  type MessageFormState,
} from "@/lib/actions/messages";
import { formatDateTime } from "@/lib/utils/date";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert } from "@/components/ui/alert";
import type { DirectMessage } from "@/types";

interface DirectMessageThreadProps {
  otherUserId: string;
  currentUserId: string;
  messages: DirectMessage[];
}

export function DirectMessageThread({
  otherUserId,
  currentUserId,
  messages,
}: DirectMessageThreadProps) {
  const router = useRouter();
  const [state, action, pending] = useActionState<MessageFormState, FormData>(
    sendDirectMessageAction.bind(null, otherUserId),
    null
  );

  return (
    <div className="space-y-4">
      <div className="max-h-96 overflow-y-auto space-y-3 rounded-lg border border-border bg-muted/30 p-4">
        {messages.map((msg) => {
          const isMine = msg.sender_id === currentUserId;
          return (
            <div
              key={msg.id}
              className={`flex ${isMine ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                  isMine
                    ? "bg-primary text-primary-foreground"
                    : "bg-card border border-border"
                }`}
              >
                <p>{msg.content}</p>
                <p
                  className={`mt-1 text-xs ${isMine ? "text-primary-foreground/70" : "text-muted-foreground"}`}
                >
                  {formatDateTime(msg.created_at)}
                </p>
              </div>
            </div>
          );
        })}
        {messages.length === 0 && (
          <p className="text-sm text-muted-foreground text-center">
            No messages yet. Say hello!
          </p>
        )}
      </div>

      <form action={action} className="flex gap-2">
        <Input
          name="content"
          placeholder="Type a message..."
          required
          autoComplete="off"
          className="flex-1"
        />
        <Button type="submit" disabled={pending}>
          {pending ? "..." : "Send"}
        </Button>
      </form>

      {state?.error && (
        <Alert className="border-destructive/50 bg-destructive/10 text-destructive">
          {state.error}
        </Alert>
      )}

      <Button type="button" variant="outline" size="sm" onClick={() => router.refresh()}>
        Refresh
      </Button>
    </div>
  );
}
