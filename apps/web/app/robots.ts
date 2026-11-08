import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/sitio';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/', disallow: ['/admin', '/checkout', '/carrito'] },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
