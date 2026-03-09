import { db } from '@/lib/db';
import { redirect } from 'next/navigation';
import { FilteredTable } from './filtered-table';

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
      <FilteredTable articles={articles} />

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
