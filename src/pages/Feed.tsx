import { useEffect, useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { PostCard, PostData } from '@/components/feed/PostCard';
import { PostCardSkeleton } from '@/components/feed/PostCardSkeleton';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Zap } from 'lucide-react';

export default function FeedPage() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<PostData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPosts();
  }, [user]);

  const fetchPosts = async () => {
    setLoading(true);
    const { data, error } = await (supabase as any)
      .from('posts')
      .select(`
        *,
        profiles:user_id (
          id,
          username,
          full_name,
          avatar_url
        )
      `)
      .order('created_at', { ascending: false })
      .limit(30);

    if (error) { console.error(error); setLoading(false); return; }

    // Check which posts the current user has liked
    let likedPostIds: Set<string> = new Set();
    if (user && data?.length) {
      const { data: likes } = await (supabase as any)
        .from('post_likes')
        .select('post_id')
        .eq('user_id', user.id)
        .in('post_id', data.map((p: any) => p.id));
      if (likes) likedPostIds = new Set(likes.map((l: any) => l.post_id));
    }

    setPosts((data || []).map((p: any) => ({ ...p, liked: likedPostIds.has(p.id) })));
    setLoading(false);
  };

  return (
    <AppShell
      header={
        <div className="flex items-center justify-between h-12 px-4">
          <div className="flex items-center gap-1.5">
            <div className="w-7 h-7 rounded-lg bg-nimpo-brand flex items-center justify-center">
              <span className="text-xs font-bold text-primary-foreground">N</span>
            </div>
            <span className="text-base font-bold tracking-tight text-nimpo-ink">NimPo</span>
          </div>
          <Zap size={20} className="text-nimpo-brand" />
        </div>
      }
    >
      {/* Feed tabs */}
      <div className="flex border-b border-nimpo-separator bg-nimpo-surface sticky top-0 z-10">
        <button className="flex-1 py-3 text-sm font-semibold text-nimpo-brand border-b-2 border-nimpo-brand">
          For You
        </button>
        <button className="flex-1 py-3 text-sm font-medium text-nimpo-ink-3">
          Following
        </button>
      </div>

      <div className="divide-y divide-nimpo-separator">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => <PostCardSkeleton key={i} index={i} />)
          : posts.map((post, i) => <PostCard key={post.id} post={post} index={i} />)
        }
      </div>

      {!loading && posts.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
          <div className="w-12 h-12 rounded-full bg-nimpo-surface-3 flex items-center justify-center mb-3">
            <Zap size={20} className="text-nimpo-ink-3" />
          </div>
          <p className="font-semibold text-nimpo-ink">Nothing here yet</p>
          <p className="text-sm text-nimpo-ink-3 mt-1">Follow people to see their posts.</p>
        </div>
      )}
    </AppShell>
  );
}
