"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { normalizeProfileJoin } from "@/lib/utils/supabase";
import { uploadPaymentQrImage } from "@/lib/storage/upload-qr";
import { hasPaymentMethod } from "@/lib/utils/payment-qr";
import type {
  ChatMessage,
  CommunityEvent,
  DiscussionPost,
  EventDetailData,
  EventPayment,
  ItineraryItem,
  Poll,
} from "@/types";

export type CommunityFormState = { error?: string; success?: string } | null;

export async function getCommunityEvents(): Promise<CommunityEvent[]> {
  await requireAuth();
  const supabase = await createClient();

  const { data } = await supabase
    .from("community_events")
    .select("*, profiles(name)")
    .order("created_at", { ascending: false });

  return (data ?? []).map((row) => ({
    ...row,
    profiles: normalizeProfileJoin(row.profiles),
  })) as CommunityEvent[];
}

export async function getEventDetail(eventId: number): Promise<EventDetailData | null> {
  const { user } = await requireAuth();
  const supabase = await createClient();

  const { data: event } = await supabase
    .from("community_events")
    .select("*, profiles(name)")
    .eq("id", eventId)
    .maybeSingle();

  if (!event) return null;

  const [
    { data: posts },
    { data: itinerary },
    { data: polls },
    { data: payments },
    { data: messages },
  ] = await Promise.all([
    supabase
      .from("discussion_posts")
      .select("*, profiles(name)")
      .eq("event_id", eventId)
      .order("created_at", { ascending: false }),
    supabase
      .from("itinerary_items")
      .select("*, profiles(name)")
      .eq("event_id", eventId)
      .order("created_at", { ascending: true }),
    supabase
      .from("polls")
      .select("*, poll_options(id, poll_id, option_text)")
      .eq("event_id", eventId)
      .order("created_at", { ascending: false }),
    supabase
      .from("event_payments")
      .select("*")
      .eq("event_id", eventId)
      .order("created_at", { ascending: false }),
    supabase
      .from("chat_messages")
      .select("*, profiles(name)")
      .eq("event_id", eventId)
      .order("created_at", { ascending: true })
      .limit(100),
  ]);

  const pollIds = (polls ?? []).map((p) => p.id);
  let voteCounts: Record<number, number> = {};
  let userVotes: Record<number, number> = {};

  if (pollIds.length > 0) {
    const { data: votes } = await supabase
      .from("poll_votes")
      .select("poll_id, option_id, user_id")
      .in("poll_id", pollIds);

    for (const vote of votes ?? []) {
      voteCounts[vote.option_id] = (voteCounts[vote.option_id] ?? 0) + 1;
      if (vote.user_id === user.id) {
        userVotes[vote.poll_id] = vote.option_id;
      }
    }
  }

  const paymentIds = (payments ?? []).map((p) => p.id);
  let confirmCounts: Record<number, number> = {};
  let userConfirmed: Record<number, boolean> = {};

  if (paymentIds.length > 0) {
    const { data: confirmations } = await supabase
      .from("payment_confirmations")
      .select("payment_id, user_id")
      .in("payment_id", paymentIds);

    for (const c of confirmations ?? []) {
      confirmCounts[c.payment_id] = (confirmCounts[c.payment_id] ?? 0) + 1;
      if (c.user_id === user.id) userConfirmed[c.payment_id] = true;
    }
  }

  const enrichedPolls = (polls ?? []).map((poll) => ({
    ...poll,
    poll_options: (poll.poll_options ?? []).map(
      (opt: { id: number; poll_id: number; option_text: string }) => ({
        ...opt,
        vote_count: voteCounts[opt.id] ?? 0,
      })
    ),
    user_vote_option_id: userVotes[poll.id],
  })) as Poll[];

  return {
    event: {
      ...event,
      profiles: normalizeProfileJoin(event.profiles),
    } as CommunityEvent,
    posts: (posts ?? []).map((p) => ({
      ...p,
      profiles: normalizeProfileJoin(p.profiles),
    })) as DiscussionPost[],
    itinerary: (itinerary ?? []).map((i) => ({
      ...i,
      profiles: normalizeProfileJoin(i.profiles),
    })) as ItineraryItem[],
    polls: enrichedPolls,
    payments: (payments ?? []).map((p) => ({
      ...p,
      confirmation_count: confirmCounts[p.id] ?? 0,
      user_confirmed: userConfirmed[p.id] ?? false,
    })) as EventPayment[],
    messages: (messages ?? []).map((m) => ({
      ...m,
      profiles: normalizeProfileJoin(m.profiles),
    })) as ChatMessage[],
  };
}

export async function createEventAction(
  _prev: CommunityFormState,
  formData: FormData
): Promise<CommunityFormState> {
  const { user } = await requireAuth();
  const supabase = await createClient();

  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const location = String(formData.get("location") ?? "").trim();

  if (!title) return { error: "Title is required." };

  const { error } = await supabase.from("community_events").insert({
    title,
    description: description || null,
    event_date: null,
    location: location || null,
    created_by: user.id,
  });

  if (error) return { error: error.message };

  revalidatePath("/community");
  return { success: "Topic created." };
}

