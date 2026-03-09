import { Feed } from '@/components/Feed';
import { AdSlot } from '@/components/AdSlot';
import { SubscribeButton } from '@/components/SubscribeButton';

export default function Home() {
  return (
    <div className="min-h-screen bg-bg text-fg">
      {/* Header */}
      <header className="border-b border-border sticky top-0 z-50 bg-bg">
        <div className="max-w-[1200px] mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-lg font-bold tracking-tight">doomscrolling.ai</h1>
          <SubscribeButton />
        </div>
      </header>

      {/* Main content */}
      <div className="max-w-[1200px] mx-auto px-4 py-8 flex gap-8">
        {/* Feed column */}
        <main className="w-full max-w-[680px] mx-auto xl:mx-0">
          <Feed />
        </main>

        {/* Ad rail (desktop only) */}
        <aside className="hidden xl:block w-[300px] shrink-0">
          <div className="sticky top-8">
            <AdSlot slot="right-rail" />
          </div>
        </aside>
      </div>
    </div>
  );
}
