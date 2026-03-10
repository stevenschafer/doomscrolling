import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'doomscrolling.ai — Concerning Developments in AI',
  description:
    'An editorially-filtered news feed covering concerning developments in artificial intelligence.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <script
          async
          src="https://www.googletagmanager.com/gtag/js?id=G-6E4Y71BFFJ"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-6E4Y71BFFJ');
            `,
          }}
        />
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9558848318749949"
          crossOrigin="anonymous"
        />
        <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>💀</text></svg>" />
      </head>
      <body>{children}</body>
    </html>
  );
}
