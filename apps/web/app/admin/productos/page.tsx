'use client';
import { useEffect, useMemo, useState } from 'react';
import { adminFetch } from '@/lib/api';
import { formatPrice, imgSrc } from '@/lib/utils';
import type { Category, Product } from '@fredys/types';
import { Interruptor, useAviso, token } from '@/components/admin/Controles';
import { EditorProducto } from '@/components/admin/EditorProducto';

export default function AdminProductosPage() {
  const [products, setProducts] = useState<Product[] | null>(null);
  const [cats, setCats] = useState<Category[]>([]);
  const [search, setSearch] = useState('');
  const [cat, setCat] = useState('');
  const [ocupado, setOcupado] = useState<string | null>(null);
  const [editar, setEditar] = useState<Product | 'nuevo' | null>(null);
  const { avisar, Aviso } = useAviso();

  const cargar = () => adminFetch<Product[]>('/products?todas=1', token()).then(setProducts).catch((e) => avisar(e.message, true));
  useEffect(() => {
    cargar();
    adminFetch<Category[]>('/categories?todas=1', token()).then(setCats).catch(() => {});
  }, []);

  const alternar = async (p: Product) => {
    setOcupado(p.id);
    try {
      await adminFetch(`/products/${p.id}`, token(), { method: 'PATCH', body: JSON.stringify({ available: !p.available }) });
      setProducts((ps) => ps?.map((x) => (x.id === p.id ? { ...x, available: !p.available } : x)) ?? null);
      avisar(p.available ? `"${p.name}" marcado como agotado` : `"${p.name}" vuelve a estar disponible`);
    } catch (e) { avisar((e as Error).message, true); }
    setOcupado(null);
  };

  const filtrados = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (products ?? []).filter((p) =>
      (!cat || p.categoryId === cat) && (!q || p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q)));
  }, [products, search, cat]);

  const agotados = products?.filter((p) => !p.available).length ?? 0;

  return (
    <div className="mx-auto max-w-5xl space-y-4 p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold">Productos</h1>
          <p className="mt-1 text-sm text-white/40">
            {products?.length ?? '…'} en total{agotados ? ` · ${agotados} agotados` : ''}. Marcá “Agotado” cuando se termina algo: deja de verse en la web.
          </p>
        </div>
        <button onClick={() => setEditar('nuevo')} className="rounded-xl bg-brand px-4 py-2.5 text-sm font-bold text-black">+ Nuevo producto</button>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar producto…"
          className="w-full rounded-xl border border-white/8 bg-dark-100 px-4 py-2.5 text-sm placeholder:text-white/25 focus:border-brand focus:outline-none" />
        <select value={cat} onChange={(e) => setCat(e.target.value)}
          className="rounded-xl border border-white/8 bg-dark-100 px-3 py-2.5 text-sm focus:border-brand focus:outline-none sm:w-56">
          <option value="">Todas las categorías</option>
          {cats.map((c) => <option key={c.id} value={c.id}>{c.name}{c.active ? '' : ' (oculta)'}</option>)}
        </select>
      </div>

      <div className="overflow-hidden rounded-2xl border border-white/5 bg-dark-100">
        {products === null && <p className="py-10 text-center text-sm text-white/30">Cargando…</p>}
        {products && filtrados.length === 0 && <p className="py-10 text-center text-sm text-white/30">No hay productos con ese filtro</p>}
        <div className="divide-y divide-white/5">
          {filtrados.map((p) => (
            <div key={p.id} className="flex flex-wrap items-center gap-3 px-4 py-3 text-sm sm:flex-nowrap">
              <img src={imgSrc(p.images[0], 'sm')} alt="" className={`h-12 w-12 shrink-0 rounded-xl object-cover ${p.available ? '' : 'opacity-40 grayscale'}`} />
              <div className="min-w-0 flex-1 basis-[calc(100%-64px)] sm:basis-auto">
                <p className={`font-semibold ${p.available ? '' : 'text-white/45'}`}>
                  {p.name} {p.featured && <span title="Destacado" className="text-brand">★</span>}
                </p>
                <p className="truncate text-xs text-white/35">
                  {p.category?.name}{p.category && !p.category.active ? ' (oculta)' : ''} · {p.prices.map((x) => `${x.label} ${formatPrice(x.price)}`).join(' · ') || 'sin precio'}
                </p>
              </div>
              <div className="flex w-full items-center justify-between gap-3 pl-[60px] sm:w-auto sm:pl-0">
                <button onClick={() => setEditar(p)} className="rounded-lg border border-white/10 px-3 py-1.5 text-xs font-bold text-white/70 hover:border-brand hover:text-brand">Editar</button>
                <Interruptor prendido={p.available} onCambio={() => alternar(p)} si="Disponible" no="Agotado" ocupado={ocupado === p.id} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {editar && (
        <EditorProducto
          producto={editar === 'nuevo' ? null : editar}
          categorias={cats}
          onCerrar={() => setEditar(null)}
          onGuardado={(msg) => { setEditar(null); avisar(msg); cargar(); }}
          onError={(msg) => avisar(msg, true)}
        />
      )}
      {Aviso}
    </div>
  );
}
