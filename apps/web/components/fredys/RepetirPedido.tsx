'use client';
import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import type { CartItem, Product } from '@fredys/types';
import { useCart } from '@/lib/cart-store';
import { leerUltimoPedido, type UltimoPedido } from '@/lib/ultimo-pedido';
import { formatPrice, imgSrc } from '@/lib/utils';
import { medir } from '@/lib/medir';
import { IconoFlecha } from './Piezas';

/* "¿Lo mismo que la otra vez?": arriba del menú, si el cliente ya pidió desde este teléfono.
   Se arma con los precios y la disponibilidad de hoy (no los guardados). Con ✕ se oculta en la visita. */

const OCULTO = 'fredys-ocultar-repetir';

const haceCuanto = (fecha: number) => {
  const dias = Math.floor((Date.now() - fecha) / 86400000);
  if (dias <= 0) return 'hoy';
  if (dias === 1) return 'ayer';
  if (dias < 7) return `hace ${dias} días`;
  if (dias < 14) return 'hace una semana';
  return `hace ${Math.floor(dias / 7)} semanas`;
};

export function RepetirPedido({ products }: { products: Product[] }) {
  const addItem = useCart((s) => s.addItem);
  const openCart = useCart((s) => s.openCart);
  const [ultimo, setUltimo] = useState<UltimoPedido | null>(null);

  useEffect(() => {
    try { if (sessionStorage.getItem(OCULTO)) return; } catch { /* sin almacenamiento */ }
    setUltimo(leerUltimoPedido());
  }, []);

  // Precios de hoy; lo que ya no está (o cambió de tamaño) se deja afuera
  const { listos, faltan } = useMemo(() => {
    const listos: CartItem[] = [];
    let faltan = 0;
    for (const it of ultimo?.items ?? []) {
      const p = products.find((x) => x.id === it.productId && x.slug === it.productSlug) ?? products.find((x) => x.slug === it.productSlug);
      const precio = p?.available ? p.prices.find((x) => x.label === it.priceLabel) : undefined;
      if (!p || !precio) { faltan++; continue; }
      listos.push({ ...it, productId: p.id, productSlug: p.slug, name: p.name, image: p.images[0] ?? '', price: precio.price });
    }
    return { listos, faltan };
  }, [ultimo, products]);

  if (!ultimo || !listos.length) return null;

  const total = listos.reduce((s, i) => s + i.price * i.quantity, 0);
  const resumen = listos.map((i) => `${i.quantity > 1 ? `${i.quantity}× ` : ''}${i.name}${i.priceLabel && !['único', 'dip', 'lata', 'botella', 'promo'].includes(i.priceLabel) ? ` (${i.priceLabel})` : ''}`).join(', ');

  const repetir = () => {
    listos.forEach((i) => addItem(i, false, 'repetir'));
    medir('repetir_pedido', { productos: listos.length, faltaban: faltan });
    setUltimo(null);
    openCart();
  };
  const ocultar = () => {
    try { sessionStorage.setItem(OCULTO, '1'); } catch { /* sin almacenamiento */ }
    setUltimo(null);
  };

  return (
    <aside className="vidrio relative mb-6 mt-4 rounded-[var(--r-lg)] p-4 sm:flex sm:items-center sm:gap-5 sm:p-5" aria-label="Tu último pedido">
      <button type="button" onClick={ocultar} aria-label="Ocultar" className="absolute right-1 top-1 grid h-11 w-11 place-items-center rounded-full text-apagado transition-colors hover:text-crema">✕</button>
      {/* Celular: fotos + fecha arriba y el título a lo ancho. Computadora: todo en una fila */}
      <div className="sm:flex sm:min-w-0 sm:flex-1 sm:items-center sm:gap-4">
        <div className="flex items-center gap-3 pr-10 sm:pr-0">
          {/* Fotos apiladas del pedido */}
          <div className="flex flex-shrink-0 -space-x-3" aria-hidden="true">
            {listos.slice(0, 3).map((i, k) => (
              <span key={k} className="relative h-11 w-11 overflow-hidden rounded-full bg-dark-300 ring-2 ring-[var(--bg)] sm:h-14 sm:w-14" style={{ zIndex: 3 - k }}>
                <Image src={imgSrc(i.image, 'sm')} alt="" fill sizes="56px" className="object-cover" />
              </span>
            ))}
          </div>
          <p className="text-xs font-semibold uppercase tracking-[.14em] text-brand sm:hidden">Tu pedido de {haceCuanto(ultimo.fecha)}</p>
        </div>
        <div className="mt-3 min-w-0 sm:mt-0 sm:pr-8">
          <p className="hidden text-xs font-semibold uppercase tracking-[.14em] text-brand sm:block">Tu pedido de {haceCuanto(ultimo.fecha)}</p>
          <p className="titulo mt-0.5 text-[1.75rem] leading-none">¿Lo mismo que la otra vez?</p>
          <p className="mt-1 line-clamp-2 text-sm text-apagado">{resumen}</p>
          {faltan > 0 && <p className="mt-1 text-xs text-apagado">{faltan === 1 ? '1 producto ya no está' : `${faltan} productos ya no están`} en el menú.</p>}
        </div>
      </div>
      <button type="button" onClick={repetir} className="btn-fredys mt-4 w-full justify-between sm:mt-0 sm:w-auto sm:flex-shrink-0">
        <span>Repetir pedido</span>
        <span className="flex items-center gap-2">{formatPrice(total)} <IconoFlecha /></span>
      </button>
    </aside>
  );
}
