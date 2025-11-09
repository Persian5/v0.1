/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
  },
  experimental: {
    webpackBuildWorker: true,
    parallelServerBuildTraces: true,
    parallelServerCompiles: true,
  },
  
  // Security Headers (OWASP + Next.js Best Practices)
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          // TEMPORARILY DISABLED: CSP was blocking Supabase connections
          // TODO: Re-enable with proper configuration once issue is resolved
          // {
          //   key: 'Content-Security-Policy',
          //   value: [
          //     "default-src 'self'",
          //     "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://va.vercel-scripts.com https://js.stripe.com",
          //     "style-src 'self' 'unsafe-inline'",
          //     "img-src 'self' data: https: blob:",
          //     "font-src 'self' data:",
          //     "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.stripe.com https://va.vercel-scripts.com",
          //     "frame-src https://js.stripe.com",
          //     "object-src 'none'",
          //     "base-uri 'self'",
          //     "form-action 'self'",
          //     "frame-ancestors 'none'",
          //     "upgrade-insecure-requests",
          //   ].join('; '),
          // },
        ],
      },
    ]
  },
}

export default nextConfig
