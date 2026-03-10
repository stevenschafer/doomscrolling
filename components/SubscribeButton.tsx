import Link from 'next/link';

export function SubscribeButton() {
  return (
    <Link
      href="/premium"
      className="text-xs font-bold tracking-[1.2px] uppercase font-mono px-3 py-1 border rounded border-fg text-fg hover:bg-fg hover:text-bg transition-colors no-underline hover:no-underline"
    >
      Premium
    </Link>
  );
}
