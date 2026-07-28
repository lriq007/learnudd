'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/stores/authStore';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/Button';
import { Send } from 'lucide-react';
import { formatRelativeTime, getInitials } from '@/lib/utils';
import type { Message, Profile } from '@/types';

export default function ChatPage() {
  const params = useParams();
  const { user } = useAuthStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [otherUser, setOtherUser] = useState<Profile | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();
  const otherUserId = params.id as string;

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      // Get other user
      const { data: userData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', otherUserId)
        .single();

      setOtherUser(userData);

      // Get messages
      const { data: msgs } = await supabase
        .from('messages')
        .select('*')
        .or(
          `and(sender_id.eq.${user.id},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${user.id})`
        )
        .order('created_at', { ascending: true });

      setMessages(msgs || []);
      setLoading(false);

      // Mark messages as read
      await supabase
        .from('messages')
        .update({ read: true })
        .eq('sender_id', otherUserId)
        .eq('receiver_id', user.id)
        .eq('read', false);
    };

    fetchData();

    // Subscribe to new messages
    const channel = supabase
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
            setMessages((prev) => [...prev, newMsg]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, otherUserId, supabase]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!user || !newMessage.trim()) return;

    const { error } = await supabase.from('messages').insert({
      sender_id: user.id,
      receiver_id: otherUserId,
      content: newMessage.trim(),
    });

    if (!error) {
      setNewMessage('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="min-h-screen bg-udd-ivory flex flex-col">
      <Header
        title={otherUser?.full_name || 'Chat'}
        showBack
        rightAction={
          <div className="w-8 h-8 rounded-full bg-udd-deep/10 flex items-center justify-center">
            <span className="text-xs font-bold text-udd-deep">
              {getInitials(otherUser?.full_name || 'U')}
            </span>
          </div>
        }
      />

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className={`skeleton h-12 rounded-2xl ${i % 2 === 0 ? 'w-3/4 ml-auto' : 'w-3/4'}`} />
            ))}
          </div>
        ) : (
          <>
            {messages.map((msg) => {
              const isMine = msg.sender_id === user?.id;
              return (
                <div
                  key={msg.id}
                  className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] px-4 py-2.5 rounded-2xl ${
                      isMine
                        ? 'bg-udd-blue text-white rounded-br-md'
                        : 'bg-white text-udd-graphite rounded-bl-md shadow-sm'
                    }`}
                  >
                    <p className="text-sm">{msg.content}</p>
                    <p
                      className={`text-[10px] mt-1 ${
                        isMine ? 'text-white/60' : 'text-udd-gray'
                      }`}
                    >
                      {formatRelativeTime(msg.created_at)}
                    </p>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input */}
      <div className="sticky bottom-0 bg-white border-t border-border px-4 py-3 safe-bottom">
        <div className="flex items-center gap-2 max-w-[430px] mx-auto">
          <input
            type="text"
            placeholder="Escribe un mensaje..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 px-4 py-2.5 rounded-xl border border-border bg-udd-gray/5 text-sm focus:outline-none focus:ring-2 focus:ring-udd-blue/20 focus:border-udd-blue"
          />
          <Button
            onClick={handleSend}
            disabled={!newMessage.trim()}
            className="px-4"
          >
            <Send size={18} />
          </Button>
        </div>
      </div>
    </div>
  );
}
