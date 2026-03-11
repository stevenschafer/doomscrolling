'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function LoginForm() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const searchParams = useSearchParams();
  const isPostCheckout = searchParams.get('checkout') === 'success';

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    setError('');

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (authError) {
      setError(authError.message);
    } else {
      setSent(true);
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-bg text-fg">
      <header className="border-b border-border sticky top-0 z-50 bg-card-bg">
        <div className="max-w-[1200px] mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-lg font-bold tracking-tight">
            <a href="/" className="no-underline hover:no-underline">💀 doomscrolling.ai</a>
          </h1>
        </div>
      </header>

      <div className="max-w-[420px] mx-auto px-4 py-20">
        {isPostCheckout && (
          <div className="border border-border rounded-lg p-4 mb-8 bg-card-bg text-center">
            <p className="text-sm font-bold mb-1">Payment received.</p>
            <p className="text-sm text-muted">Sign in with the email you used to checkout to access premium.</p>
          </div>
        )}

        <h2 className="text-2xl font-bold tracking-tight mb-2">Sign in</h2>
        <p className="text-sm text-muted mb-8">We&rsquo;ll send you a magic link. No password needed.</p>

        {sent ? (
          <div className="border border-border rounded-lg p-6 bg-card-bg text-center">
            <p className="text-2xl mb-3">✉️</p>
            <p className="font-bold mb-1">Check your email</p>
            <p className="text-sm text-muted">We sent a sign-in link to <strong>{email}</strong></p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className="w-full px-4 py-3 text-base border border-border bg-transparent text-fg rounded-lg outline-none focus:border-fg placeholder:text-muted/60"
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full px-6 py-3 text-sm font-bold uppercase tracking-widest font-mono border border-fg bg-fg text-bg rounded-lg hover:bg-transparent hover:text-fg transition-colors disabled:opacity-50"
            >
              {loading ? 'Sending...' : 'Send Magic Link'}
            </button>
            {error && <p className="text-sm text-red-500 text-center">{error}</p>}
          </form>
        )}
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
