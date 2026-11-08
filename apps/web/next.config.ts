import type { NextConfig } from 'next';

const config: NextConfig = {
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
  transpilePackages: ['framer-motion'],
  // La imagen al compartir cada ficha lee las letras y las fotos (PNG) del disco
  outputFileTracingIncludes: {
    '/producto/[slug]/opengraph-image': ['./assets/fonts/*.ttf', './public/logo.png', './public/img/opt/**/*.og.png'],
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      { protocol: 'http',  hostname: 'localhost' },
    ],
    unoptimized: true,
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'}/api/:path*`,
      },
    ];
  },
};

export default config;
