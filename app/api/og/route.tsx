import { ImageResponse } from '@vercel/og';
import { db } from '@/lib/db';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const slug = searchParams.get('slug');

  if (!slug) return new Response('Missing slug', { status: 400 });

  const article = await db.getArticleBySlug(slug);
  if (!article) return new Response('Not found', { status: 404 });

  const scoreColor =
    article.concern_score >= 90 ? '#ff3333' :
    article.concern_score >= 70 ? '#ff8800' :
    '#ffffff';

  return new ImageResponse(
    (
      <div
        style={{
          width: '1200px',
          height: '630px',
          background: '#000000',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '60px',
          fontFamily: 'sans-serif',
          border: '2px solid #333',
        }}
      >
        {/* Top: site brand + category */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ color: '#ffffff', fontSize: '28px', letterSpacing: '0.05em' }}>
            doomscrolling.ai
          </span>
          <span style={{
            color: '#000',
            background: '#ffffff',
            fontSize: '14px',
            padding: '4px 12px',
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
          }}>
            {article.category}
          </span>
        </div>

        {/* Middle: headline */}
        <div style={{
          color: '#ffffff',
          fontSize: article.title.length > 80 ? '36px' : '46px',
          lineHeight: '1.2',
          fontWeight: 'bold',
          maxWidth: '900px',
        }}>
          {article.title}
        </div>

        {/* Bottom: score + source */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <span style={{ color: '#888', fontSize: '20px' }}>
            {article.source_name}
          </span>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
            <span style={{ color: scoreColor, fontSize: '72px', fontWeight: 'bold', lineHeight: '1' }}>
              {article.concern_score}
            </span>
            <span style={{ color: '#555', fontSize: '14px', letterSpacing: '0.2em' }}>
              CONCERN SCORE
            </span>
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
