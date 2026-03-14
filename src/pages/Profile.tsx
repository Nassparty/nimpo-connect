import { useEffect, useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AppShell } from '@/components/layout/AppShell';
import { PostCard, PostData } from '@/components/feed/PostCard';
import { PostCardSkeleton } from '@/components/feed/PostCardSkeleton';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Settings, ChevronLeft, Camera } from 'lucide-react';

interface Profile {
  id: string;
  username: string;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  follower_count: number;
  following_count: number;
  post_count: number;
}

export default function ProfilePage() {
  const { id: paramId } = useParams<{ id?: string }>();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [posts, setPosts] = useState<PostData[]>([]);
  const [loading, setLoading] = useState(true);
  const [postsLoading, setPostsLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [bio, setBio] = useState('');
  const [fullName, setFullName] = useState('');
  const [saving, setSaving] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const profileId = paramId || user?.id;
  const isOwn = !paramId || paramId === user?.id;

  useEffect(() => {
    if (!profileId) { setLoading(false); return; }
    fetchProfile();
    fetchPosts();
    if (!isOwn && user) checkFollowing();
  }, [profileId, user]);

  const fetchProfile = async () => {
    const { data } = await (supabase as any)
      .from('profiles')
      .select('*')
      .eq('id', profileId)
      .single();
    setProfile(data);
    setBio(data?.bio || '');
    setFullName(data?.full_name || '');
    setLoading(false);
  };

  const fetchPosts = async () => {
    setPostsLoading(true);
    const { data } = await (supabase as any)
      .from('posts')
      .select(`*, profiles:user_id (id, username, full_name, avatar_url)`)
      .eq('user_id', profileId)
      .order('created_at', { ascending: false });
    setPosts(data || []);
    setPostsLoading(false);
  };

  const checkFollowing = async () => {
    if (!user || !profileId) return;
    const { data } = await (supabase as any)
      .from('follows')
      .select('id')
      .eq('follower_id', user.id)
      .eq('following_id', profileId)
      .maybeSingle();
    setIsFollowing(!!data);
  };

  const toggleFollow = async () => {
    if (!user) { navigate('/auth'); return; }
    if (isFollowing) {
      await (supabase as any).from('follows').delete()
        .eq('follower_id', user.id).eq('following_id', profileId);
      setIsFollowing(false);
      setProfile(p => p ? { ...p, follower_count: Math.max(0, p.follower_count - 1) } : p);
    } else {
      await (supabase as any).from('follows').insert({ follower_id: user.id, following_id: profileId });
      setIsFollowing(true);
      setProfile(p => p ? { ...p, follower_count: p.follower_count + 1 } : p);
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    setSaving(true);
    await (supabase as any).from('profiles').update({ bio, full_name: fullName }).eq('id', user.id);
    setProfile(p => p ? { ...p, bio, full_name: fullName } : p);
    setEditMode(false);
    setSaving(false);
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    const path = `${user.id}/avatar.${file.name.split('.').pop()}`;
    await (supabase as any).storage.from('avatars').upload(path, file, { upsert: true });
    const { data } = (supabase as any).storage.from('avatars').getPublicUrl(path);
    await (supabase as any).from('profiles').update({ avatar_url: `${data.publicUrl}?t=${Date.now()}` }).eq('id', user.id);
    fetchProfile();
  };

  const avatarInitials = (name: string) =>
    name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  if (!profileId) {
    return (
      <AppShell header={<div className="h-12 flex items-center px-4"><span className="text-base font-bold text-nimpo-ink">Profile</span></div>}>
        <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
          <p className="font-semibold text-nimpo-ink">Sign in to see your profile</p>
          <button onClick={() => navigate('/auth')} className="text-sm text-nimpo-brand mt-2">Sign in →</button>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell
      header={
        <div className="flex items-center justify-between h-12 px-4">
          {paramId && (
            <button onClick={() => navigate(-1)} className="p-1 -ml-1 text-nimpo-ink-2">
              <ChevronLeft size={22} />
            </button>
          )}
          <span className="text-base font-bold tracking-tight text-nimpo-ink">
            {loading ? '' : (profile?.username || 'Profile')}
          </span>
          {isOwn && (
            <button onClick={() => setEditMode(e => !e)} className="p-1 -mr-1 text-nimpo-ink-2">
              <Settings size={20} />
            </button>
          )}
          {!isOwn && <div className="w-8" />}
        </div>
      }
    >
      {loading ? (
        <div className="p-4 space-y-4 animate-pulse">
          <div className="flex items-start gap-4">
            <div className="w-20 h-20 rounded-full bg-nimpo-surface-3" />
            <div className="flex-1 space-y-2 pt-2">
              <div className="h-4 w-32 bg-nimpo-surface-3 rounded" />
              <div className="h-3 w-24 bg-nimpo-surface-3 rounded" />
            </div>
          </div>
        </div>
      ) : profile ? (
        <>
          {/* Profile Header */}
          <div className="px-4 pt-5 pb-4 bg-nimpo-surface border-b border-nimpo-separator">
            <div className="flex items-start gap-4 mb-4">
              {/* Avatar */}
              <div className="relative flex-shrink-0">
                <div className="w-20 h-20 rounded-full bg-nimpo-brand-light flex items-center justify-center overflow-hidden ring-2 ring-nimpo-separator">
                  {profile.avatar_url
                    ? <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                    : <span className="text-xl font-bold text-nimpo-brand">
                        {avatarInitials(profile.full_name || profile.username)}
                      </span>
                  }
                </div>
                {isOwn && (
                  <>
                    <button
                      onClick={() => avatarInputRef.current?.click()}
                      className="absolute bottom-0 right-0 w-7 h-7 bg-nimpo-brand rounded-full flex items-center justify-center ring-2 ring-nimpo-surface"
                    >
                      <Camera size={13} className="text-primary-foreground" />
                    </button>
                    <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                  </>
                )}
              </div>

              {/* Stats */}
              <div className="flex-1">
                <div className="flex gap-6 mt-1">
                  <div className="text-center">
                    <p className="text-base font-bold text-nimpo-ink tabular">{posts.length}</p>
                    <p className="text-[11px] text-nimpo-ink-3">Posts</p>
                  </div>
                  <div className="text-center">
                    <p className="text-base font-bold text-nimpo-ink tabular">{profile.follower_count.toLocaleString()}</p>
                    <p className="text-[11px] text-nimpo-ink-3">Followers</p>
                  </div>
                  <div className="text-center">
                    <p className="text-base font-bold text-nimpo-ink tabular">{profile.following_count.toLocaleString()}</p>
                    <p className="text-[11px] text-nimpo-ink-3">Following</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Name & bio */}
            {editMode ? (
              <div className="space-y-2">
                <input
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  placeholder="Display name"
                  className="nimpo-input text-sm"
                />
                <textarea
                  value={bio}
                  onChange={e => setBio(e.target.value)}
                  placeholder="Bio…"
                  rows={2}
                  maxLength={150}
                  className="nimpo-input text-sm resize-none"
                />
                <div className="flex gap-2">
                  <motion.button
                    whileTap={{ scale: 0.96 }}
                    onClick={handleSaveProfile}
                    disabled={saving}
                    className="flex-1 py-2 bg-nimpo-brand text-primary-foreground rounded-full text-sm font-semibold"
                  >
                    {saving ? 'Saving…' : 'Save'}
                  </motion.button>
                  <button
                    onClick={() => setEditMode(false)}
                    className="flex-1 py-2 bg-nimpo-surface-3 text-nimpo-ink-2 rounded-full text-sm font-medium"
                  >
                    Cancel
                  </button>
                </div>
                <button
                  onClick={() => { signOut(); navigate('/auth'); }}
                  className="w-full py-2 text-nimpo-red text-sm font-medium"
                >
                  Sign out
                </button>
              </div>
            ) : (
              <>
                <p className="font-semibold text-nimpo-ink">{profile.full_name || profile.username}</p>
                <p className="text-[13px] text-nimpo-ink-3">@{profile.username}</p>
                {profile.bio && <p className="text-[14px] text-nimpo-ink mt-2 leading-snug">{profile.bio}</p>}

                {!isOwn && (
                  <div className="flex gap-2 mt-3">
                    <motion.button
                      whileTap={{ scale: 0.96 }}
                      onClick={toggleFollow}
                      className={`flex-1 py-2 rounded-full text-sm font-semibold transition-colors ${
                        isFollowing
                          ? 'bg-nimpo-surface-3 text-nimpo-ink border border-nimpo-separator'
                          : 'bg-nimpo-brand text-primary-foreground'
                      }`}
                    >
                      {isFollowing ? 'Following' : 'Follow'}
                    </motion.button>
                    <motion.button
                      whileTap={{ scale: 0.96 }}
                      onClick={() => navigate(`/messages/${profile.id}`)}
                      className="flex-1 py-2 rounded-full text-sm font-semibold bg-nimpo-surface-3 text-nimpo-ink border border-nimpo-separator"
                    >
                      Message
                    </motion.button>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Posts */}
          <div>
            {postsLoading
              ? Array.from({ length: 3 }).map((_, i) => <PostCardSkeleton key={i} index={i} />)
              : posts.length > 0
                ? posts.map((post, i) => <PostCard key={post.id} post={post} index={i} />)
                : (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <p className="text-nimpo-ink-3 text-sm">No posts yet</p>
                  </div>
                )
            }
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="text-nimpo-ink-3 text-sm">Profile not found</p>
        </div>
      )}
    </AppShell>
  );
}
