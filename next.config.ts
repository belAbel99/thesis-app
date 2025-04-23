import { withSentryConfig } from "@sentry/nextjs";
import type { NextConfig } from "next";

const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  experimental: {
    runtime: 'nodejs' // Uncomment if needed
  }
}

module.exports = nextConfig as NextConfig;

const sentryWebpackPluginOptions = {
  // Sentry configuration
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

// Export the final configuration
export default withSentryConfig(nextConfig, sentryWebpackPluginOptions);