import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AppShell } from '@/components/layout/AppShell';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Heart, MessageSquare, UserPlus, AtSign, Bell } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Notification {
  id: string;
  type: 'like' | 'comment' | 'follow' | 'mention';
  read: boolean;
  created_at: string;
  post_id: string | null;
  actor: {
    id: string;
    username: string;
    full_name: string | null;
    avatar_url: string | null;
  };
}

const typeConfig = {
  like: { icon: Heart, color: 'text-nimpo-red', bg: 'bg-red-50', label: 'liked your post' },
  comment: { icon: MessageSquare, color: 'text-nimpo-brand', bg: 'bg-blue-50', label: 'commented on your post' },
  follow: { icon: UserPlus, color: 'text-nimpo-green', bg: 'bg-green-50', label: 'started following you' },
  mention: { icon: AtSign, color: 'text-nimpo-ink-2', bg: 'bg-nimpo-surface-3', label: 'mentioned you' },
};

export default function NotificationsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    fetchNotifications();
  }, [user]);

  const fetchNotifications = async () => {
    const { data } = await (supabase as any)
      .from('notifications')
      .select(`
        *,
        actor:actor_id (id, username, full_name, avatar_url)
      `)
      .eq('user_id', user!.id)
      .order('created_at', { ascending: false })
      .limit(50);

    setNotifications(data || []);
    setLoading(false);

    // Mark all as read
    if (data?.some((n: Notification) => !n.read)) {
      await (supabase as any)
        .from('notifications')
        .update({ read: true })
        .eq('user_id', user!.id)
        .eq('read', false);
    }
  };

  const avatarInitials = (name: string) =>
    name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <AppShell
      header={
        <div className="flex items-center h-12 px-4">
          <span className="text-base font-bold tracking-tight text-nimpo-ink">Activity</span>
        </div>
      }
    >
      {!user ? (
        <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
          <Bell size={32} className="text-nimpo-ink-3 mb-3" />
          <p className="font-semibold text-nimpo-ink">Sign in to see activity</p>
          <button onClick={() => navigate('/auth')} className="text-sm text-nimpo-brand mt-2">Go to login →</button>
        </div>
      ) : loading ? (
        Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 px-4 py-3.5 border-b border-nimpo-separator">
            <div className="w-10 h-10 rounded-full bg-nimpo-surface-3 animate-pulse flex-shrink-0" />
            <div className="flex-1 space-y-1.5">
              <div className="h-3 w-48 bg-nimpo-surface-3 rounded animate-pulse" />
              <div className="h-2.5 w-24 bg-nimpo-surface-3 rounded animate-pulse" />
            </div>
          </div>
        ))
      ) : notifications.length > 0 ? (
        <div>
          {notifications.map((notif, i) => {
            const cfg = typeConfig[notif.type];
            const Icon = cfg.icon;
            return (
              <motion.div
                key={notif.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: i * 0.04 }}
                className={`flex items-center gap-3 px-4 py-3.5 border-b border-nimpo-separator transition-colors ${
                  !notif.read ? 'bg-nimpo-brand-light/30' : 'bg-nimpo-surface'
                }`}
              >
                {/* Avatar */}
                <div className="relative flex-shrink-0">
                  <div className="w-11 h-11 rounded-full bg-nimpo-brand-light flex items-center justify-center overflow-hidden">
                    {notif.actor.avatar_url
                      ? <img src={notif.actor.avatar_url} alt="" className="w-full h-full object-cover" />
                      : <span className="text-xs font-semibold text-nimpo-brand">
                          {avatarInitials(notif.actor.full_name || notif.actor.username)}
                        </span>
                    }
                  </div>
                  <div className={`absolute -bottom-0.5 -right-0.5 w-5 h-5 ${cfg.bg} rounded-full flex items-center justify-center ring-2 ring-nimpo-surface`}>
                    <Icon size={10} className={cfg.color} />
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-[13.5px] text-nimpo-ink leading-snug">
                    <span className="font-semibold">{notif.actor.full_name || notif.actor.username}</span>
                    {' '}{cfg.label}
                  </p>
                  <p className="text-[11px] text-nimpo-ink-3 mt-0.5">
                    {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true })}
                  </p>
                </div>

                {!notif.read && (
                  <div className="w-2 h-2 rounded-full bg-nimpo-brand flex-shrink-0" />
                )}
              </motion.div>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
          <Bell size={32} className="text-nimpo-ink-3 mb-3" />
          <p className="font-semibold text-nimpo-ink">No activity yet</p>
          <p className="text-sm text-nimpo-ink-3 mt-1">When people interact with your posts, you'll see it here.</p>
        </div>
      )}
    </AppShell>
  );
}
