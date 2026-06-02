"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import type { DirectMessage, MessageThreadPartner, Profile } from "@/types";

export type MessageFormState = { error?: string; success?: string } | null;

export async function getMessageableUsers(): Promise<Profile[]> {
  const { user } = await requireAuth();
  const supabase = await createClient();

  const { data } = await supabase
    .from("profiles")
    .select("id, name, role, created_at")
    .neq("id", user.id)
    .order("name", { ascending: true });

  return (data ?? []) as Profile[];
}

export async function getRecentConversations(): Promise<MessageThreadPartner[]> {
  const { user } = await requireAuth();
  const supabase = await createClient();

  const { data: messages } = await supabase
    .from("direct_messages")
    .select("sender_id, receiver_id, content, created_at")
    .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
    .order("created_at", { ascending: false })
    .limit(200);

  if (!messages?.length) return [];

  const latestByPartner = new Map<
    string,
    { content: string; created_at: string }
  >();

  for (const msg of messages) {
    const otherId =
      msg.sender_id === user.id ? msg.receiver_id : msg.sender_id;
    if (!latestByPartner.has(otherId)) {
      latestByPartner.set(otherId, {
        content: msg.content,
        created_at: msg.created_at,
      });
    }
  }

  const partnerIds = Array.from(latestByPartner.keys());
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, name, role")
    .in("id", partnerIds);

  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));

  return partnerIds.map((id) => {
    const profile = profileMap.get(id);
    const latest = latestByPartner.get(id)!;
    return {
      user_id: id,
      name: profile?.name ?? "User",
      role: (profile?.role ?? "employee") as Profile["role"],
      last_message: latest.content,
      last_message_at: latest.created_at,
    };
  });
}

export async function getDirectMessages(otherUserId: string): Promise<{
  messages: DirectMessage[];
  otherUser: Profile | null;
}> {
  const { user } = await requireAuth();
  const supabase = await createClient();

  const { data: otherUser } = await supabase
    .from("profiles")
    .select("id, name, role, created_at")
    .eq("id", otherUserId)
    .maybeSingle();

  if (!otherUser || otherUserId === user.id) {
    return { messages: [], otherUser: null };
  }

  const { data } = await supabase
    .from("direct_messages")
    .select("id, sender_id, receiver_id, content, created_at")
    .or(
      `and(sender_id.eq.${user.id},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${user.id})`
    )
    .order("created_at", { ascending: true })
    .limit(200);

  return {
    messages: (data ?? []) as DirectMessage[],
    otherUser: otherUser as Profile,
  };
}

export async function sendDirectMessageAction(
  otherUserId: string,
  _prev: MessageFormState,
  formData: FormData
): Promise<MessageFormState> {
  const { user } = await requireAuth();
  const content = String(formData.get("content") ?? "").trim();

  if (!content) return { error: "Message cannot be empty." };
  if (otherUserId === user.id) return { error: "You cannot message yourself." };

  const supabase = await createClient();
  const { data: otherUser } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", otherUserId)
    .maybeSingle();

  if (!otherUser) return { error: "User not found." };

  const { error } = await supabase.from("direct_messages").insert({
    sender_id: user.id,
    receiver_id: otherUserId,
    content,
  });

  if (error) return { error: error.message };

  revalidatePath(`/community/messages/${otherUserId}`);
  revalidatePath("/community/messages");
  return { success: "Sent." };
}
