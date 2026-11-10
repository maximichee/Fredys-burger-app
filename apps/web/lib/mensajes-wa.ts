import type { Order, OrderStatus } from '@fredys/types';
import { formatPrice, DEMORA, horarioProgramado } from './utils';

/* Mensajes que el local le manda al cliente por WhatsApp desde el panel.
   El panel abre WhatsApp con el texto ya escrito: el admin solo toca "Enviar". */

/** Datos del local que van en los mensajes (se cargan en el panel, "Datos para los mensajes") */
export type DatosLocal = { direccion: string; alias: string };

const CLAVE = 'fredys_datos_mensajes';
export const leerDatosLocal = (): DatosLocal => {
  try { return { direccion: '', alias: '', ...JSON.parse(localStorage.getItem(CLAVE) ?? '{}') }; }
  catch { return { direccion: '', alias: '' }; }
};
export const guardarDatosLocal = (d: DatosLocal) => {
  try { localStorage.setItem(CLAVE, JSON.stringify(d)); } catch { /* sin almacenamiento */ }
};

/** Solo dígitos, con código de área (al menos 10) */
export const telefonoValido = (t: string) => t.replace(/\D/g, '').replace(/^0+/, '').length >= 10;

/**
 * Teléfono argentino al formato de wa.me (549 + área + número, sin 0 ni 15).
 * "342 503-9876" → 5493425039876 · "0342 15 503-9876" → 5493425039876 · "+54 9 342 5039876" → igual
 */
export function telefonoWa(t: string) {
  let d = t.replace(/\D/g, '');
  if (d.startsWith('00')) d = d.slice(2);
  if (d.startsWith('54')) d = d.slice(2);
  if (d.startsWith('9')) d = d.slice(1);
  d = d.replace(/^0+/, '');
  if (d.length === 12) {
    // Tiene el 15 después del código de área (2, 3 o 4 dígitos)
    for (const area of [3, 4, 2]) if (d.slice(area, area + 2) === '15') { d = d.slice(0, area) + d.slice(area + 2); break; }
  }
  return `549${d}`;
}

const nombreDe = (o: Order) => o.customerName.trim().split(/\s+/)[0];
const pago = (o: Order, local: DatosLocal) =>
  o.paymentMethod === 'CASH'
    ? 'Efectivo'
    : `Transferencia${local.alias ? ` al alias *${local.alias}*` : ''} (mandanos el comprobante por acá)`;

/** Mensaje para cada estado. null = ese paso no necesita avisar al cliente */
export function mensajePara(estado: OrderStatus, o: Order, local: DatosLocal): string | null {
  const retiro = o.deliveryMethod === 'PICKUP';
  const dondeRetirar = local.direccion ? `en *${local.direccion}*` : 'en el local';

  if (estado === 'CONFIRMED') {
    const items = (o.items ?? [])
      .map((i) => `• ${i.quantity}x ${i.productName} (${i.priceLabel}) — ${formatPrice(i.subtotal)}`)
      .join('\n');
    return [
      `¡Hola ${nombreDe(o)}! 👋 Somos *Fredy's Burger*.`,
      `Confirmamos tu pedido N° ${o.code} ✅`,
      '',
      items,
      '',
      `Subtotal: ${formatPrice(o.subtotal)}`,
      retiro ? 'Retiro en el local: sin cargo' : `Envío: ${formatPrice(o.deliveryCost)}`,
      `*Total: ${formatPrice(o.total)}*`,
      '',
      retiro ? `🏪 Retirás ${dondeRetirar}` : `📍 Te lo llevamos a: ${o.address}`,
      `💳 Pago: ${pago(o, local)}`,
      ...(o.notes ? [`📝 Aclaraciones: ${o.notes}`] : []),
      '',
      o.scheduledFor
        ? (retiro
          ? `⏰ Lo tenemos listo para retirar *${horarioProgramado(o.scheduledFor)}*. ¡Gracias!`
          : `⏰ Te lo llevamos *${horarioProgramado(o.scheduledFor)}*. ¡Gracias!`)
        : `⏱️ Lo empezamos a preparar: está en ${DEMORA} aprox. ¡Gracias!`,
    ].join('\n');
  }
  if (estado === 'READY' && retiro) {
    return `¡${nombreDe(o)}, tu pedido N° ${o.code} ya está listo! 🍔\nPasá a retirarlo ${dondeRetirar}.\nTotal: *${formatPrice(o.total)}* (${pago(o, local)}).`;
  }
  if (estado === 'DELIVERING') {
    return `¡${nombreDe(o)}, tu pedido N° ${o.code} va en camino! 🛵\nLlega a ${o.address} en unos minutos.\nTotal: *${formatPrice(o.total)}*${o.paymentMethod === 'CASH' ? ' en efectivo (si podés, tené el cambio justo 🙏)' : ''}.`;
  }
  if (estado === 'CANCELLED') {
    return `Hola ${nombreDe(o)}, te escribimos de *Fredy's Burger*. Lamentablemente no podemos tomar tu pedido N° ${o.code} en este momento. Perdón por las molestias 🙏`;
  }
  return null;
}

export const linkWa = (o: Order, texto = '') =>
  `https://wa.me/${telefonoWa(o.customerPhone)}${texto ? `?text=${encodeURIComponent(texto)}` : ''}`;
