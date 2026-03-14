import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AppShell } from '@/components/layout/AppShell';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { MessageCircle, Search } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Conversation {
  profile: {
    id: string;
    username: string;
    full_name: string | null;
    avatar_url: string | null;
  };
  lastMessage: string;
  lastTime: string;
  unread: number;
}

export default function MessagesPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [allProfiles, setAllProfiles] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    fetchConversations();
    fetchAllProfiles();
  }, [user]);

  const fetchConversations = async () => {
    if (!user) return;
    const { data } = await (supabase as any)
      .from('messages')
      .select(`
        *,
        sender:sender_id (id, username, full_name, avatar_url),
        receiver:receiver_id (id, username, full_name, avatar_url)
      `)
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .order('created_at', { ascending: false });

    if (!data) { setLoading(false); return; }

    // Deduplicate into conversations
    const convMap = new Map<string, Conversation>();
    for (const msg of data) {
      const otherId = msg.sender_id === user.id ? msg.receiver_id : msg.sender_id;
      const otherProfile = msg.sender_id === user.id ? msg.receiver : msg.sender;
      if (!convMap.has(otherId)) {
        convMap.set(otherId, {
          profile: otherProfile,
          lastMessage: msg.text,
          lastTime: msg.created_at,
          unread: msg.receiver_id === user.id && !msg.read ? 1 : 0,
        });
      } else {
        const conv = convMap.get(otherId)!;
        if (msg.receiver_id === user.id && !msg.read) conv.unread++;
      }
    }
    setConversations(Array.from(convMap.values()));
    setLoading(false);
  };

  const fetchAllProfiles = async () => {
    if (!user) return;
    const { data } = await (supabase as any)
      .from('profiles')
      .select('id, username, full_name, avatar_url')
      .neq('id', user.id)
      .limit(20);
    setAllProfiles(data || []);
  };

  const filteredProfiles = search
    ? allProfiles.filter(p =>
        p.username.toLowerCase().includes(search.toLowerCase()) ||
        (p.full_name || '').toLowerCase().includes(search.toLowerCase())
      )
    : [];

  const avatarInitials = (name: string) =>
    name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <AppShell
      header={
        <div className="flex items-center h-12 px-4">
          <span className="text-base font-bold tracking-tight text-nimpo-ink">Messages</span>
        </div>
      }
    >
      {/* Search */}
      <div className="px-4 py-3 sticky top-0 z-10 bg-nimpo-surface-2">
        <div className="relative">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-nimpo-ink-3" />
          <input
            type="text"
            placeholder="Search people…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="nimpo-input pl-9 text-[14px]"
          />
        </div>
      </div>

      {/* Search results */}
      {search && filteredProfiles.length > 0 && (
        <div className="border-b border-nimpo-separator">
          {filteredProfiles.map(p => (
            <motion.button
              key={p.id}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate(`/messages/${p.id}`)}
              className="flex items-center gap-3 px-4 py-3 w-full hover:bg-nimpo-surface-3 transition-colors"
            >
              <div className="w-10 h-10 rounded-full bg-nimpo-brand-light flex items-center justify-center overflow-hidden flex-shrink-0">
                {p.avatar_url
                  ? <img src={p.avatar_url} alt={p.username} className="w-full h-full object-cover" />
                  : <span className="text-xs font-semibold text-nimpo-brand">{avatarInitials(p.full_name || p.username)}</span>
                }
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold text-nimpo-ink">{p.full_name || p.username}</p>
                <p className="text-xs text-nimpo-ink-3">@{p.username}</p>
              </div>
            </motion.button>
          ))}
        </div>
      )}

      {/* Conversations list */}
      {!user ? (
        <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
          <MessageCircle size={32} className="text-nimpo-ink-3 mb-3" />
          <p className="font-semibold text-nimpo-ink">Sign in to message</p>
          <button onClick={() => navigate('/auth')} className="text-sm text-nimpo-brand mt-2">Go to login →</button>
        </div>
      ) : loading ? (
        Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 px-4 py-3 border-b border-nimpo-separator">
            <div className="w-12 h-12 rounded-full bg-nimpo-surface-3 animate-pulse flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-28 bg-nimpo-surface-3 rounded animate-pulse" />
              <div className="h-2.5 w-44 bg-nimpo-surface-3 rounded animate-pulse" />
            </div>
          </div>
        ))
      ) : conversations.length > 0 ? (
        conversations.map(conv => (
          <motion.button
            key={conv.profile.id}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate(`/messages/${conv.profile.id}`)}
            className="flex items-center gap-3 px-4 py-3.5 w-full hover:bg-nimpo-surface-3 transition-colors border-b border-nimpo-separator"
          >
            <div className="relative flex-shrink-0">
              <div className="w-12 h-12 rounded-full bg-nimpo-brand-light flex items-center justify-center overflow-hidden">
                {conv.profile.avatar_url
                  ? <img src={conv.profile.avatar_url} alt="" className="w-full h-full object-cover" />
                  : <span className="text-sm font-semibold text-nimpo-brand">
                      {avatarInitials(conv.profile.full_name || conv.profile.username)}
                    </span>
                }
              </div>
              {conv.unread > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-nimpo-brand rounded-full text-[10px] font-bold text-primary-foreground flex items-center justify-center tabular">
                  {conv.unread}
                </span>
              )}
            </div>
            <div className="flex-1 min-w-0 text-left">
              <div className="flex items-baseline justify-between gap-2">
                <p className="text-sm font-semibold text-nimpo-ink truncate">
                  {conv.profile.full_name || conv.profile.username}
                </p>
                <p className="text-[11px] text-nimpo-ink-3 flex-shrink-0">
                  {formatDistanceToNow(new Date(conv.lastTime), { addSuffix: false })}
                </p>
              </div>
              <p className={`text-[13px] truncate mt-0.5 ${conv.unread > 0 ? 'font-medium text-nimpo-ink' : 'text-nimpo-ink-3'}`}>
                {conv.lastMessage}
              </p>
            </div>
          </motion.button>
        ))
      ) : (
        <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
          <MessageCircle size={32} className="text-nimpo-ink-3 mb-3" />
          <p className="font-semibold text-nimpo-ink">No messages yet</p>
          <p className="text-sm text-nimpo-ink-3 mt-1">Search for people to start a conversation.</p>
        </div>
      )}
    </AppShell>
  );
}
