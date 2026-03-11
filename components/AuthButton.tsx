import Link from 'next/link';
import { getPremiumStatus } from '@/lib/premium';

export async function AuthButton() {
  const { isLoggedIn, isPremium } = await getPremiumStatus();

  if (isLoggedIn && isPremium) {
    return (
      <div className="flex items-center gap-3">
        <span className="text-xs font-bold tracking-[1.2px] uppercase font-mono px-2 py-0.5 border border-fg bg-fg text-bg rounded">
          PRO
        </span>
        <Link
          href="/account"
          className="text-xs font-bold tracking-[1.2px] uppercase font-mono px-3 py-1 border rounded border-fg text-fg hover:bg-fg hover:text-bg transition-colors no-underline hover:no-underline"
        >
          Account
        </Link>
      </div>
    );
  }

  if (isLoggedIn) {
    return (
      <div className="flex items-center gap-3">
        <Link
          href="/premium"
          className="text-xs font-bold tracking-[1.2px] uppercase font-mono px-3 py-1 border rounded border-fg text-fg hover:bg-fg hover:text-bg transition-colors no-underline hover:no-underline"
        >
          Premium
        </Link>
        <Link
          href="/account"
          className="text-xs font-bold tracking-[1.2px] uppercase font-mono px-3 py-1 border rounded border-border text-muted hover:text-fg hover:border-fg transition-colors no-underline hover:no-underline"
        >
          Account
        </Link>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <Link
        href="/premium"
        className="text-xs font-bold tracking-[1.2px] uppercase font-mono px-3 py-1 border rounded border-fg text-fg hover:bg-fg hover:text-bg transition-colors no-underline hover:no-underline"
      >
        Premium
      </Link>
      <Link
        href="/login"
        className="text-xs font-bold tracking-[1.2px] uppercase font-mono px-3 py-1 border rounded border-border text-muted hover:text-fg hover:border-fg transition-colors no-underline hover:no-underline"
      >
        Sign In
      </Link>
    </div>
  );
}
