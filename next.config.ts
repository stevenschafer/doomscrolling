import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "img-src 'self' https: data:",
              "script-src 'self' 'unsafe-inline' https://pagead2.googlesyndication.com",
              "style-src 'self' 'unsafe-inline'",
              `connect-src 'self' ${process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''} https://*.supabase.co`,
            ].join('; '),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
