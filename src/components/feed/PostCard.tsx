import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, MessageSquare, Share2, MoreHorizontal, Volume2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';

export interface PostData {
  id: string;
  type: 'text' | 'image' | 'video' | 'audio';
  content: string | null;
  media_url: string | null;
  like_count: number;
  comment_count: number;
  created_at: string;
  liked?: boolean;
  profiles: {
    id: string;
    username: string;
    full_name: string | null;
    avatar_url: string | null;
  };
}

interface PostCardProps {
  post: PostData;
  index?: number;
}

export function PostCard({ post, index = 0 }: PostCardProps) {
  const { user } = useAuth();
  const [liked, setLiked] = useState(post.liked ?? false);
  const [likeCount, setLikeCount] = useState(post.like_count);

  const handleLike = async () => {
    if (!user) return;
    const newLiked = !liked;
    setLiked(newLiked);
    setLikeCount(c => newLiked ? c + 1 : c - 1);

    if (newLiked) {
      await supabase.from('post_likes').insert({ post_id: post.id, user_id: user.id });
      await supabase.from('posts').update({ like_count: likeCount + 1 }).eq('id', post.id);
    } else {
      await supabase.from('post_likes').delete().eq('post_id', post.id).eq('user_id', user.id);
      await supabase.from('posts').update({ like_count: likeCount - 1 }).eq('id', post.id);
    }
  };

  const avatarInitials = (post.profiles.full_name || post.profiles.username || 'U')
    .split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05, ease: 'easeOut' }}
      className="bg-nimpo-surface border-b border-nimpo-separator"
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-4 pb-3">
        <div className="w-9 h-9 rounded-full bg-nimpo-brand-light flex items-center justify-center overflow-hidden flex-shrink-0 ring-1 ring-nimpo-separator">
          {post.profiles.avatar_url ? (
            <img src={post.profiles.avatar_url} alt={post.profiles.username} className="w-full h-full object-cover" />
          ) : (
            <span className="text-xs font-semibold text-nimpo-brand">{avatarInitials}</span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-nimpo-ink tracking-tight truncate">
            {post.profiles.full_name || post.profiles.username}
          </p>
          <p className="text-[11px] text-nimpo-ink-3">
            @{post.profiles.username} · {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
          </p>
        </div>
        <button className="text-nimpo-ink-3 p-1 -mr-1">
          <MoreHorizontal size={18} />
        </button>
      </div>

      {/* Content */}
      <div className="px-4 pb-3 space-y-3">
        {post.content && (
          <p className="text-[15px] leading-relaxed text-nimpo-ink" style={{ textWrap: 'pretty' } as React.CSSProperties}>
            {post.content}
          </p>
        )}

        {post.type === 'image' && post.media_url && (
          <div className="rounded-inner overflow-hidden bg-nimpo-surface-3 ring-1 ring-black/5">
            <img
              src={post.media_url}
              alt="Post media"
              className="w-full h-auto object-cover max-h-[400px]"
              loading="lazy"
            />
          </div>
        )}

        {post.type === 'video' && post.media_url && (
          <div className="rounded-inner overflow-hidden bg-black ring-1 ring-black/5">
            <video
              src={post.media_url}
              controls
              playsInline
              className="w-full aspect-video object-cover"
            />
          </div>
        )}

        {post.type === 'audio' && post.media_url && (
          <div className="flex items-center gap-3 bg-nimpo-surface-3 rounded-inner px-4 py-3 ring-1 ring-nimpo-separator">
            <div className="w-10 h-10 rounded-full bg-nimpo-brand flex items-center justify-center flex-shrink-0">
              <Volume2 size={16} className="text-primary-foreground" />
            </div>
            <audio controls className="flex-1 h-8" style={{ accentColor: 'hsl(var(--nimpo-brand))' }}>
              <source src={post.media_url} />
            </audio>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-5 px-4 pb-4 text-nimpo-ink-3">
        <motion.button
          whileTap={{ scale: 0.88 }}
          transition={{ duration: 0.1 }}
          onClick={handleLike}
          className={cn(
            'flex items-center gap-1.5 transition-colors',
            liked ? 'text-nimpo-red' : 'hover:text-nimpo-red'
          )}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={liked ? 'liked' : 'unlike'}
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.8 }}
              transition={{ duration: 0.1 }}
            >
              <Heart size={19} fill={liked ? 'currentColor' : 'none'} />
            </motion.div>
          </AnimatePresence>
          <span className="text-xs font-medium tabular">{likeCount.toLocaleString()}</span>
        </motion.button>

        <motion.button
          whileTap={{ scale: 0.88 }}
          transition={{ duration: 0.1 }}
          className="flex items-center gap-1.5 hover:text-nimpo-brand transition-colors"
        >
          <MessageSquare size={19} />
          <span className="text-xs font-medium tabular">{post.comment_count.toLocaleString()}</span>
        </motion.button>

        <motion.button
          whileTap={{ scale: 0.88 }}
          transition={{ duration: 0.1 }}
          className="ml-auto hover:text-nimpo-ink transition-colors"
        >
          <Share2 size={19} />
        </motion.button>
      </div>
    </motion.article>
  );
}
