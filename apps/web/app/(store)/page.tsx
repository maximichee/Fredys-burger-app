import { Suspense } from 'react';
import { getCategories, getProducts } from '@/lib/api';
import { CategoryPills } from '@/components/menu/CategoryPills';
import { ProductCard } from '@/components/menu/ProductCard';
import { ClosedBanner } from '@/components/ClosedBanner';
import { SearchBar } from '@/components/menu/SearchBar';
import { HeroSlider } from '@/components/HeroSlider';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Fredys Burger | Hamburguesas Artesanales · Santa Fe',
};

export const revalidate = 60;

async function MenuContent({ query }: { query?: string }) {
  let categories: Awaited<ReturnType<typeof getCategories>> = [];
  let products: Awaited<ReturnType<typeof getProducts>> = [];
  try {
    [categories, products] = await Promise.all([getCategories(), getProducts()]);
  } catch {
    // API no disponible — se muestra menú vacío hasta que el backend esté desplegado
  }

  const filtered = query
    ? products.filter(
        (p) =>
          p.name.toLowerCase().includes(query.toLowerCase()) ||
          p.description.toLowerCase().includes(query.toLowerCase()),
      )
    : products;

  const byCategory = categories.map((cat) => ({
    ...cat,
    items: filtered.filter((p) => p.categoryId === cat.id),
    _count: { products: products.filter((p) => p.categoryId === cat.id).length },
  }));

  const visibleCategories = byCategory.filter((c) => c.items.length > 0);

  return (
    <>
      {!query && <CategoryPills categories={byCategory} />}

      <div className="max-w-6xl mx-auto px-4 py-8 space-y-16" id="menu">
        {query && (
          <p className="text-white/40 text-sm">
            {filtered.length} resultado{filtered.length !== 1 ? 's' : ''} para &ldquo;<span className="text-white">{query}</span>&rdquo;
          </p>
        )}

        {visibleCategories.length === 0 && (
          <div className="text-center py-20 text-white/30">
            <p className="text-4xl mb-3">🔍</p>
            <p>Sin resultados para &ldquo;{query}&rdquo;</p>
          </div>
        )}

        {visibleCategories.map((cat) => (
          <section key={cat.slug} id={cat.slug} className="scroll-mt-32">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/5">
              <h2 className="text-xl font-extrabold">{cat.name}</h2>
              {!query && <span className="text-white/30 text-sm">{cat._count.products}</span>}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {cat.items.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </>
  );
}

interface HomePageProps {
  searchParams: Promise<{ q?: string }>;
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const { q } = await searchParams;

  return (
    <>
      <ClosedBanner />

      <HeroSlider />

      {/* Buscador */}
      <div className="max-w-6xl mx-auto px-4 -mt-6 relative z-10 mb-4">
        <Suspense>
          <SearchBar />
        </Suspense>
      </div>

      <Suspense fallback={<MenuSkeleton />}>
        <MenuContent query={q} />
      </Suspense>
    </>
  );
}

function MenuSkeleton() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="bg-dark-200 rounded-2xl overflow-hidden animate-pulse">
            <div className="aspect-[4/3] bg-dark-300" />
            <div className="p-4 space-y-2">
              <div className="h-4 bg-dark-300 rounded w-3/4" />
              <div className="h-3 bg-dark-300 rounded w-full" />
              <div className="h-5 bg-dark-300 rounded w-1/3" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
