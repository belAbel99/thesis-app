import { withSentryConfig } from "@sentry/nextjs";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true, // Add if you're having TypeScript errors during build
  },
  output: "standalone", // Recommended for production deployments
};

module.exports = {
  experimental: {
    disableOptimizedLoading: true
  }
}

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