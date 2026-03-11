import { Feed } from '@/components/Feed';
import { AdSlot } from '@/components/AdSlot';
import { AuthButton } from '@/components/AuthButton';
import { getPremiumStatus } from '@/lib/premium';

export default async function Home() {
  const { isPremium } = await getPremiumStatus();

  return (
    <div className="min-h-screen bg-bg text-fg">
      {/* Header */}
      <header className="border-b border-border sticky top-0 z-50 bg-card-bg">
        <div className="max-w-[1200px] mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-lg font-bold tracking-tight"><a href="/" className="no-underline hover:no-underline">💀 doomscrolling.ai</a></h1>
          <AuthButton />
        </div>
      </header>

      {/* Main content */}
      <div className="max-w-[1200px] mx-auto px-4 py-8 flex gap-8">
        {/* Feed column */}
        <main className="w-full max-w-[680px] mx-auto xl:mx-0">
          <Feed isPremium={isPremium} />
        </main>

        {/* Ad rail (desktop only, hidden for premium) */}
        {!isPremium && (
          <aside className="hidden xl:block w-[300px] shrink-0">
            <div className="sticky top-8">
              <AdSlot slot="right-rail" />
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
