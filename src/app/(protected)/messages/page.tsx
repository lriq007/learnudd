'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/stores/authStore';
import { Header } from '@/components/layout/Header';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/shared/EmptyState';
import { MessageCircle } from 'lucide-react';
import { formatRelativeTime, getInitials } from '@/lib/utils';

interface Conversation {
  id: string;
  otherUser: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
  };
  lastMessage: string;
  lastMessageTime: string;
  unread: number;
}

export default function MessagesPage() {
  const { user } = useAuthStore();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    if (!user) return;

    const fetchConversations = async () => {
      // Get all messages involving the user
      const { data: messages } = await supabase
        .from('messages')
        .select(`
          *,
          sender:profiles!messages_sender_id_fkey(id, full_name, avatar_url),
          receiver:profiles!messages_receiver_id_fkey(id, full_name, avatar_url)
        `)
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (!messages) {
        setLoading(false);
        return;
      }

      // Group by conversation partner
      const conversationMap = new Map<string, Conversation>();

      messages.forEach((msg) => {
        const isSender = msg.sender_id === user.id;
        const otherUser = isSender ? msg.receiver : msg.sender;
        const otherUserId = isSender ? msg.receiver_id : msg.sender_id;

        if (!conversationMap.has(otherUserId)) {
          conversationMap.set(otherUserId, {
            id: otherUserId,
            otherUser: {
              id: otherUserId,
              full_name: otherUser?.full_name || null,
              avatar_url: otherUser?.avatar_url || null,
            },
            lastMessage: msg.content,
            lastMessageTime: msg.created_at,
            unread: !isSender && !msg.read ? 1 : 0,
          });
        }
      });

      setConversations(Array.from(conversationMap.values()));
      setLoading(false);
    };

    fetchConversations();
  }, [user, supabase]);

  return (
    <div className="min-h-screen bg-udd-ivory">
      <Header title="Mensajes" />

      <div className="px-4 py-4">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="skeleton h-20 rounded-2xl" />
            ))}
          </div>
        ) : conversations.length > 0 ? (
          <div className="space-y-2">
            {conversations.map((conv) => (
              <Link key={conv.id} href={`/messages/${conv.id}`}>
                <Card className="flex items-center gap-3 hover:shadow-md transition-shadow mb-2">
                  <div className="w-12 h-12 rounded-full bg-udd-deep/10 flex items-center justify-center shrink-0">
                    <span className="text-sm font-bold text-udd-deep">
                      {getInitials(conv.otherUser.full_name || 'U')}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-udd-graphite">
                        {conv.otherUser.full_name || 'Usuario'}
                      </h3>
                      <span className="text-xs text-udd-gray">
                        {formatRelativeTime(conv.lastMessageTime)}
                      </span>
                    </div>
                    <p className="text-xs text-udd-gray truncate mt-0.5">
                      {conv.lastMessage}
                    </p>
                  </div>
                  {conv.unread > 0 && (
                    <div className="w-5 h-5 bg-udd-blue rounded-full flex items-center justify-center">
                      <span className="text-[10px] text-white font-bold">{conv.unread}</span>
                    </div>
                  )}
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<MessageCircle size={32} className="text-udd-gray" />}
            title="No tienes mensajes"
            description="Los mensajes aparecerán aquí cuando coordines con tutores o compradores"
          />
        )}
      </div>
    </div>
  );
}
