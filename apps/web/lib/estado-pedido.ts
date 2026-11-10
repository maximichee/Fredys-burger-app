import type { Order } from '@fredys/types';

/* Reglas compartidas del panel (Pedidos y Dashboard cuentan igual). */

export type Tab = 'atender' | 'pagados' | 'cancelados';

/** Por atender: nuevos y aceptados sin pagar. Aceptado y pagado (o ya entregado) pasa a Pagados */
export function tabDe(o: Order): Tab {
  if (o.status === 'CANCELLED') return 'cancelados';
  if (o.status === 'DELIVERED' || (o.paidAt && o.status !== 'PENDING')) return 'pagados';
  return 'atender';
}

/** Día del pedido en Argentina (AAAA-MM-DD), para agrupar y comparar */
export const diaAR = (f: Date | string | number) =>
  new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Argentina/Buenos_Aires' }).format(new Date(f));

/** "recién", "hace 5 min", "hace 2 h", "ayer", "hace 3 días" */
export function hace(f: Date | string, ahora = Date.now()) {
  const min = Math.round((ahora - new Date(f).getTime()) / 60000);
  if (min < 1) return 'recién';
  if (min < 60) return `hace ${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `hace ${h} h`;
  const d = Math.round(h / 24);
  return d === 1 ? 'ayer' : `hace ${d} días`;
}
