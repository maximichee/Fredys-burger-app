import type { Metadata } from 'next';
import { cache } from 'react';
import { producto as getProduct } from '@/lib/server/menu';
import { SITE_URL } from '@/lib/sitio';
import { formatPrice, imgSrc } from '@/lib/utils';

/* La ficha es una página del navegador; este layout le da, del lado del servidor, su título,
   su descripción y los datos de producto para Google. La imagen al compartir está en opengraph-image.tsx. */

export const revalidate = 300;

const traer = cache(async (slug: string) => {
  try { return await getProduct(slug); } catch { return null; }
});

const desde = (precios: { price: number }[]) => Math.min(...precios.map((p) => p.price));

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const p = await traer(slug);
  if (!p) return { title: 'Producto' };
  const precio = p.prices.length ? `${p.prices.length > 1 ? 'Desde ' : ''}${formatPrice(desde(p.prices))}. ` : '';
  const descripcion = `${p.description ? `${p.description}. ` : ''}${precio}Pedí online en Fredy's Burger, Santa Fe.`;
  return {
    title: p.name,
    description: descripcion,
    alternates: { canonical: `/producto/${p.slug}` },
    openGraph: { type: 'website', locale: 'es_AR', siteName: "Fredy's Burger", title: `${p.name} · Fredy's Burger`, description: descripcion, url: `/producto/${p.slug}` },
    twitter: { card: 'summary_large_image', title: `${p.name} · Fredy's Burger`, description: descripcion },
  };
}

export default async function Layout({ children, params }: { children: React.ReactNode; params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = await traer(slug);
  const datos = p && p.prices.length ? {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: p.name,
    ...(p.description ? { description: p.description } : {}),
    image: p.images.map((i) => `${SITE_URL}${imgSrc(i)}`),
    brand: { '@type': 'Brand', name: "Fredy's Burger" },
    url: `${SITE_URL}/producto/${p.slug}`,
    offers: {
      '@type': 'AggregateOffer',
      priceCurrency: 'ARS',
      lowPrice: desde(p.prices),
      highPrice: Math.max(...p.prices.map((x) => x.price)),
      offerCount: p.prices.length,
      availability: p.available ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      seller: { '@id': `${SITE_URL}/#restaurante` },
    },
  } : null;

  return (
    <>
      {datos && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(datos) }} />}
      {children}
    </>
  );
}
