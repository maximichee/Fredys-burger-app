import type { CartItem } from '@fredys/types';

/** El último pedido confirmado queda en el teléfono del cliente (solo en su navegador) para repetirlo con un toque. */
const CLAVE = 'fredys-ultimo-pedido';

export type UltimoPedido = { fecha: number; items: CartItem[] };

export function guardarUltimoPedido(items: CartItem[]) {
  try { localStorage.setItem(CLAVE, JSON.stringify({ fecha: Date.now(), items } satisfies UltimoPedido)); } catch { /* sin almacenamiento */ }
}

export function leerUltimoPedido(): UltimoPedido | null {
  try {
    const d = JSON.parse(localStorage.getItem(CLAVE) ?? 'null');
    return d && Array.isArray(d.items) && d.items.length ? d : null;
  } catch { return null; }
}
