import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 🖼️ Image optimization configuration
  images: {
    remotePatterns: [
      { hostname: "*.supabase.co" },
      { hostname: "images.unsplash.com" },
      { hostname: "m.media-amazon.com" },
      { hostname: "loremflickr.com" },
    ],
    formats: ['image/webp', 'image/avif'], // Modern formats for better compression
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },

  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  },

  // 🚀 Performance optimizations
  experimental: {
    // Enable optimistic client cache for faster navigation
    optimisticClientCache: true,
    // Optimize package imports - reduces bundle size
    optimizePackageImports: ['lucide-react', 'sonner', '@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],
  },

  // 📦 Webpack optimizations for code splitting
  webpack: (config, { isServer }) => {
    // Split chunks intelligently
    if (!isServer) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            // Vendor chunks
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name(module: any) {
                // Get the package name
                const packageName = module.context.match(
                  /[\\/]node_modules[\\/](.*?)([\\/]|$)/
                )?.[1];
                return `vendor.${packageName?.replace('@', '')}`;
              },
              priority: 10,
            },
            // Common chunks
            common: {
              minChunks: 2,
              priority: 5,
              reuseExistingChunk: true,
            },
          },
        },
      };
    }
    return config;
  },

  // 🗜️ Compression
  compress: true,

  // 🎯 Production optimizations


  // 📊 Reduce build output
  productionBrowserSourceMaps: false,
};

export default nextConfig;
