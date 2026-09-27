import { Injectable, inject } from '@angular/core';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { SupabaseService } from './supabase.service';
import type { Conversation, Message } from '../models';

// CAP-5: queries/mutations ported from src/app/(protected)/messages/page.tsx
// (listConversations: fetchConversations líneas 36-74) and
// src/app/(protected)/messages/[id]/page.tsx (listForConversation: fetchData
// líneas 38-44; markRead: fetchData líneas 49-55; send: handleSend líneas
// 89-101; subscribeToConversation/unsubscribe: líneas 60-83). Same null-client
// fail-soft convention as NotesService/TutorsService/BookingsService for the
// 4 query/mutation methods.
//
// subscribeToConversation()/unsubscribe() widen the Code Map's literal
// `RealtimeChannel` signature to `RealtimeChannel | null` — a documented
// decision (Implementation Notes), not silent: a `null` Supabase client can't
// open a channel, and every other method on this service already resolves a
// null client to a safe fallback instead of throwing toward the caller.
@Injectable({ providedIn: 'root' })
export class MessagesService {
  private readonly supabaseService = inject(SupabaseService);

  // CAP-5: ported from messages/page.tsx's fetchConversations (líneas 36-74).
  // Per Boundaries: "conversación" is derived client-side by grouping
  // `messages` per counterpart (sender_id/receiver_id) — no `conversations`
  // table exists. Per Never: `unread` stays a boolean flag (only whether the
  // *last* message seen from that counterpart is unread), not a real unread
  // count — same gap the MVP has (documented in deferred-work.md, not fixed
  // here).
  async listConversations(userId: string): Promise<Conversation[]> {
    const client = this.supabaseService.client;
    if (!client) return [];

    const { data } = await client
      .from('messages')
      .select(
        `
        *,
        sender:profiles!messages_sender_id_fkey(id, full_name, avatar_url),
        receiver:profiles!messages_receiver_id_fkey(id, full_name, avatar_url)
      `,
      )
      .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
      .order('created_at', { ascending: false });

    const messages = (data as Message[] | null) ?? [];

    // Group by conversation partner — the Map keeps only the FIRST message
    // seen per counterpart, which is the most recent one thanks to the
    // `created_at desc` order above (paridad 1:1 con el MVP).
    const conversationMap = new Map<string, Conversation>();

    messages.forEach((msg) => {
      const isSender = msg.sender_id === userId;
      const otherUserProfile = isSender ? msg.receiver : msg.sender;
      const otherUserId = isSender ? msg.receiver_id : msg.sender_id;

      if (!conversationMap.has(otherUserId)) {
        conversationMap.set(otherUserId, {
          otherUser: {
            id: otherUserId,
            full_name: otherUserProfile?.full_name ?? null,
            avatar_url: otherUserProfile?.avatar_url ?? null,
          },
          lastMessage: msg.content,
          lastMessageTime: msg.created_at,
          unread: !isSender && !msg.read,
        });
      }
    });

    return Array.from(conversationMap.values());
  }

  // CAP-5: ported from messages/[id]/page.tsx's fetchData (líneas 38-44).
  async listForConversation(userId: string, otherUserId: string): Promise<Message[]> {
    const client = this.supabaseService.client;
    if (!client) return [];

    const { data } = await client
      .from('messages')
      .select('*')
      .or(`and(sender_id.eq.${userId},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${userId})`)
      .order('created_at', { ascending: true });

    return (data as Message[] | null) ?? [];
  }

  // CAP-5: ported from messages/[id]/page.tsx's fetchData (líneas 49-55).
  // Fire-and-forget, same as the MVP: no return value, no error surfaced.
  async markRead(userId: string, otherUserId: string): Promise<void> {
    const client = this.supabaseService.client;
    if (!client) return;

    await client.from('messages').update({ read: true }).eq('sender_id', otherUserId).eq('receiver_id', userId).eq('read', false);
  }

  // CAP-5: ported from messages/[id]/page.tsx's handleSend (líneas 89-101).
  // Per Never: no optimistic insert into local state — the caller only
  // clears its input on success, same as the MVP; the message itself only
  // ever appears via the Realtime INSERT event.
  async send(senderId: string, receiverId: string, content: string): Promise<{ error: string | null }> {
    const client = this.supabaseService.client;
    if (!client) return { error: 'Error al enviar el mensaje' };

    const { error } = await client.from('messages').insert({
      sender_id: senderId,
      receiver_id: receiverId,
      content,
    });

    if (error) return { error: 'Error al enviar el mensaje' };
    return { error: null };
  }

  // CAP-5: ported from messages/[id]/page.tsx's Realtime subscription (líneas
  // 60-83). Per Never: the `filter` string and the client-side re-check
  // inside the callback are the SAME broken filter as the MVP — neither one
  // is scoped to the current user, only to `otherUserId` — kept as-is,
  // documented in deferred-work.md, not fixed.
  subscribeToConversation(otherUserId: string, onInsert: (message: Message) => void): RealtimeChannel | null {
    const client = this.supabaseService.client;
    if (!client) return null;

    return client
      .channel('messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `or(sender_id.eq.${otherUserId},receiver_id.eq.${otherUserId})`,
        },
        (payload) => {
          const newMsg = payload.new as Message;
          if (newMsg.sender_id === otherUserId || newMsg.receiver_id === otherUserId) {
            onInsert(newMsg);
          }
        },
      )
      .subscribe();
  }

  unsubscribe(channel: RealtimeChannel | null): void {
    if (!channel) return;
    this.supabaseService.client?.removeChannel(channel);
  }
}