export async function addDiscussionAction(
  eventId: number,
  _prev: CommunityFormState,
  formData: FormData
): Promise<CommunityFormState> {
  const { user } = await requireAuth();
  const content = String(formData.get("content") ?? "").trim();
  if (!content) return { error: "Message cannot be empty." };

  const supabase = await createClient();
  const { error } = await supabase.from("discussion_posts").insert({
    event_id: eventId,
    user_id: user.id,
    content,
  });

  if (error) return { error: error.message };
  revalidatePath(`/community/${eventId}`);
  return { success: "Posted." };
}

export async function addItineraryAction(
  eventId: number,
  _prev: CommunityFormState,
  formData: FormData
): Promise<CommunityFormState> {
  const { user } = await requireAuth();
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  if (!title) return { error: "Title is required." };

  const supabase = await createClient();
  const { error } = await supabase.from("itinerary_items").insert({
    event_id: eventId,
    title,
    description: description || null,
    suggested_by: user.id,
  });

  if (error) return { error: error.message };
  revalidatePath(`/community/${eventId}`);
  return { success: "Itinerary item added." };
}

export async function createPollAction(
  eventId: number,
  _prev: CommunityFormState,
  formData: FormData
): Promise<CommunityFormState> {
  const { user } = await requireAuth();
  const question = String(formData.get("question") ?? "").trim();
  const options = String(formData.get("options") ?? "")
    .split("\n")
    .map((o) => o.trim())
    .filter(Boolean);

  if (!question) return { error: "Question is required." };
  if (options.length < 2) return { error: "Add at least 2 options (one per line)." };

  const supabase = await createClient();
  const { data: poll, error } = await supabase
    .from("polls")
    .insert({ event_id: eventId, question, created_by: user.id })
    .select("id")
    .single();

  if (error || !poll) return { error: error?.message ?? "Failed to create poll." };

  const { error: optError } = await supabase.from("poll_options").insert(
    options.map((option_text) => ({ poll_id: poll.id, option_text }))
  );

  if (optError) return { error: optError.message };

  revalidatePath(`/community/${eventId}`);
  return { success: "Poll created." };
}

export async function votePollAction(eventId: number, pollId: number, optionId: number) {
  const { user } = await requireAuth();
  const supabase = await createClient();

  await supabase.from("poll_votes").delete().eq("poll_id", pollId).eq("user_id", user.id);

  const { error } = await supabase.from("poll_votes").insert({
    poll_id: pollId,
    option_id: optionId,
    user_id: user.id,
  });

  if (error) return { error: error.message };
  revalidatePath(`/community/${eventId}`);
  return { success: true };
}

export async function addPaymentAction(
  eventId: number,
  _prev: CommunityFormState,
  formData: FormData
): Promise<CommunityFormState> {
  const { user } = await requireAuth();
  const title = String(formData.get("title") ?? "").trim();
  const amount = String(formData.get("amount") ?? "").trim();
  const paymentLink = String(formData.get("payment_link") ?? "").trim();
  const qrFile = formData.get("qr_image") as File | null;

  if (!title) return { error: "Payment title is required." };

  let paymentQrUrl: string | null = null;
  if (qrFile && qrFile.size > 0) {
    const uploaded = await uploadPaymentQrImage(user.id, `events/${eventId}`, qrFile);
    if (uploaded.error) return { error: uploaded.error };
    paymentQrUrl = uploaded.url ?? null;
  }

  if (!hasPaymentMethod(paymentQrUrl, paymentLink)) {
    return { error: "Upload a QR image or enter a UPI / payment link." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("event_payments").insert({
    event_id: eventId,
    title,
    amount: amount ? Number(amount) : null,
    payment_link: paymentLink || null,
    payment_qr_url: paymentQrUrl,
    created_by: user.id,
  });

  if (error) return { error: error.message };
  revalidatePath(`/community/${eventId}`);
  return { success: "Payment collection added." };
}

export async function confirmPaymentAction(eventId: number, paymentId: number) {
  const { user } = await requireAuth();
  const supabase = await createClient();

  const { error } = await supabase.from("payment_confirmations").insert({
    payment_id: paymentId,
    user_id: user.id,
  });

  if (error) {
    if (error.code === "23505") return { error: "You already confirmed this payment." };
    return { error: error.message };
  }

  revalidatePath(`/community/${eventId}`);
  return { success: true };
}

export async function sendChatAction(
  eventId: number,
  _prev: CommunityFormState,
  formData: FormData
): Promise<CommunityFormState> {
  const { user } = await requireAuth();
  const message = String(formData.get("message") ?? "").trim();
  if (!message) return { error: "Message cannot be empty." };

  const supabase = await createClient();
  const { error } = await supabase.from("chat_messages").insert({
    event_id: eventId,
    user_id: user.id,
    message,
  });

  if (error) return { error: error.message };
  revalidatePath(`/community/${eventId}`);
  return { success: "Sent." };
}
