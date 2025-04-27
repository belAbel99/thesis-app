import { withSentryConfig } from "@sentry/nextjs";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  experimental: {
    runtime: 'nodejs' // Uncomment if needed
  },
  // Add these new configurations
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()'
          },
          {
            key: 'Cross-Origin-Embedder-Policy',
            value: 'require-corp'
          },
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(self)'
          },
          {
            key: 'Cross-Origin-Embedder-Policy',
            value: 'require-corp'
          }
        ]
      }
    ]
  },
  images: {
    domains: [
      'localhost', 
      process.env.NEXT_PUBLIC_ENDPOINT?.replace(/https?:\/\//, '') || ''
    ].filter(Boolean),
  },
  // Security headers
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.NEXT_PUBLIC_ENDPOINT}/api/:path*`
      }
    ]
  }
}

const sentryWebpackPluginOptions = {
  org: "none-ywb",
  project: "javascript-nextjs",
  silent: !process.env.CI,
  widenClientFileUpload: true,
  reactComponentAnnotation: {
    enabled: true,
  },
  disableLogger: true,
  automaticVercelMonitors: true,
};

export default withSentryConfig(nextConfig, sentryWebpackPluginOptions);