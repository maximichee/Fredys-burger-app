'use client';
import { useEffect, useState } from 'react';
import { HORARIOS, horaArgentina } from '@/lib/utils';
import { useEstadoLocal } from '@/lib/use-estado-local';

/** Tabla de horarios con el día de hoy marcado y el estado en vivo. */
export function ListaHorarios() {
  const estado = useEstadoLocal();
  const [hoy, setHoy] = useState(-1);
  useEffect(() => { const d = horaArgentina().dia; setHoy(d === 0 ? 6 : d - 1); }, [estado]); // HORARIOS empieza el lunes

  return (
    <ul className="divide-y divide-[var(--line)]">
      {HORARIOS.map((h, i) => {
        const esHoy = i === hoy;
        return (
          <li key={h.day} className={`flex items-center justify-between gap-3 py-3 ${esHoy ? '-mx-3 rounded-[var(--r-sm)] border-0 bg-brand/10 px-3' : ''}`} aria-current={esHoy ? 'date' : undefined}>
            <span className="flex items-center gap-2 font-semibold">
              {h.day}
              {esHoy && <span className="rounded-full bg-brand px-2 py-0.5 text-[.7rem] font-extrabold uppercase tracking-wider text-tinta">Hoy</span>}
            </span>
            <span className="text-right">
              <span className={h.open ? 'text-crema' : 'text-apagado'}>{h.time}</span>
              {esHoy && estado && (
                <span className={`block text-xs font-semibold ${estado.abierto ? 'text-green-400' : 'text-apagado'}`}>{estado.corto}</span>
              )}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
