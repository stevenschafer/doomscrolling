'use client';

import { useState, useEffect } from 'react';

interface Props {
  slug: string;
  title: string;
}

export function ShareButton({ slug, title }: Props) {
  const [copied, setCopied] = useState(false);
  const [origin, setOrigin] = useState('');

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  async function handleShare(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const url = `${origin}/story/${slug}`;

    if (navigator.share) {
      try {
        await navigator.share({ title, url });
      } catch {
        // User cancelled share
      }
      return;
    }

    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      className="text-xs text-muted font-mono border border-border rounded px-2 py-1 hover:bg-fg hover:text-bg transition-colors cursor-pointer ml-auto"
      onClick={handleShare}
    >
      {copied ? 'Copied' : 'Share'}
    </button>
  );
}
