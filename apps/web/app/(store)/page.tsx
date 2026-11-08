import { Suspense } from 'react';
import type { Metadata } from 'next';
import { categorias as getCategories, productos as getProducts } from '@/lib/server/menu';
import { CategoryPills } from '@/components/menu/CategoryPills';
import { ProductCard } from '@/components/menu/ProductCard';
import { RepetirPedido } from '@/components/fredys/RepetirPedido';
import { SearchBar } from '@/components/menu/SearchBar';
import { Hero } from '@/components/fredys/Hero';
import { Elegidas, ComoLlega, PorQue, HorarioContacto } from '@/components/fredys/Secciones';
import { SITE_URL } from '@/lib/sitio';
import { imgSrc } from '@/lib/utils';

export const metadata: Metadata = {
  title: { absolute: "Fredy's Burger | Burgers artesanales · Santa Fe" },
  alternates: { canonical: '/' },
};

export const revalidate = 60;

interface HomePageProps {
  searchParams: Promise<{ q?: string }>;
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const { q } = await searchParams;

  let categories: Awaited<ReturnType<typeof getCategories>> = [];
  let products: Awaited<ReturnType<typeof getProducts>> = [];
  try {
    [categories, products] = await Promise.all([getCategories(), getProducts()]);
  } catch {
    // API no disponible: el menú se muestra vacío con un aviso
  }

  const query = q?.trim().toLowerCase();
  const filtered = query
    ? products.filter((p) => p.name.toLowerCase().includes(query) || p.description.toLowerCase().includes(query))
    : products;

  const byCategory = categories.map((cat) => ({
    ...cat,
    items: filtered.filter((p) => p.categoryId === cat.id),
    _count: { products: products.filter((p) => p.categoryId === cat.id).length },
  }));
  const visibles = byCategory.filter((c) => c.items.length > 0);
  const elegidas = products.filter((p) => p.featured && p.available);

  // La carta para Google: secciones y platos con sus precios (schema.org/Menu)
  const carta = {
    '@context': 'https://schema.org',
    '@type': 'Menu',
    '@id': `${SITE_URL}/#menu`,
    name: "Menú de Fredy's Burger",
    inLanguage: 'es-AR',
    hasMenuSection: categories.map((cat) => ({
      '@type': 'MenuSection',
      name: cat.name,
      hasMenuItem: products.filter((p) => p.categoryId === cat.id && p.available).map((p) => ({
        '@type': 'MenuItem',
        name: p.name,
        ...(p.description ? { description: p.description } : {}),
        url: `${SITE_URL}/producto/${p.slug}`,
        image: `${SITE_URL}${imgSrc(p.images[0])}`,
        offers: [...p.prices].sort((a, b) => a.order - b.order).map((pr) => ({
          '@type': 'Offer', name: pr.label, price: pr.price, priceCurrency: 'ARS',
        })),
      })),
    })).filter((s) => s.hasMenuItem.length),
  };

  return (
    <>
      {products.length > 0 && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(carta) }} />}
      <Hero />

      <Elegidas products={elegidas} />

      {/* ===== MENÚ COMPLETO ===== */}
      <section id="menu" className="relative scroll-mt-16 overflow-x-clip pb-[var(--section-y)]" aria-labelledby="menu-t">
        <div className="relative z-[1] mx-auto max-w-6xl px-[var(--gutter)] pt-10">
          <p className="ceja">El menú</p>
          <h2 id="menu-t" className="titulo mb-6 text-[clamp(2.6rem,10vw,5rem)]" data-split>Elegí la tuya</h2>
          <Suspense>
            <SearchBar />
          </Suspense>
          {!query && <RepetirPedido products={products} />}
        </div>

        {!query && byCategory.length > 0 && <CategoryPills categories={byCategory.filter((c) => c._count.products > 0)} />}

        <div className="relative z-[1] mx-auto max-w-6xl space-y-14 px-[var(--gutter)] pt-8">
          {query && (
            <p className="text-sm text-apagado" role="status">
              {filtered.length} resultado{filtered.length !== 1 ? 's' : ''} para &ldquo;<span className="text-crema">{q}</span>&rdquo;
            </p>
          )}

          {products.length === 0 && (
            <div className="vidrio rounded-[var(--r-lg)] p-8 text-center">
              <p className="titulo text-3xl">El menú no cargó</p>
              <p className="mt-2 text-apagado">Probá de nuevo en un ratito o pedí directo por WhatsApp.</p>
            </div>
          )}

          {query && visibles.length === 0 && products.length > 0 && (
            <p className="py-16 text-center text-apagado">No encontramos nada con &ldquo;{q}&rdquo;. Probá con otra palabra.</p>
          )}

          {visibles.map((cat) => (
            <section key={cat.slug} id={cat.slug} className="scroll-mt-36" aria-labelledby={`cat-${cat.slug}`}>
              <div className="mb-2 flex items-center gap-4">
                <h3 id={`cat-${cat.slug}`} className="titulo flex-shrink-0 text-[clamp(1.8rem,6vw,2.6rem)]">{cat.name}</h3>
                <span className="franja flex-1" aria-hidden="true" data-franja />
                {!query && <span className="text-sm text-apagado">{cat._count.products}</span>}
              </div>
              <div className="grid gap-x-10 md:grid-cols-2" data-cascada>
                {cat.items.map((product) => <ProductCard key={product.id} product={product} />)}
              </div>
            </section>
          ))}
        </div>
      </section>
      {/* ===== /MENÚ COMPLETO ===== */}

      <ComoLlega />
      <PorQue />
      <HorarioContacto />
    </>
  );
}
