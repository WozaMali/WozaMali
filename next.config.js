/** @type {import('next').NextConfig} */
const isProd = process.env.NODE_ENV === 'production';
const nextConfig = {
  // Dynamic server mode (not static export)
  // output: 'export', // Commented out to enable dynamic server
  trailingSlash: true,
  skipTrailingSlashRedirect: true,
  // Use relative asset paths for Capacitor WebView in production/export
  assetPrefix: isProd ? './' : undefined,
  basePath: '',
  
  // Image optimization
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
      },
    ],
    unoptimized: true, // Disable image optimization for faster dev builds
  },
  
  // TypeScript and ESLint configuration - disabled for faster builds
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // Typed routes configuration (moved from experimental)
  typedRoutes: false,
  
  // Allow cross-origin requests in development
  allowedDevOrigins: ['192.168.18.239', '192.168.18.220', '192.168.1.0/24', '10.0.0.0/8', '172.16.0.0/12'],
  
  // Turbopack configuration (moved from experimental.turbo)
  turbopack: {
    rules: {
      '*.svg': {
        loaders: ['@svgr/webpack'],
        as: '*.js',
      },
    },
  },
  
  // External packages for server components
  serverExternalPackages: [],
  
  // Webpack configuration for faster development and static export
  webpack: (config, { isServer, dev }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        stream: false,
        util: false,
        url: false,
        assert: false,
        http: false,
        https: false,
        os: false,
        buffer: false,
      };
    }
    
    // Keep Next.js default optimization in development; only adjust if truly needed in prod
    if (!dev) {
      // Leave defaults; static export is handled elsewhere
    }
    
    if (dev) {
      config.watchOptions = {
        poll: false,
        aggregateTimeout: 200,
      };
    }
    
    return config;
  },
  
  // Environment variable handling
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
  
  // Headers for security, CORS, and PWA - simplified for Vercel compatibility
  async headers() {
    return [
      {
        source: '/sw.js',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, must-revalidate',
          },
          {
            key: 'Service-Worker-Allowed',
            value: '/',
          },
        ],
      },
      {
        source: '/manifest.json',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/icons/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, DELETE, OPTIONS',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization',
          },
        ],
      },
    ];
  },
  
  // Redirects
  async redirects() {
    return [];
  },
}

module.exports = nextConfig
