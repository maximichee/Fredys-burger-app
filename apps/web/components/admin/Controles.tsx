'use client';
import { useCallback, useEffect, useState } from 'react';

/* Piezas chicas que comparten las pantallas del panel. */

/** Interruptor con texto: deja claro qué pasa al tocarlo */
export function Interruptor({
  prendido, onCambio, si, no, ocupado,
}: { prendido: boolean; onCambio: () => void; si: string; no: string; ocupado?: boolean }) {
  return (
    <button
      type="button" role="switch" aria-checked={prendido} disabled={ocupado} onClick={onCambio}
      className="flex items-center gap-2.5 text-xs font-bold disabled:opacity-50"
    >
      <span className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${prendido ? 'bg-green-500' : 'bg-white/15'}`}>
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${prendido ? 'left-[22px]' : 'left-0.5'}`} />
      </span>
      <span className={`text-left sm:w-24${prendido ? 'text-green-400' : 'text-white/45'}`}>{prendido ? si : no}</span>
    </button>
  );
}

/** Aviso que aparece abajo unos segundos ("Guardado", "No se pudo…") */
export function useAviso() {
  const [aviso, setAviso] = useState<{ texto: string; error?: boolean } | null>(null);
  useEffect(() => {
    if (!aviso) return;
    const t = setTimeout(() => setAviso(null), 3500);
    return () => clearTimeout(t);
  }, [aviso]);
  const avisar = useCallback((texto: string, error = false) => setAviso({ texto, error }), []);
  const Aviso = aviso ? (
    <div className={`fixed bottom-24 md:bottom-6 left-1/2 z-[60] -translate-x-1/2 rounded-xl px-4 py-2.5 text-sm font-semibold shadow-2xl ${
      aviso.error ? 'bg-red-500 text-white' : 'bg-white text-black'}`}>
      {aviso.texto}
    </div>
  ) : null;
  return { avisar, Aviso };
}

export const token = () => (typeof window !== 'undefined' ? localStorage.getItem('admin_token') ?? '' : '');

export const slugDe = (s: string) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

export const campo =
  'w-full rounded-xl border border-white/10 bg-dark-200 px-3 py-2.5 text-sm focus:border-brand focus:outline-none placeholder:text-white/25';
