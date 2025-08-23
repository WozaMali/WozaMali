/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    SERVICE_TYPE: process.env.SERVICE_TYPE || 'collector',
  },
  async rewrites() { return []; },
  
  // Image optimization configuration
  images: {
    domains: [],
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  
  // Disable static generation completely
  trailingSlash: true,
  
  // Disable server-side features
  serverRuntimeConfig: {},
  publicRuntimeConfig: {},
  
  // Set workspace root to resolve lockfile warnings
  outputFileTracingRoot: __dirname,
  
  // Webpack configuration
  webpack: (config, { isServer }) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': require('path').resolve(__dirname, './src'),
    };
    
    // Handle image loading errors gracefully
    if (!isServer) {
      config.module.rules.push({
        test: /\.(png|jpe?g|gif|svg|webp)$/i,
        use: [
          {
            loader: 'url-loader',
            options: {
              limit: 8192,
              fallback: 'file-loader',
              publicPath: '/_next/static/images/',
              outputPath: 'static/images/',
            },
          },
        ],
      });
    }
    
    return config;
  },
}

module.exports = nextConfig
