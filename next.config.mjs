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
          {
            key: 'Content-Security-Policy',
            value: [
              // Default: only load from same origin
              "default-src 'self'",
              
              // Scripts: Next.js needs unsafe-eval + unsafe-inline for hydration/Tailwind
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://va.vercel-scripts.com https://js.stripe.com https://m.stripe.com",
              
              // Styles: Tailwind needs unsafe-inline
              "style-src 'self' 'unsafe-inline'",
              
              // Images: Allow data URIs, HTTPS images, and blobs
              "img-src 'self' data: https: blob:",
              
              // Fonts: Allow data URIs
              "font-src 'self' data:",
              
              // Connections: Supabase (auth/realtime), Stripe API, Vercel Analytics
              "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.stripe.com https://m.stripe.com https://hooks.stripe.com https://va.vercel-scripts.com",
              
              // Frames: Stripe checkout embeds
              "frame-src 'self' https://js.stripe.com https://hooks.stripe.com",
              
              // Media: Audio files for lessons
              "media-src 'self' data: blob:",
              
              // Workers: Next.js service workers
              "worker-src 'self' blob:",
              
              // No objects/embeds
              "object-src 'none'",
              
              // Security extras
              "base-uri 'self'",
              "form-action 'self'",
              "frame-ancestors 'none'",
            ].join('; '),
          },
        ],
      },
    ]
  },
}

export default nextConfig
