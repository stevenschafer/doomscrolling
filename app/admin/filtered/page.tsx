import { db } from '@/lib/db';
import { redirect } from 'next/navigation';

export default async function FilteredPage({
  searchParams,
}: {
  searchParams: Promise<{ secret?: string; page?: string }>;
}) {
  const params = await searchParams;

  if (params.secret !== process.env.ADMIN_SECRET) {
    redirect('/');
  }

  const page = parseInt(params.page ?? '1', 10);
  const { articles, total } = await db.getFilteredArticles({ page });

  return (
    <div className="min-h-screen bg-bg text-fg p-8">
      <h1 className="text-xl font-bold mb-4">Filtered Articles ({total} total)</h1>
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="border-b border-border text-left">
            <th className="py-2 pr-4">Title</th>
            <th className="py-2 pr-4">Source</th>
            <th className="py-2 pr-4">Date</th>
            <th className="py-2 pr-4">Reason</th>
            <th className="py-2 pr-4">Score</th>
            <th className="py-2">Link</th>
          </tr>
        </thead>
        <tbody>
          {articles.map((a) => (
            <tr key={a.id} className="border-b border-border">
              <td className="py-2 pr-4 max-w-[300px] truncate">{a.title}</td>
              <td className="py-2 pr-4 text-muted">{a.source_name}</td>
              <td className="py-2 pr-4 text-muted whitespace-nowrap">
                {a.published_at ? new Date(a.published_at).toLocaleDateString() : '—'}
              </td>
              <td className="py-2 pr-4 text-muted max-w-[300px]">{a.filter_reason}</td>
              <td className="py-2 pr-4 font-mono">{a.raw_score ?? '—'}</td>
              <td className="py-2">
                <a
                  href={a.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline text-muted hover:text-fg"
                >
                  View
                </a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Simple pagination */}
      <div className="flex gap-4 mt-6 text-sm">
        {page > 1 && (
          <a
            href={`/admin/filtered?secret=${params.secret}&page=${page - 1}`}
            className="underline"
          >
            Previous
          </a>
        )}
        {articles.length === 50 && (
          <a
            href={`/admin/filtered?secret=${params.secret}&page=${page + 1}`}
            className="underline"
          >
            Next
          </a>
        )}
      </div>
    </div>
  );
}
