'use client';
import { useEffect, useMemo, useState } from 'react';
import { adminFetch } from '@/lib/api';
import { formatPrice, imgSrc } from '@/lib/utils';
import type { Category, Product } from '@fredys/types';
import { Interruptor, useAviso, token } from '@/components/admin/Controles';
import { EditorProducto } from '@/components/admin/EditorProducto';

/* Productos: tarjetas con foto, agrupadas por categoría (mismo estilo que el Resumen). */

type Vista = 'todos' | 'agotados' | 'destacados';

export default function AdminProductosPage() {
  const [products, setProducts] = useState<Product[] | null>(null);
  const [cats, setCats] = useState<Category[]>([]);
  const [search, setSearch] = useState('');
  const [cat, setCat] = useState('');
  const [vista, setVista] = useState<Vista>('todos');
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

  const destacar = async (p: Product) => {
    try {
      await adminFetch(`/products/${p.id}`, token(), { method: 'PATCH', body: JSON.stringify({ featured: !p.featured }) });
      setProducts((ps) => ps?.map((x) => (x.id === p.id ? { ...x, featured: !p.featured } : x)) ?? null);
      avisar(p.featured ? `"${p.name}" ya no es destacado` : `"${p.name}" aparece en "Las elegidas"`);
    } catch (e) { avisar((e as Error).message, true); }
  };

  const lista = products ?? [];
  const cuenta = { todos: lista.length, agotados: lista.filter((p) => !p.available).length, destacados: lista.filter((p) => p.featured).length };

  const grupos = useMemo(() => {
    const q = search.trim().toLowerCase();
    const filtrados = lista.filter((p) =>
      (!cat || p.categoryId === cat) &&
      (vista !== 'agotados' || !p.available) && (vista !== 'destacados' || p.featured) &&
      (!q || p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q)));
    return cats
      .map((c) => ({ c, items: filtrados.filter((p) => p.categoryId === c.id) }))
      .filter((g) => g.items.length);
  }, [lista, cats, search, cat, vista]);

  const fotoCat = (c: Category) => lista.find((p) => p.categoryId === c.id && p.images[0])?.images[0];
  const hayResultados = grupos.length > 0;

  return (
    <div className="mx-auto max-w-[1300px] space-y-5 p-4 sm:p-6">
      {/* Encabezado */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold">Productos</h1>
          <p className="mt-1 text-sm text-white/45">Marcá “Agotado” cuando se termina algo: deja de verse en la web hasta que lo prendas.</p>
        </div>
        <button onClick={() => setEditar('nuevo')} className="rounded-full bg-brand px-5 py-3 text-sm font-bold text-black hover:bg-brand-strong">
          + Nuevo producto
        </button>
      </div>

      {/* Buscador y vistas */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/30">⌕</span>
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar producto o ingrediente…"
            className="w-full rounded-full border border-white/10 bg-[#1c1c1c] py-3 pl-10 pr-4 text-sm placeholder:text-white/30 focus:border-brand focus:outline-none" />
        </div>
        <div className="flex gap-2">
          {([['todos', 'Todos'], ['agotados', 'Agotados'], ['destacados', '★ Destacados']] as [Vista, string][]).map(([v, t]) => (
            <button key={v} onClick={() => setVista(v)}
              className={`whitespace-nowrap rounded-full px-4 py-2.5 text-sm font-bold transition-colors ${
                vista === v ? 'bg-white text-black' : 'bg-[#232323] text-white/55 hover:text-white'}`}>
              {t} <span className="ml-1 opacity-50">{cuenta[v]}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Categorías */}
      <div className="no-scrollbar -mx-1 flex gap-4 overflow-x-auto px-1 pb-1">
        <button onClick={() => setCat('')} className="group w-[72px] shrink-0 text-center">
          <span className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#232323] text-xl ring-2 transition ${cat === '' ? 'ring-brand' : 'ring-transparent group-hover:ring-white/20'}`}>🍽️</span>
          <span className={`mt-1.5 block text-[11px] ${cat === '' ? 'font-bold text-brand' : 'text-white/55'}`}>Todas</span>
        </button>
        {cats.map((c) => (
          <button key={c.id} onClick={() => setCat(cat === c.id ? '' : c.id)} className="group w-[72px] shrink-0 text-center">
            <span className={`mx-auto block h-16 w-16 overflow-hidden rounded-full bg-[#232323] ring-2 transition ${
              cat === c.id ? 'ring-brand' : 'ring-transparent group-hover:ring-white/20'} ${c.active ? '' : 'opacity-40 grayscale'}`}>
              {fotoCat(c) && <img src={imgSrc(fotoCat(c), 'sm')} alt="" className="h-full w-full object-cover" />}
            </span>
            <span className={`mt-1.5 block truncate text-[11px] ${cat === c.id ? 'font-bold text-brand' : 'text-white/55'}`}>{c.name}</span>
          </button>
        ))}
      </div>

      {products === null && <p className="py-16 text-center text-sm text-white/30">Cargando…</p>}
      {products && !hayResultados && (
        <div className="rounded-[28px] bg-[#1c1c1c] py-16 text-center text-sm text-white/40">
          {vista === 'agotados' ? 'No hay nada agotado ✓' : 'No hay productos con ese filtro'}
        </div>
      )}

      {/* Tarjetas por categoría */}
      {grupos.map(({ c, items }) => (
        <section key={c.id}>
          <div className="mb-3 flex items-baseline gap-2 sm:mb-10">
            <h2 className="text-lg font-extrabold">{c.name}</h2>
            <span className="text-xs text-white/35">{items.length}{c.active ? '' : ' · categoría oculta'}</span>
          </div>
          {/* Celular: filas compactas */}
          <div className="space-y-2 sm:hidden">
            {items.map((p) => (
              <article key={p.id} className={`flex gap-3 rounded-[22px] bg-[#232323] p-3 ${p.available ? '' : 'opacity-70'}`}>
                <img src={imgSrc(p.images[0], 'sm')} alt="" className={`h-16 w-16 shrink-0 rounded-2xl object-cover ${p.available ? '' : 'grayscale'}`} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="truncate text-sm font-extrabold">{p.featured && <span className="text-brand">★ </span>}{p.name}</h3>
                    <button onClick={() => setEditar(p)} className="shrink-0 rounded-full bg-white/[0.07] px-3 py-1 text-[11px] font-bold text-white/80">Editar</button>
                  </div>
                  <p className="truncate text-[11px] text-white/45">
                    {p.prices.map((x) => `${x.label} ${formatPrice(x.price)}`).join(' · ') || 'sin precio'}
                  </p>
                  <div className="mt-2">
                    <Interruptor prendido={p.available} onCambio={() => alternar(p)} si="Disponible" no="Agotado" ocupado={ocupado === p.id} />
                  </div>
                </div>
              </article>
            ))}
          </div>

          <div className="hidden grid-cols-2 gap-x-4 gap-y-12 sm:grid lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
            {items.map((p) => (
              <article key={p.id}
                className={`relative flex flex-col rounded-[26px] bg-[#232323] px-4 pb-4 pt-16 transition ${p.available ? '' : 'opacity-70'}`}>
                <img src={imgSrc(p.images[0], 'sm')} alt=""
                  className={`absolute -top-8 left-1/2 h-[92px] w-[92px] -translate-x-1/2 rounded-full object-cover shadow-[0_12px_28px_rgba(0,0,0,.55)] ${p.available ? '' : 'grayscale'}`} />
                <button onClick={() => destacar(p)} title={p.featured ? 'Quitar de destacados' : 'Destacar en "Las elegidas"'}
                  className={`absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full text-sm transition-colors ${
                    p.featured ? 'bg-brand text-black' : 'bg-white/5 text-white/30 hover:text-white'}`}>★</button>
                {!p.available && <span className="absolute left-3 top-3 rounded-full bg-red-500/90 px-2 py-0.5 text-[10px] font-extrabold text-white">AGOTADO</span>}

                <h3 className="truncate text-center font-extrabold">{p.name}</h3>
                <p className="mt-0.5 line-clamp-2 min-h-[2.4em] text-center text-xs text-white/40">{p.description || 'Sin descripción'}</p>

                <div className="mt-3 flex flex-wrap justify-center gap-1.5">
                  {p.prices.map((x) => (
                    <span key={x.id ?? x.label} className="rounded-full bg-white/[0.06] px-2.5 py-1 text-[11px]">
                      <span className="capitalize text-white/45">{x.label}</span> <b className="text-brand">{formatPrice(x.price)}</b>
                    </span>
                  ))}
                  {!p.prices.length && <span className="text-xs text-red-300">sin precio</span>}
                </div>

                <div className="mt-auto flex items-center justify-between gap-2 border-t border-white/5 pt-3" style={{ marginTop: 16 }}>
                  <Interruptor prendido={p.available} onCambio={() => alternar(p)} si="Disponible" no="Agotado" ocupado={ocupado === p.id} />
                  <button onClick={() => setEditar(p)}
                    className="rounded-full bg-white/[0.07] px-4 py-2 text-xs font-bold text-white/80 hover:bg-brand hover:text-black">Editar</button>
                </div>
              </article>
            ))}
          </div>
        </section>
      ))}

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
