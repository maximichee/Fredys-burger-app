import type { MetadataRoute } from 'next';
import { productos as getProducts } from '@/lib/server/menu';
import { SITE_URL } from '@/lib/sitio';

export const revalidate = 3600;

/** Inicio, páginas fijas y una ficha por producto disponible (si la API no responde, van solo las fijas). */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const fijas: MetadataRoute.Sitemap = [
    { url: SITE_URL, changeFrequency: 'daily', priority: 1 },
    { url: `${SITE_URL}/nosotros`, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${SITE_URL}/contacto`, changeFrequency: 'monthly', priority: 0.6 },
  ];
  try {
    const productos = await getProducts();
    return [...fijas, ...productos.filter((p) => p.available).map((p) => ({
      url: `${SITE_URL}/producto/${p.slug}`,
      lastModified: p.updatedAt ? new Date(p.updatedAt) : undefined,
      changeFrequency: 'weekly' as const,
      priority: p.featured ? 0.8 : 0.7,
    }))];
  } catch {
    return fijas;
  }
}
