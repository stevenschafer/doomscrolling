import { redirect, notFound } from 'next/navigation';
import { getPremiumStatus } from '@/lib/premium';
import { getSupabaseAdmin } from '@/lib/db';
import { AuthButton } from '@/components/AuthButton';

export const metadata = {
  title: 'Synthesis Report — doomscrolling.ai',
};

export default async function ReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const status = await getPremiumStatus();
  if (!status.isLoggedIn) redirect('/login');
  if (!status.isPremium) redirect('/premium');

  const { data: report } = await getSupabaseAdmin()
    .from('synthesis_reports')
    .select('*')
    .eq('id', id)
    .single();

  if (!report) notFound();

  return (
    <div className="min-h-screen bg-bg text-fg">
      <header className="border-b border-border sticky top-0 z-50 bg-card-bg">
        <div className="max-w-[1200px] mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-lg font-bold tracking-tight">
            <a href="/" className="no-underline hover:no-underline">💀 doomscrolling.ai</a>
          </h1>
          <AuthButton />
        </div>
      </header>

      <div className="max-w-[720px] mx-auto px-4 py-10">
        <a href="/account" className="text-xs font-bold uppercase tracking-widest font-mono text-muted hover:text-fg mb-6 block">
          ← Back to Account
        </a>
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-2">{report.title}</h2>
        <p className="text-sm text-muted mb-8">
          Week of {new Date(report.week_start).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
        </p>
        <div className="prose prose-sm max-w-none text-fg [&_h1]:text-xl [&_h1]:font-bold [&_h1]:mt-8 [&_h1]:mb-3 [&_h2]:text-lg [&_h2]:font-bold [&_h2]:mt-6 [&_h2]:mb-2 [&_h3]:text-base [&_h3]:font-bold [&_h3]:mt-4 [&_h3]:mb-2 [&_p]:text-sm [&_p]:leading-relaxed [&_p]:mb-4 [&_p]:text-muted [&_ul]:text-sm [&_ul]:text-muted [&_li]:mb-1 [&_strong]:text-fg">
          {report.content.split('\n').map((line: string, i: number) => {
            if (line.startsWith('### ')) return <h3 key={i}>{line.slice(4)}</h3>;
            if (line.startsWith('## ')) return <h2 key={i}>{line.slice(3)}</h2>;
            if (line.startsWith('# ')) return <h1 key={i}>{line.slice(2)}</h1>;
            if (line.startsWith('- ')) return <li key={i}>{line.slice(2)}</li>;
            if (line.trim() === '') return <br key={i} />;
            return <p key={i}>{line}</p>;
          })}
        </div>
      </div>
    </div>
  );
}
