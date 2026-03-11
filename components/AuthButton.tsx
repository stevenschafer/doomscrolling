import Link from 'next/link';
import { getPremiumStatus } from '@/lib/premium';

const btnPrimary = "btn-invert text-xs font-bold tracking-[1.2px] uppercase font-mono px-3 py-1 border rounded border-fg text-fg transition-colors no-underline hover:no-underline";
const btnSecondary = "btn-invert text-xs font-bold tracking-[1.2px] uppercase font-mono px-3 py-1 border rounded border-border text-muted transition-colors no-underline hover:no-underline";

export async function AuthButton() {
  const { isLoggedIn, isPremium } = await getPremiumStatus();

  if (isLoggedIn && isPremium) {
    return (
      <div className="flex items-center gap-3">
        <span className="text-xs font-bold tracking-[1.2px] uppercase font-mono px-2 py-0.5 border border-fg bg-fg text-bg rounded">
          PRO
        </span>
        <Link href="/account" className={btnPrimary}>
          Account
        </Link>
      </div>
    );
  }

  if (isLoggedIn) {
    return (
      <div className="flex items-center gap-3">
        <Link href="/premium" className={btnPrimary}>
          Premium
        </Link>
        <Link href="/account" className={btnSecondary}>
          Account
        </Link>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <Link href="/premium" className={btnPrimary}>
        Premium
      </Link>
      <Link href="/login" className={btnSecondary}>
        Sign In
      </Link>
    </div>
  );
}
