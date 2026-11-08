'use client';
import { useEffect, useRef } from 'react';
import type { Order } from '@fredys/types';
import { adminFetch } from './api';

/* Pedidos en vivo para el panel. Antes era un WebSocket del servidor NestJS; en Vercel no hay servidor
   prendido todo el tiempo, así que el panel pregunta cada 8 segundos (y al volver a la pestaña).
   Mismo uso que antes: avisa los pedidos nuevos y los que cambiaron de estado. */

interface UseOrdersSocketOptions {
  onNewOrder?: (order: Order) => void;
  onOrderUpdated?: (order: Order) => void;
}

const CADA_MS = 8000;

export function useOrdersSocket({ onNewOrder, onOrderUpdated }: UseOrdersSocketOptions) {
  const vistos = useRef<Map<string, string> | null>(null); // id → updatedAt
  const cbs = useRef({ onNewOrder, onOrderUpdated });
  cbs.current = { onNewOrder, onOrderUpdated };

  useEffect(() => {
    let vivo = true;
    const revisar = async () => {
      const token = localStorage.getItem('admin_token');
      if (!token || document.hidden) return;
      try {
        const lista = await adminFetch<Order[]>('/orders', token);
        if (!vivo) return;
        const antes = vistos.current;
        const ahora = new Map(lista.map((o) => [o.id, String(o.updatedAt)]));
        if (antes) {
          // del más viejo al más nuevo, para que el último quede arriba
          [...lista].reverse().forEach((o) => {
            if (!antes.has(o.id)) cbs.current.onNewOrder?.(o);
            else if (antes.get(o.id) !== String(o.updatedAt)) cbs.current.onOrderUpdated?.(o);
          });
        }
        vistos.current = ahora;
      } catch { /* sin conexión: se reintenta en la próxima vuelta */ }
    };
    revisar();
    const id = setInterval(revisar, CADA_MS);
    const alVolver = () => { if (!document.hidden) revisar(); };
    document.addEventListener('visibilitychange', alVolver);
    return () => { vivo = false; clearInterval(id); document.removeEventListener('visibilitychange', alVolver); };
  }, []);

  return null;
}
