'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { adminFetch } from '@/lib/api';
import { imgSrc } from '@/lib/utils';
import type { Category, Product } from '@fredys/types';
import { Interruptor, useAviso, token, slugDe, campo } from '@/components/admin/Controles';

/* Categorías: tarjetas en grilla (pensado para la compu), en el orden en que aparecen en la web. */

type Cat = Category & { _count?: { products: number } };

export default function AdminCategoriasPage() {
  const [cats, setCats] = useState<Cat[] | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [ocupado, setOcupado] = useState<string | null>(null);
  const [editando, setEditando] = useState<string | null>(null);
  const [nombre, setNombre] = useState('');
  const [nueva, setNueva] = useState('');
  const { avisar, Aviso } = useAviso();

  const cargar = () => adminFetch<Cat[]>('/categories?todas=1', token()).then(setCats).catch((e) => avisar(e.message, true));
  useEffect(() => {
    cargar();
    adminFetch<Product[]>('/products?todas=1', token()).then(setProducts).catch(() => {});
  }, []);

  const guardar = async (id: string, datos: Partial<Category>, ok: string) => {
    setOcupado(id);
    try {
      await adminFetch(`/categories/${id}`, token(), { method: 'PATCH', body: JSON.stringify(datos) });
      await cargar();
      avisar(ok);
    } catch (e) { avisar((e as Error).message, true); }
    setOcupado(null);
  };

  const alternar = (c: Cat) => {
    if (c.active && !confirm(`¿Ocultar "${c.name}" del menú?\nSus productos dejan de verse en la web hasta que la vuelvas a mostrar.`)) return;
    guardar(c.id, { active: !c.active }, c.active ? `"${c.name}" quedó oculta` : `"${c.name}" se ve en el menú`);
  };

  const borrar = async (c: Cat) => {
    const n = c._count?.products ?? 0;
    if (n) return avisar(`"${c.name}" tiene ${n} producto${n > 1 ? 's' : ''}: borralos o pasalos a otra categoría primero`, true);
    if (!confirm(`¿Borrar la categoría "${c.name}"?`)) return;
    setOcupado(c.id);
    try {
      await adminFetch(`/categories/${c.id}`, token(), { method: 'DELETE' });
      await cargar();
      avisar(`"${c.name}" borrada`);
    } catch (e) { avisar((e as Error).message, true); }
    setOcupado(null);
  };

  const mover = async (i: number, d: -1 | 1) => {
    if (!cats) return;
    const lista = [...cats];
    [lista[i], lista[i + d]] = [lista[i + d], lista[i]];
    setCats(lista);
    try {
      await adminFetch('/categories/orden', token(), { method: 'PUT', body: JSON.stringify({ ids: lista.map((c) => c.id) }) });
      avisar('Orden guardado: así aparece en la web');
    } catch (e) { avisar((e as Error).message, true); cargar(); }
  };

  const crear = async (e: React.FormEvent) => {
    e.preventDefault();
    const n = nueva.trim();
    if (!n) return;
    setOcupado('nueva');
    try {
      await adminFetch('/categories', token(), {
        method: 'POST', body: JSON.stringify({ name: n, slug: slugDe(n), order: (cats?.length ?? 0) + 1 }),
      });
      setNueva('');
      await cargar();
      avisar(`Categoría "${n}" creada`);
    } catch (err) { avisar((err as Error).message, true); }
    setOcupado(null);
  };

  const deCat = (c: Cat) => products.filter((p) => p.categoryId === c.id);
  const visibles = cats?.filter((c) => c.active).length ?? 0;

  return (
    <div className="mx-auto max-w-[1400px] space-y-5 p-4 sm:p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold">Categorías</h1>
          <p className="mt-1 text-sm text-white/45">
            Las secciones del menú, en el orden en que aparecen en la web. Ocultá una para sacarla sin borrarla.
          </p>
        </div>
        {cats && (
          <p className="rounded-full bg-[#232323] px-4 py-2 text-sm text-white/60">
            <b className="text-white">{visibles}</b> en el menú · {cats.length - visibles} oculta{cats.length - visibles === 1 ? '' : 's'}
          </p>
        )}
      </div>

      {cats === null && <p className="py-16 text-center text-sm text-white/30">Cargando…</p>}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {cats?.map((c, i) => {
          const prods = deCat(c);
          const foto = prods.find((p) => p.images[0])?.images[0];
          return (
            <article key={c.id} className={`flex flex-col rounded-[26px] bg-[#232323] p-5 transition ${c.active ? '' : 'opacity-60'}`}>
              <div className="flex items-start gap-4">
                <span className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-full bg-[#2e2e2e] ${c.active ? '' : 'grayscale'}`}>
                  {foto && <img src={imgSrc(foto, 'sm')} alt="" className="h-full w-full object-cover" />}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-bold text-white/30">#{i + 1} en el menú</p>
                  {editando === c.id ? (
                    <form className="mt-1 flex gap-2" onSubmit={(e) => { e.preventDefault(); setEditando(null); if (nombre.trim() && nombre !== c.name) guardar(c.id, { name: nombre.trim() }, 'Nombre guardado'); }}>
                      <input autoFocus value={nombre} onChange={(e) => setNombre(e.target.value)} className={campo} />
                      <button className="rounded-full bg-brand px-3 text-sm font-bold text-black">OK</button>
                    </form>
                  ) : (
                    <h2 className="truncate text-lg font-extrabold">{c.name}</h2>
                  )}
                  <Link href="/admin/productos" className="text-xs text-white/45 hover:text-brand">
                    {c._count?.products ?? prods.length} producto{(c._count?.products ?? prods.length) === 1 ? '' : 's'} →
                  </Link>
                </div>
              </div>

              {/* Miniaturas de sus productos */}
              <div className="mt-4 flex h-9 items-center -space-x-2">
                {prods.slice(0, 6).map((p) => (
                  <img key={p.id} src={imgSrc(p.images[0], 'sm')} alt="" title={p.name}
                    className={`h-9 w-9 rounded-full border-2 border-[#232323] object-cover ${p.available ? '' : 'grayscale'}`} />
                ))}
                {prods.length > 6 && (
                  <span className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-[#232323] bg-[#2e2e2e] text-[11px] font-bold text-white/60">+{prods.length - 6}</span>
                )}
                {!prods.length && <span className="text-xs text-white/30">Sin productos todavía</span>}
              </div>

              <div className="mt-4 flex items-center justify-between gap-2 border-t border-white/5 pt-4">
                <Interruptor prendido={c.active} onCambio={() => alternar(c)} si="En el menú" no="Oculta" ocupado={ocupado === c.id} />
                <div className="flex items-center gap-1">
                  <button disabled={i === 0} onClick={() => mover(i, -1)} title="Mostrar antes en el menú"
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-white/[0.06] text-white/60 hover:text-white disabled:opacity-20">←</button>
                  <button disabled={i === cats.length - 1} onClick={() => mover(i, 1)} title="Mostrar después en el menú"
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-white/[0.06] text-white/60 hover:text-white disabled:opacity-20">→</button>
                  <button onClick={() => { setEditando(editando === c.id ? null : c.id); setNombre(c.name); }} title="Renombrar"
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-white/[0.06] text-white/60 hover:text-brand">✎</button>
                  <button onClick={() => borrar(c)} title="Borrar"
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-white/[0.06] text-white/60 hover:text-red-400">🗑</button>
                </div>
              </div>
            </article>
          );
        })}

        {/* Nueva categoría */}
        {cats && (
          <form onSubmit={crear}
            className="flex min-h-[200px] flex-col justify-center gap-3 rounded-[26px] border-2 border-dashed border-white/10 p-5">
            <p className="font-extrabold">+ Nueva categoría</p>
            <input value={nueva} onChange={(e) => setNueva(e.target.value)} placeholder="Ej: Postres" className={campo} />
            <button disabled={ocupado === 'nueva' || !nueva.trim()}
              className="rounded-full bg-brand py-2.5 text-sm font-bold text-black disabled:opacity-40">Agregar al final</button>
          </form>
        )}
      </div>
      {Aviso}
    </div>
  );
}
