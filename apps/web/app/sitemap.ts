import type { MetadataRoute } from 'next';

const BASE = 'https://fredysburger.com.ar';

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: BASE,              lastModified: new Date(), changeFrequency: 'daily',   priority: 1 },
    { url: `${BASE}/nosotros`,lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE}/contacto`,lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
  ];
}
