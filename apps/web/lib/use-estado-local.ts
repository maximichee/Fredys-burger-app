'use client';
import { useEffect, useState } from 'react';
import { estadoLocal, type EstadoLocal } from './utils';

/** Estado del local que se actualiza solo cada 30 s. null hasta montar (la hora es la del navegador, no la del servidor). */
export function useEstadoLocal(): EstadoLocal | null {
  const [estado, setEstado] = useState<EstadoLocal | null>(null);
  useEffect(() => {
    const tick = () => setEstado(estadoLocal());
    tick();
    const id = setInterval(tick, 30000);
    return () => clearInterval(id);
  }, []);
  return estado;
}
