import type { CartItem } from '@fredys/types';

/* Medición de ventas con Google Analytics 4 (eventos de comercio recomendados, así GA arma solo el embudo):
   view_item → add_to_cart → view_cart → begin_checkout → purchase (= pedido enviado por WhatsApp).
   Se activa solo si existe NEXT_PUBLIC_GA_ID. Sin esa variable no se manda nada (en desarrollo se ve en la consola).
   No se mandan nombres, teléfonos ni direcciones: solo productos, montos y de dónde vino el clic. */

declare global {
  interface Window { gtag?: (...args: unknown[]) => void; dataLayer?: unknown[] }
}

export const GA_ID = process.env.NEXT_PUBLIC_GA_ID ?? '';

export type Origen = 'menu' | 'hoja' | 'ficha' | 'sugerencia' | 'repetir';

export function medir(evento: string, datos: Record<string, unknown> = {}) {
  if (typeof window === 'undefined') return;
  if (process.env.NODE_ENV !== 'production') console.debug('[medir]', evento, datos);
  window.gtag?.('event', evento, datos);
}

/** Producto del carrito en el formato de GA4 */
export const itemGA = (i: CartItem) => ({
  item_id: i.productSlug,
  item_name: i.name,
  item_variant: i.priceLabel,
  price: i.price,
  quantity: i.quantity,
});

/** Evento de comercio con moneda, valor e ítems */
export function medirItems(evento: string, items: CartItem[], extra: Record<string, unknown> = {}) {
  medir(evento, {
    currency: 'ARS',
    value: items.reduce((s, i) => s + i.price * i.quantity, 0),
    items: items.map(itemGA),
    ...extra,
  });
}
