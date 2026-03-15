import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { ArticlePermalink } from '@/components/ArticlePermalink';
import type { Metadata } from 'next';

interface Props {
  params: Promise<{ slug: string }>;
}

export const revalidate = 600;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const article = await db.getArticleBySlug(slug);
  if (!article) return {};

  const ogImageUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/api/og?slug=${slug}`;

  return {
    title: `${article.title} — doomscrolling.ai`,
    description: article.ai_summary,
    openGraph: {
      title: article.title,
      description: article.ai_summary,
      url: `${process.env.NEXT_PUBLIC_BASE_URL}/story/${slug}`,
      siteName: 'doomscrolling.ai',
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: article.title,
        },
      ],
      type: 'article',
      publishedTime: article.published_at,
    },
    twitter: {
      card: 'summary_large_image',
      title: article.title,
      description: article.ai_summary,
      images: [ogImageUrl],
    },
  };
}

export default async function StoryPage({ params }: Props) {
  const { slug } = await params;
  const article = await db.getArticleBySlug(slug);
  if (!article) notFound();

  // DO NOT redirect to article.url here — social crawlers (Twitterbot,
  // facebookexternalhit, etc.) must land on this page to pick up og:image
  // and og:title metadata. Redirecting would result in blank or broken
  // share preview cards. The "Read original" link in ArticlePermalink
  // handles sending the human user to the source.

  // Increment permalink_view_count (fire-and-forget, non-blocking)
  db.incrementPermalinkViews(article.id).catch(() => {});

  return <ArticlePermalink article={article} />;
}
