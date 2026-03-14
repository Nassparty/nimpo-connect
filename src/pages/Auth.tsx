import { useState } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

export default function AuthPage() {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (mode === 'signup') {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { username, full_name: username },
            emailRedirectTo: window.location.origin,
          },
        });
        if (signUpError) throw signUpError;
        if (data.user) {
          // Create profile
          await supabase.from('profiles').upsert({
            id: data.user.id,
            username: username || email.split('@')[0],
            full_name: username,
          });
          setSuccess('Account created! Check your email to confirm, or start exploring.');
          setTimeout(() => navigate('/'), 1500);
        }
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) throw signInError;
        navigate('/');
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-dvh bg-nimpo-surface flex flex-col items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="w-full max-w-sm"
      >
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="inline-flex w-14 h-14 rounded-outer bg-nimpo-brand items-center justify-center mb-4">
            <span className="text-2xl font-bold text-primary-foreground tracking-tighter">N</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-nimpo-ink">NimPo</h1>
          <p className="text-sm text-nimpo-ink-3 mt-1">
            {mode === 'login' ? 'Welcome back.' : 'Create your account.'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          {mode === 'signup' && (
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={e => setUsername(e.target.value)}
              required
              className="nimpo-input"
            />
          )}
          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            className="nimpo-input"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            minLength={6}
            className="nimpo-input"
          />

          {error && (
            <motion.p
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-xs text-nimpo-red px-1"
            >
              {error}
            </motion.p>
          )}
          {success && (
            <motion.p
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-xs text-nimpo-green px-1"
            >
              {success}
            </motion.p>
          )}

          <motion.button
            whileTap={{ scale: 0.97 }}
            transition={{ duration: 0.1 }}
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-full bg-nimpo-brand text-primary-foreground font-semibold text-sm disabled:opacity-60 transition-opacity"
          >
            {loading ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}
          </motion.button>
        </form>

        <p className="text-center text-sm text-nimpo-ink-3 mt-6">
          {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
          <button
            onClick={() => { setMode(m => m === 'login' ? 'signup' : 'login'); setError(''); }}
            className="text-nimpo-brand font-medium"
          >
            {mode === 'login' ? 'Sign up' : 'Sign in'}
          </button>
        </p>
      </motion.div>
    </div>
  );
}
