import { useEffect, useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AppShell } from '@/components/layout/AppShell';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { ChevronLeft, Send } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Message {
  id: string;
  sender_id: string;
  text: string;
  created_at: string;
}

interface Profile {
  id: string;
  username: string;
  full_name: string | null;
  avatar_url: string | null;
}

export default function ChatPage() {
  const { id: receiverId } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [profile, setProfile] = useState<Profile | null>(null);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!receiverId) return;
    fetchProfile();
    fetchMessages();

    // Realtime subscription
    const channel = (supabase as any)
      .channel(`messages-${receiverId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `receiver_id=eq.${user?.id}`
      }, (payload: any) => {
        if (payload.new.sender_id === receiverId) {
          setMessages(prev => [...prev, payload.new]);
        }
      })
      .subscribe();

    return () => { (supabase as any).removeChannel(channel); };
  }, [receiverId, user]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchProfile = async () => {
    const { data } = await (supabase as any)
      .from('profiles')
      .select('id, username, full_name, avatar_url')
      .eq('id', receiverId)
      .single();
    setProfile(data);
  };

  const fetchMessages = async () => {
    if (!user || !receiverId) return;
    const { data } = await (supabase as any)
      .from('messages')
      .select('*')
      .or(
        `and(sender_id.eq.${user.id},receiver_id.eq.${receiverId}),and(sender_id.eq.${receiverId},receiver_id.eq.${user.id})`
      )
      .order('created_at', { ascending: true });
    setMessages(data || []);

    // Mark as read
    await (supabase as any)
      .from('messages')
      .update({ read: true })
      .eq('sender_id', receiverId)
      .eq('receiver_id', user.id)
      .eq('read', false);
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !user || !receiverId) return;
    setSending(true);

    const optimistic: Message = {
      id: `temp-${Date.now()}`,
      sender_id: user.id,
      text: input.trim(),
      created_at: new Date().toISOString(),
    };
    setMessages(prev => [...prev, optimistic]);
    setInput('');

    const { data } = await (supabase as any)
      .from('messages')
      .insert({ text: optimistic.text, receiver_id: receiverId, sender_id: user.id })
      .select()
      .single();

    if (data) {
      setMessages(prev => prev.map(m => m.id === optimistic.id ? data : m));
    }
    setSending(false);
  };

  const avatarInitials = (name: string) =>
    name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div className="flex flex-col h-dvh bg-nimpo-surface max-w-[480px] mx-auto">
      {/* Header */}
      <header className="flex items-center gap-3 px-4 h-14 bg-nimpo-surface/90 backdrop-blur-md border-b border-nimpo-separator sticky top-0 z-40 flex-shrink-0">
        <button onClick={() => navigate('/messages')} className="text-nimpo-ink-2 p-1 -ml-1">
          <ChevronLeft size={22} />
        </button>
        {profile && (
          <>
            <div className="w-8 h-8 rounded-full bg-nimpo-brand-light flex items-center justify-center overflow-hidden">
              {profile.avatar_url
                ? <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                : <span className="text-xs font-semibold text-nimpo-brand">
                    {avatarInitials(profile.full_name || profile.username)}
                  </span>
              }
            </div>
            <div>
              <p className="text-sm font-semibold text-nimpo-ink leading-tight">
                {profile.full_name || profile.username}
              </p>
              <p className="text-[11px] text-nimpo-ink-3">@{profile.username}</p>
            </div>
          </>
        )}
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2 no-scrollbar">
        {messages.map((msg, i) => {
          const isOwn = msg.sender_id === user?.id;
          return (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: i < 10 ? 0 : 0 }}
              className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`
                max-w-[78%] px-4 py-2.5 rounded-outer text-[15px] leading-snug
                ${isOwn
                  ? 'bg-nimpo-brand text-primary-foreground rounded-br-sm'
                  : 'bg-nimpo-surface-3 text-nimpo-ink rounded-bl-sm shadow-sm'
                }
              `}>
                <p>{msg.text}</p>
                <p className={`text-[10px] mt-1 ${isOwn ? 'text-primary-foreground/60' : 'text-nimpo-ink-3'}`}>
                  {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
                </p>
              </div>
            </motion.div>
          );
        })}
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center py-20">
            <p className="text-nimpo-ink-3 text-sm">Start a conversation with {profile?.full_name || profile?.username}</p>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={sendMessage}
        className="flex items-center gap-2 px-4 py-3 bg-nimpo-surface border-t border-nimpo-separator pb-safe flex-shrink-0"
      >
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Message…"
          className="nimpo-input flex-1 py-2.5"
          disabled={!user}
        />
        <motion.button
          whileTap={{ scale: 0.88 }}
          transition={{ duration: 0.1 }}
          type="submit"
          disabled={!input.trim() || sending}
          className="w-10 h-10 bg-nimpo-brand rounded-full flex items-center justify-center flex-shrink-0 disabled:opacity-40"
        >
          <Send size={16} className="text-primary-foreground translate-x-0.5" />
        </motion.button>
      </form>
    </div>
  );
}
