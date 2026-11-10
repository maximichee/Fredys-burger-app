'use client';
import { useEffect, useState } from 'react';
import { adminFetch } from '@/lib/api';
import { imgSrc } from '@/lib/utils';
import type { Category, Product } from '@fredys/types';
import { ImageUpload } from './ImageUpload';
import { token, slugDe, campo } from './Controles';

type Precio = { label: string; price: string };

/** Ventana para crear o editar un producto: nombre, descripción, categoría, foto, precios y destacado */
export function EditorProducto({
  producto, categorias, onCerrar, onGuardado, onError,
}: {
  producto: Product | null; categorias: Category[];
  onCerrar: () => void; onGuardado: (msg: string) => void; onError: (msg: string) => void;
}) {
  const [name, setName] = useState(producto?.name ?? '');
  const [description, setDescription] = useState(producto?.description ?? '');
  const [categoryId, setCategoryId] = useState(producto?.categoryId ?? categorias[0]?.id ?? '');
  const [images, setImages] = useState<string[]>(producto?.images ?? []);
  const [featured, setFeatured] = useState(producto?.featured ?? false);
  const [precios, setPrecios] = useState<Precio[]>(
    producto?.prices.length ? producto.prices.map((p) => ({ label: p.label, price: String(p.price) })) : [{ label: 'simple', price: '' }],
  );
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && onCerrar();
    window.addEventListener('keydown', esc);
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', esc); document.body.style.overflow = ''; };
  }, [onCerrar]);

  const cambiarPrecio = (i: number, k: keyof Precio, v: string) =>
    setPrecios((ps) => ps.map((p, j) => (j === i ? { ...p, [k]: k === 'price' ? v.replace(/\D/g, '') : v } : p)));

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault();
    const prices = precios
      .filter((p) => p.label.trim() && p.price)
      .map((p, i) => ({ label: p.label.trim().toLowerCase(), price: Number(p.price), order: i }));
    if (!name.trim()) return onError('Falta el nombre');
    if (!categoryId) return onError('Elegí una categoría');
    if (!prices.length) return onError('Poné al menos un precio');
    if (new Set(prices.map((p) => p.label)).size !== prices.length) return onError('Hay dos precios con el mismo nombre');

    const datos = { name: name.trim(), description: description.trim(), categoryId, images, featured, prices };
    setGuardando(true);
    try {
      if (producto) {
        await adminFetch(`/products/${producto.id}`, token(), { method: 'PATCH', body: JSON.stringify(datos) });
        onGuardado(`"${datos.name}" guardado`);
      } else {
        await adminFetch('/products', token(), { method: 'POST', body: JSON.stringify({ ...datos, slug: slugDe(datos.name) }) });
        onGuardado(`"${datos.name}" creado`);
      }
    } catch (err) {
      onError((err as Error).message);
      setGuardando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 sm:items-center sm:p-6" onClick={onCerrar}>
      <form
        onSubmit={guardar} onClick={(e) => e.stopPropagation()}
        className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-3xl border border-white/10 bg-dark-100 p-5 sm:rounded-3xl"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-extrabold">{producto ? 'Editar producto' : 'Nuevo producto'}</h2>
          <button type="button" onClick={onCerrar} aria-label="Cerrar" className="px-2 text-xl text-white/40 hover:text-white">✕</button>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-[96px_1fr] gap-3">
            <div className="h-24">
              <ImageUpload
                key={images[0] ?? 'sin'}
                value={images[0] ? imgSrc(images[0], 'sm') : ''}
                token={token()}
                onChange={(url) => setImages((im) => [url, ...im.slice(1)])}
              />
            </div>
            <div className="space-y-2">
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nombre" className={campo} />
              <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className={campo}>
                {categorias.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>

          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3}
            placeholder="Descripción (ingredientes separados por coma)" className={campo} />

          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-wider text-white/40">Precios</p>
            <div className="space-y-2">
              {precios.map((p, i) => (
                <div key={i} className="flex gap-2">
                  <input value={p.label} onChange={(e) => cambiarPrecio(i, 'label', e.target.value)} placeholder="simple, doble…" className={campo} />
                  <div className="relative w-36 shrink-0">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-white/40">$</span>
                    <input value={p.price} onChange={(e) => cambiarPrecio(i, 'price', e.target.value)} inputMode="numeric" placeholder="0" className={`${campo} pl-7`} />
                  </div>
                  <button type="button" disabled={precios.length === 1} onClick={() => setPrecios((ps) => ps.filter((_, j) => j !== i))}
                    aria-label="Quitar precio" className="px-2 text-white/35 hover:text-red-400 disabled:opacity-20">✕</button>
                </div>
              ))}
            </div>
            <button type="button" onClick={() => setPrecios((ps) => [...ps, { label: '', price: '' }])}
              className="mt-2 text-xs font-bold text-brand">+ Agregar tamaño</button>
          </div>

          <label className="flex cursor-pointer items-center gap-2.5 text-sm">
            <input type="checkbox" checked={featured} onChange={(e) => setFeatured(e.target.checked)} className="h-4 w-4 accent-[#f5a524]" />
            Destacado (aparece en “Las elegidas”)
          </label>
        </div>

        <div className="mt-6 flex gap-2">
          <button type="button" onClick={onCerrar} className="flex-1 rounded-xl border border-white/10 py-3 text-sm font-bold text-white/60">Cancelar</button>
          <button disabled={guardando} className="flex-1 rounded-xl bg-brand py-3 text-sm font-bold text-black disabled:opacity-50">
            {guardando ? 'Guardando…' : 'Guardar'}
          </button>
        </div>
      </form>
    </div>
  );
}
