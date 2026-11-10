'use client';
import { useEffect, useState } from 'react';
import { adminFetch } from '@/lib/api';
import type { Category } from '@fredys/types';
import { Interruptor, useAviso, token, slugDe, campo } from '@/components/admin/Controles';

type Cat = Category & { _count?: { products: number } };

export default function AdminCategoriasPage() {
  const [cats, setCats] = useState<Cat[] | null>(null);
  const [ocupado, setOcupado] = useState<string | null>(null);
  const [editando, setEditando] = useState<string | null>(null);
  const [nombre, setNombre] = useState('');
  const [nueva, setNueva] = useState('');
  const { avisar, Aviso } = useAviso();

  const cargar = () => adminFetch<Cat[]>('/categories?todas=1', token()).then(setCats).catch((e) => avisar(e.message, true));
  useEffect(() => { cargar(); }, []);

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
      avisar('Orden guardado');
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

  return (
    <div className="mx-auto max-w-3xl space-y-5 p-6">
      <div>
        <h1 className="text-2xl font-extrabold">Categorías</h1>
        <p className="mt-1 text-sm text-white/40">Las secciones del menú. Ocultá una para sacarla de la web sin borrarla.</p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-white/5 bg-dark-100">
        {cats === null && <p className="py-10 text-center text-sm text-white/30">Cargando…</p>}
        <div className="divide-y divide-white/5">
          {cats?.map((c, i) => (
            <div key={c.id} className={`flex flex-wrap items-center gap-3 px-4 py-3.5 ${c.active ? '' : 'bg-white/[0.015]'}`}>
              <div className="flex flex-col">
                <button disabled={i === 0} onClick={() => mover(i, -1)} aria-label="Subir"
                  className="px-1.5 text-white/40 hover:text-white disabled:opacity-15">▲</button>
                <button disabled={i === cats.length - 1} onClick={() => mover(i, 1)} aria-label="Bajar"
                  className="px-1.5 text-white/40 hover:text-white disabled:opacity-15">▼</button>
              </div>

              <div className="min-w-0 flex-1">
                {editando === c.id ? (
                  <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); setEditando(null); if (nombre.trim() && nombre !== c.name) guardar(c.id, { name: nombre.trim() }, 'Nombre guardado'); }}>
                    <input autoFocus value={nombre} onChange={(e) => setNombre(e.target.value)} className={campo} />
                    <button className="rounded-xl bg-brand px-3 text-sm font-bold text-black">OK</button>
                    <button type="button" onClick={() => setEditando(null)} className="px-2 text-sm text-white/40">✕</button>
                  </form>
                ) : (
                  <>
                    <p className={`font-semibold ${c.active ? '' : 'text-white/45'}`}>
                      {c.name}
                      <button onClick={() => { setEditando(c.id); setNombre(c.name); }}
                        className="ml-2 text-xs font-normal text-white/30 hover:text-brand">editar</button>
                      <button onClick={() => borrar(c)}
                        className="ml-2 text-xs font-normal text-white/30 hover:text-red-400">borrar</button>
                    </p>
                    <p className="text-xs text-white/35">{c._count?.products ?? 0} productos</p>
                  </>
                )}
              </div>

              <Interruptor prendido={c.active} onCambio={() => alternar(c)} si="En el menú" no="Oculta" ocupado={ocupado === c.id} />
            </div>
          ))}
        </div>
      </div>

      <form onSubmit={crear} className="flex gap-2">
        <input value={nueva} onChange={(e) => setNueva(e.target.value)} placeholder="Nueva categoría (ej: Postres)" className={campo} />
        <button disabled={ocupado === 'nueva' || !nueva.trim()}
          className="shrink-0 rounded-xl bg-brand px-4 text-sm font-bold text-black disabled:opacity-40">Agregar</button>
      </form>
      {Aviso}
    </div>
  );
}
