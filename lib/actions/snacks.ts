"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { normalizeProfileJoin } from "@/lib/utils/supabase";
import { uploadPaymentQrImage } from "@/lib/storage/upload-qr";
import { hasPaymentMethod } from "@/lib/utils/payment-qr";
import type { SnackOrder, SnackSession, SnackSessionDetail } from "@/types";

export type SnackFormState = { error?: string; success?: string } | null;

export async function getSnackSessions(): Promise<SnackSession[]> {
  await requireAuth();
  const supabase = await createClient();

  const { data: sessions } = await supabase
    .from("snack_sessions")
    .select("*, profiles(name)")
    .eq("is_open", true)
    .order("created_at", { ascending: false });

  if (!sessions?.length) return [];

  const sessionIds = sessions.map((s) => s.id);
  const { data: orderCounts } = await supabase
    .from("snack_orders")
    .select("session_id")
    .in("session_id", sessionIds);

  const counts: Record<number, number> = {};
  for (const row of orderCounts ?? []) {
    counts[row.session_id] = (counts[row.session_id] ?? 0) + 1;
  }

  return sessions.map((s) => ({
    ...s,
    profiles: normalizeProfileJoin(s.profiles),
    order_count: counts[s.id] ?? 0,
  })) as SnackSession[];
}

export async function getSnackSessionDetail(
  sessionId: number
): Promise<SnackSessionDetail | null> {
  const { user } = await requireAuth();
  const supabase = await createClient();

  const { data: session } = await supabase
    .from("snack_sessions")
    .select("*, profiles(name)")
    .eq("id", sessionId)
    .maybeSingle();

  if (!session) return null;

  const [{ data: orders }, { data: payments }] = await Promise.all([
    supabase
      .from("snack_orders")
      .select("*, profiles(name)")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: true }),
    supabase
      .from("snack_payments")
      .select("user_id")
      .eq("session_id", sessionId),
  ]);

  const paidUserIds = new Set((payments ?? []).map((p) => p.user_id));

  const enrichedOrders = (orders ?? []).map((o) => ({
    ...o,
    profiles: normalizeProfileJoin(o.profiles),
    paid: paidUserIds.has(o.user_id),
  })) as SnackOrder[];

  const myOrder = enrichedOrders.find((o) => o.user_id === user.id) ?? null;

  return {
    session: {
      ...session,
      profiles: normalizeProfileJoin(session.profiles),
      order_count: enrichedOrders.length,
    } as SnackSession,
    orders: enrichedOrders,
    myOrder,
    myPaid: paidUserIds.has(user.id),
    isOrganizer: session.organizer_id === user.id,
  };
}

export async function createSnackSessionAction(
  _prev: SnackFormState,
  formData: FormData
): Promise<SnackFormState> {
  const { user } = await requireAuth();
  const title = String(formData.get("title") ?? "").trim();

  if (!title) return { error: "Snack time title is required." };

  const supabase = await createClient();
  const { error } = await supabase.from("snack_sessions").insert({
    title,
    organizer_id: user.id,
  });

  if (error) return { error: error.message };

  revalidatePath("/community/snacks");
  return { success: "Snack time created. You are the organiser." };
}

export async function submitSnackOrderAction(
  sessionId: number,
  _prev: SnackFormState,
  formData: FormData
): Promise<SnackFormState> {
  const { user } = await requireAuth();
  const orderText = String(formData.get("order_text") ?? "").trim();

  if (!orderText) return { error: "Write what you want to order." };

  const supabase = await createClient();

  const { data: session } = await supabase
    .from("snack_sessions")
    .select("is_open")
    .eq("id", sessionId)
    .maybeSingle();

  if (!session?.is_open) return { error: "This snack time is closed." };

  const { error } = await supabase.from("snack_orders").upsert(
    {
      session_id: sessionId,
      user_id: user.id,
      order_text: orderText,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "session_id,user_id" }
  );

  if (error) return { error: error.message };

  revalidatePath(`/community/snacks/${sessionId}`);
  return { success: "Your order was sent to the organiser." };
}

export async function updateSnackPaymentAction(
  sessionId: number,
  _prev: SnackFormState,
  formData: FormData
): Promise<SnackFormState> {
  const { user } = await requireAuth();
  const paymentLink = String(formData.get("payment_link") ?? "").trim();
  const amount = String(formData.get("amount_per_person") ?? "").trim();
  const paymentNote = String(formData.get("payment_note") ?? "").trim();
  const qrFile = formData.get("qr_image") as File | null;

  const supabase = await createClient();

  const { data: session } = await supabase
    .from("snack_sessions")
    .select("organizer_id, payment_qr_url")
    .eq("id", sessionId)
    .maybeSingle();

  if (!session || session.organizer_id !== user.id) {
    return { error: "Only the organiser can set payment details." };
  }

  let paymentQrUrl = session.payment_qr_url;

  if (qrFile && qrFile.size > 0) {
    const uploaded = await uploadPaymentQrImage(user.id, "snacks", qrFile);
    if (uploaded.error) return { error: uploaded.error };
    paymentQrUrl = uploaded.url ?? paymentQrUrl;
  }

  if (!hasPaymentMethod(paymentQrUrl, paymentLink)) {
    return { error: "Upload a QR image or enter a UPI / payment link." };
  }

  const { error } = await supabase
    .from("snack_sessions")
    .update({
      payment_link: paymentLink || null,
      payment_qr_url: paymentQrUrl,
      amount_per_person: amount ? Number(amount) : null,
      payment_note: paymentNote || null,
    })
    .eq("id", sessionId);

  if (error) return { error: error.message };

  revalidatePath(`/community/snacks/${sessionId}`);
  return { success: "Payment details saved." };
}

export async function markSnackPaidAction(sessionId: number) {
  const { user } = await requireAuth();
  const supabase = await createClient();

  const { data: session } = await supabase
    .from("snack_sessions")
    .select("organizer_id, payment_link, payment_qr_url")
    .eq("id", sessionId)
    .maybeSingle();

  if (!session || !hasPaymentMethod(session.payment_qr_url, session.payment_link)) {
    return { error: "Organiser has not added a payment QR yet." };
  }

  if (session.organizer_id === user.id) {
    return { error: "Organiser does not need to mark paid." };
  }

  const { data: myOrder } = await supabase
    .from("snack_orders")
    .select("id")
    .eq("session_id", sessionId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!myOrder) {
    return { error: "Submit your order before marking paid." };
  }

  const { error } = await supabase.from("snack_payments").insert({
    session_id: sessionId,
    user_id: user.id,
  });

  if (error) {
    if (error.code === "23505") return { error: "You already marked as paid." };
    return { error: error.message };
  }

  revalidatePath(`/community/snacks/${sessionId}`);
  return { success: true };
}

export async function closeSnackSessionAction(sessionId: number) {
  const { user } = await requireAuth();
  const supabase = await createClient();

  const { error } = await supabase
    .from("snack_sessions")
    .update({ is_open: false })
    .eq("id", sessionId)
    .eq("organizer_id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/community/snacks");
  revalidatePath(`/community/snacks/${sessionId}`);
  return { success: true };
}
