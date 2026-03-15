import { createHash } from 'crypto';

/**
 * Converts an article title + date into a URL-safe slug.
 * Example: "OpenAI Whistleblower Faces Retaliation" + "2025-03-13"
 *          -> "openai-whistleblower-faces-retaliation-2503"
 */
export function generateSlug(title: string, publishedAt: string): string {
  const date = new Date(publishedAt);
  const dateSuffix = `${String(date.getFullYear()).slice(2)}${String(date.getMonth() + 1).padStart(2, '0')}`;

  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .split('-')
    .slice(0, 8)
    .join('-');

  return `${base}-${dateSuffix}`;
}

/**
 * If a slug collision occurs (same slug already in DB), append a short
 * hash of the URL to disambiguate.
 */
export function generateSlugWithFallback(title: string, publishedAt: string, url: string): string {
  const base = generateSlug(title, publishedAt);
  const hash = createHash('sha256').update(url).digest('hex').slice(0, 6);
  return `${base}-${hash}`;
}
