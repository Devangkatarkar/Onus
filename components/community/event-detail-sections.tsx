"use client";

import { useActionState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  addDiscussionAction,
  addItineraryAction,
  addPaymentAction,
  confirmPaymentAction,
  createPollAction,
  sendChatAction,
  votePollAction,
  type CommunityFormState,
} from "@/lib/actions/community";
import { getPaymentQrDisplay } from "@/lib/utils/payment-qr";
import { formatDateTime } from "@/lib/utils/date";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { EventDetailData } from "@/types";

function FormAlert({ state }: { state: CommunityFormState }) {
  if (!state) return null;
  if (state.error)
    return (
      <Alert className="border-destructive/50 bg-destructive/10 text-destructive">
        {state.error}
      </Alert>
    );
  if (state.success)
    return (
      <Alert className="border-emerald-500/50 bg-emerald-50 text-emerald-900 dark:bg-emerald-900/20 dark:text-emerald-200">
        {state.success}
      </Alert>
    );
  return null;
}

export function EventDetailSections({ data }: { data: EventDetailData }) {
  const eventId = data.event.id;
  const router = useRouter();
  const [, startTransition] = useTransition();

  const [discState, discAction, discPending] = useActionState<CommunityFormState, FormData>(
    addDiscussionAction.bind(null, eventId),
    null
  );
  const [itinState, itinAction, itinPending] = useActionState<CommunityFormState, FormData>(
    addItineraryAction.bind(null, eventId),
    null
  );
  const [pollState, pollAction, pollPending] = useActionState<CommunityFormState, FormData>(
    createPollAction.bind(null, eventId),
    null
  );
  const [payState, payAction, payPending] = useActionState<CommunityFormState, FormData>(
    addPaymentAction.bind(null, eventId),
    null
  );
  const [chatState, chatAction, chatPending] = useActionState<CommunityFormState, FormData>(
    sendChatAction.bind(null, eventId),
    null
  );

  async function handleVote(pollId: number, optionId: number) {
    const result = await votePollAction(eventId, pollId, optionId);
    if (!result.error) {
      startTransition(() => router.refresh());
    }
  }

  async function handleConfirmPayment(paymentId: number) {
    await confirmPaymentAction(eventId, paymentId);
    startTransition(() => router.refresh());
  }

  return (
    <div className="space-y-6">
      {/* Discussions */}
      <Card>
        <CardHeader>
          <CardTitle>Discussions</CardTitle>
          <CardDescription>Community posts for this event</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form action={discAction} className="space-y-2">
            <Input name="content" placeholder="Share an update or question..." required />
            <FormAlert state={discState} />
            <Button type="submit" size="sm" disabled={discPending}>
              Post
            </Button>
          </form>
          <div className="space-y-3">
            {data.posts.map((post) => (
              <div key={post.id} className="rounded-lg border border-border p-3">
                <p className="text-sm font-medium">{post.profiles?.name ?? "User"}</p>
                <p className="mt-1">{post.content}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {formatDateTime(post.created_at)}
                </p>
              </div>
            ))}
            {data.posts.length === 0 && (
              <p className="text-sm text-muted-foreground">No posts yet.</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Itinerary */}
      <Card>
        <CardHeader>
          <CardTitle>Itinerary suggestions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <form action={itinAction} className="space-y-2">
            <Input name="title" placeholder="Activity title" required />
            <Input name="description" placeholder="Details (optional)" />
            <FormAlert state={itinState} />
            <Button type="submit" size="sm" disabled={itinPending}>
              Suggest item
            </Button>
          </form>
          <ul className="space-y-2">
            {data.itinerary.map((item) => (
              <li key={item.id} className="rounded-lg border border-border p-3">
                <p className="font-medium">{item.title}</p>
                {item.description && (
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  {item.profiles?.name} · {formatDateTime(item.created_at)}
                </p>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Polls */}
      <Card>
        <CardHeader>
          <CardTitle>Polls</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <form action={pollAction} className="space-y-2">
            <Input name="question" placeholder="Poll question" required />
            <textarea
              name="options"
              required
              rows={3}
              placeholder="Options (one per line)"
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
            <FormAlert state={pollState} />
            <Button type="submit" size="sm" disabled={pollPending}>
              Create poll
            </Button>
          </form>
          {data.polls.map((poll) => {
            const totalVotes = (poll.poll_options ?? []).reduce(
              (sum, o) => sum + (o.vote_count ?? 0),
              0
            );
            const userVote = poll.user_vote_option_id;

            return (
              <div key={poll.id} className="rounded-lg border border-border p-3 space-y-2">
                <p className="font-medium">{poll.question}</p>
                {(poll.poll_options ?? []).map((opt) => {
                  const pct =
                    totalVotes > 0
                      ? Math.round(((opt.vote_count ?? 0) / totalVotes) * 100)
                      : 0;
                  return (
                    <div key={opt.id} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>{opt.option_text}</span>
                        <span>
                          {opt.vote_count ?? 0} ({pct}%)
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full bg-primary"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        variant={userVote === opt.id ? "default" : "outline"}
                        onClick={() => handleVote(poll.id, opt.id)}
                      >
                        {userVote === opt.id ? "Voted" : "Vote"}
                      </Button>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Payments + QR */}
      <Card>
        <CardHeader>
          <CardTitle>Payment collection</CardTitle>
          <CardDescription>
            Upload a QR image or add a payment link; anyone on the topic can confirm paid
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form action={payAction} className="space-y-2">
            <Input name="title" placeholder="e.g. Event fee" required />
            <Input name="amount" type="number" step="0.01" placeholder="Amount (optional)" />
            <div className="space-y-1">
              <Label htmlFor="qr_image">QR image</Label>
              <Input
                id="qr_image"
                name="qr_image"
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
              />
            </div>
            <Input
              name="payment_link"
              placeholder="Or UPI link / payment URL (optional if image uploaded)"
            />
            <FormAlert state={payState} />
            <Button type="submit" size="sm" disabled={payPending}>
              Add payment
            </Button>
          </form>
          {data.payments.map((payment) => {
            const qrUrl = getPaymentQrDisplay(
              payment.payment_qr_url,
              payment.payment_link
            );

            return (
              <div key={payment.id} className="rounded-lg border border-border p-3 flex flex-wrap gap-4">
                <div className="flex-1 min-w-[200px]">
                  <p className="font-medium">{payment.title}</p>
                  {payment.amount != null && (
                    <p className="text-sm">Amount: {payment.amount}</p>
                  )}
                  <p className="text-sm text-muted-foreground">
                    {payment.confirmation_count ?? 0} confirmed
                  </p>
                  <Button
                    type="button"
                    size="sm"
                    className="mt-2"
                    variant={payment.user_confirmed ? "secondary" : "default"}
                    disabled={payment.user_confirmed}
                    onClick={() => handleConfirmPayment(payment.id)}
                  >
                    {payment.user_confirmed ? "You confirmed" : "I paid"}
                  </Button>
                </div>
                {qrUrl && (
                  <img
                    src={qrUrl}
                    alt={`QR for ${payment.title}`}
                    width={160}
                    height={160}
                    className="rounded border border-border"
                  />
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Chat (refresh-based, no realtime subscription) */}
      <Card>
        <CardHeader>
          <CardTitle>Group chat</CardTitle>
          <CardDescription>Messages update when you post or refresh the page</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="max-h-64 overflow-y-auto space-y-2 rounded-lg border border-border p-3 bg-muted/30">
            {data.messages.map((msg) => (
              <div key={msg.id}>
                <span className="text-sm font-medium">{msg.profiles?.name}: </span>
                <span className="text-sm">{msg.message}</span>
                <p className="text-xs text-muted-foreground">
                  {formatDateTime(msg.created_at)}
                </p>
              </div>
            ))}
            {data.messages.length === 0 && (
              <p className="text-sm text-muted-foreground">No messages yet.</p>
            )}
          </div>
          <form action={chatAction} className="flex gap-2">
            <Input name="message" placeholder="Type a message..." required className="flex-1" />
            <Button type="submit" disabled={chatPending}>
              Send
            </Button>
          </form>
          <FormAlert state={chatState} />
          <Button type="button" variant="outline" size="sm" onClick={() => router.refresh()}>
            Refresh messages
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
