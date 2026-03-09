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
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9558848318749949"
          crossOrigin="anonymous"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
