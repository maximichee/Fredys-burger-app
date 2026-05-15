'use client';
import { useEffect, useState } from 'react';
import { adminFetch } from '@/lib/api';
import { formatPrice } from '@/lib/utils';
import type { Product } from '@fredys/types';

export default function AdminProductosPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch]     = useState('');
  const token = typeof window !== 'undefined' ? localStorage.getItem('admin_token') ?? '' : '';

  const load = () => adminFetch<Product[]>('/products', token).then(setProducts).catch(console.error);
  useEffect(() => { load(); }, [token]);

  const toggleAvailable = async (product: Product) => {
    await adminFetch(`/products/${product.id}`, token, {
      method: 'PATCH',
      body: JSON.stringify({ available: !product.available }),
    });
    load();
  };

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.category?.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold">Productos</h1>
        <span className="text-white/40 text-sm">{products.length} en total</span>
      </div>

      <input value={search} onChange={(e) => setSearch(e.target.value)}
        placeholder="Buscar producto o categoría..."
        className="w-full bg-dark-100 border border-white/8 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-brand transition-colors placeholder:text-white/25" />

      <div className="bg-dark-100 border border-white/5 rounded-2xl overflow-hidden">
        <div className="grid grid-cols-[auto_1fr_auto_auto_auto] gap-4 px-4 py-2 text-xs font-bold text-white/30 uppercase tracking-wider border-b border-white/5">
          <span />
          <span>Producto</span>
          <span>Categoría</span>
          <span>Precio base</span>
          <span>Estado</span>
        </div>
        <div className="divide-y divide-white/5">
          {filtered.map((product) => (
            <div key={product.id} className="grid grid-cols-[auto_1fr_auto_auto_auto] gap-4 px-4 py-3 items-center text-sm">
              {product.images[0] ? (
                <img src={`/${product.images[0]}`} alt="" className="w-10 h-10 rounded-xl object-cover" />
              ) : (
                <div className="w-10 h-10 rounded-xl bg-dark-300 flex items-center justify-center text-lg">🍔</div>
              )}
              <div>
                <p className="font-semibold">{product.name}</p>
                {product.description && (
                  <p className="text-white/35 text-xs truncate max-w-xs">{product.description}</p>
                )}
              </div>
              <span className="text-white/40 text-xs">{product.category?.name}</span>
              <span className="text-brand font-bold">
                {product.prices[0] ? formatPrice(product.prices[0].price) : '—'}
              </span>
              <button
                onClick={() => toggleAvailable(product)}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-colors ${
                  product.available
                    ? 'bg-green-500/15 text-green-400 hover:bg-red-500/15 hover:text-red-400'
                    : 'bg-red-500/15 text-red-400 hover:bg-green-500/15 hover:text-green-400'
                }`}
              >
                {product.available ? 'Activo' : 'Inactivo'}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
