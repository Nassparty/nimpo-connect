import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AppShell } from '@/components/layout/AppShell';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Image, Video, Mic, Type, X, ChevronLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

type PostType = 'text' | 'image' | 'video' | 'audio';

export default function CreatePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [postType, setPostType] = useState<PostType>('text');
  const [content, setContent] = useState('');
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const typeOptions = [
    { type: 'text' as PostType, icon: Type, label: 'Text' },
    { type: 'image' as PostType, icon: Image, label: 'Photo' },
    { type: 'video' as PostType, icon: Video, label: 'Video' },
    { type: 'audio' as PostType, icon: Mic, label: 'Audio' },
  ];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setMediaFile(file);
    const url = URL.createObjectURL(file);
    setMediaPreview(url);
  };

  const handleSubmit = async () => {
    if (!user) { navigate('/auth'); return; }
    if (!content.trim() && !mediaFile) { setError('Add some content first.'); return; }
    setError('');
    setLoading(true);

    try {
      let mediaUrl: string | null = null;

      if (mediaFile) {
        const ext = mediaFile.name.split('.').pop();
        const path = `${user.id}/${Date.now()}.${ext}`;
        const { error: uploadError } = await (supabase as any).storage
          .from('post-media')
          .upload(path, mediaFile);
        if (uploadError) throw uploadError;

        const { data: urlData } = (supabase as any).storage
          .from('post-media')
          .getPublicUrl(path);
        mediaUrl = urlData.publicUrl;
      }

      const { error: insertError } = await (supabase as any)
        .from('posts')
        .insert({
          user_id: user.id,
          type: postType,
          content: content.trim() || null,
          media_url: mediaUrl,
        });

      if (insertError) throw insertError;

      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Failed to post');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppShell
      header={
        <div className="flex items-center justify-between h-12 px-4">
          <button onClick={() => navigate(-1)} className="p-1 -ml-1 text-nimpo-ink-2">
            <ChevronLeft size={22} />
          </button>
          <span className="text-base font-semibold text-nimpo-ink">New Post</span>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleSubmit}
            disabled={loading || (!content.trim() && !mediaFile)}
            className="px-4 py-1.5 bg-nimpo-brand text-primary-foreground rounded-full text-sm font-semibold disabled:opacity-50"
          >
            {loading ? 'Posting…' : 'Post'}
          </motion.button>
        </div>
      }
    >
      <div className="p-4 space-y-4">
        {/* Type selector */}
        <div className="flex gap-2">
          {typeOptions.map(({ type, icon: Icon, label }) => (
            <motion.button
              key={type}
              whileTap={{ scale: 0.93 }}
              onClick={() => { setPostType(type); setMediaFile(null); setMediaPreview(null); }}
              className={cn(
                'flex-1 flex flex-col items-center gap-1 py-3 rounded-inner text-xs font-medium transition-colors',
                postType === type
                  ? 'bg-nimpo-brand-light text-nimpo-brand'
                  : 'bg-nimpo-surface-3 text-nimpo-ink-3'
              )}
            >
              <Icon size={18} />
              {label}
            </motion.button>
          ))}
        </div>

        {/* Text content */}
        <textarea
          placeholder={postType === 'text' ? "What's on your mind?" : "Add a caption... (optional)"}
          value={content}
          onChange={e => setContent(e.target.value)}
          maxLength={500}
          rows={4}
          className="w-full bg-transparent text-[15px] text-nimpo-ink placeholder:text-nimpo-ink-3 resize-none focus:outline-none leading-relaxed"
        />

        <div className="text-right text-xs text-nimpo-ink-3 tabular">{content.length}/500</div>

        {/* Media upload */}
        {postType !== 'text' && (
          <div>
            {mediaPreview ? (
              <div className="relative rounded-inner overflow-hidden">
                {postType === 'image' && (
                  <img src={mediaPreview} alt="Preview" className="w-full max-h-64 object-cover" />
                )}
                {postType === 'video' && (
                  <video src={mediaPreview} controls className="w-full aspect-video" />
                )}
                {postType === 'audio' && (
                  <div className="bg-nimpo-surface-3 rounded-inner p-4">
                    <audio controls src={mediaPreview} className="w-full" />
                  </div>
                )}
                <button
                  onClick={() => { setMediaFile(null); setMediaPreview(null); }}
                  className="absolute top-2 right-2 w-7 h-7 bg-black/60 text-white rounded-full flex items-center justify-center"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full h-40 border-2 border-dashed border-nimpo-separator rounded-inner flex flex-col items-center justify-center gap-2 text-nimpo-ink-3 hover:border-nimpo-brand hover:text-nimpo-brand transition-colors"
              >
                {postType === 'image' && <Image size={28} />}
                {postType === 'video' && <Video size={28} />}
                {postType === 'audio' && <Mic size={28} />}
                <span className="text-sm font-medium">
                  Tap to add {postType}
                </span>
              </button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept={
                postType === 'image' ? 'image/*' :
                postType === 'video' ? 'video/*' :
                'audio/*'
              }
              className="hidden"
              onChange={handleFileChange}
            />
          </div>
        )}

        {error && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-xs text-nimpo-red"
          >
            {error}
          </motion.p>
        )}
      </div>
    </AppShell>
  );
}
