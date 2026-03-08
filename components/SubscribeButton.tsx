'use client';

import { useState } from 'react';

export function SubscribeButton() {
  const [email, setEmail] = useState('');
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubscribe(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      console.error('Subscribe error:', err);
    } finally {
      setLoading(false);
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="text-xs font-bold tracking-widest uppercase px-3 py-1 border border-fg text-fg hover:bg-fg hover:text-bg transition-colors"
      >
        Subscribe
      </button>
    );
  }

  return (
    <form onSubmit={handleSubscribe} className="flex items-center gap-2">
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="email@example.com"
        required
        className="text-xs px-3 py-1 border border-border bg-transparent text-fg outline-none focus:border-fg"
      />
      <button
        type="submit"
        disabled={loading}
        className="text-xs font-bold tracking-widest uppercase px-3 py-1 border border-fg text-fg hover:bg-fg hover:text-bg transition-colors disabled:opacity-50"
      >
        {loading ? '...' : 'Go'}
      </button>
    </form>
  );
}
