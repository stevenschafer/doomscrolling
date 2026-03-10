'use client';

import { useState } from 'react';

export function PremiumCheckout({ context }: { context: 'hero' | 'pricing' }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setError('Something went wrong. Try again.');
      }
    } catch {
      setError('Something went wrong. Try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row items-center gap-3 w-full max-w-[480px] mx-auto">
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@example.com"
        required
        className="w-full sm:flex-1 px-4 py-3 text-base border border-border bg-transparent text-fg rounded-lg outline-none focus:border-fg placeholder:text-muted/60"
      />
      <button
        type="submit"
        disabled={loading}
        className="w-full sm:w-auto px-6 py-3 text-sm font-bold uppercase tracking-widest font-mono border border-fg bg-fg text-bg rounded-lg hover:bg-transparent hover:text-fg transition-colors disabled:opacity-50 whitespace-nowrap"
      >
        {loading ? 'Loading...' : context === 'hero' ? 'Get Premium — $5/mo' : 'Get Premium →'}
      </button>
      {error && <p className="text-sm text-red-500 w-full text-center">{error}</p>}
    </form>
  );
}
