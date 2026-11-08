'use client';
import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import type { Product } from '@fredys/types';
import { formatPrice, imgSrc } from '@/lib/utils';
import { useCart } from '@/lib/cart-store';
import { IconoMas } from '@/components/fredys/Piezas';
import { volarAlCarrito } from '@/lib/motion';
import { useSugerencia } from '@/lib/sugerencia';
import { useElegirTamano } from '@/lib/elegir-tamano';

/** Renglón compacto del menú: foto chica, nombre, descripción y "+".
 *  Con un solo precio, el "+" suma al pedido; con varios tamaños, abre la hoja "Elegí el tamaño" (sin salir del menú). */
export function ProductCard({ product }: { product: Product }) {
  const addItem = useCart((s) => s.addItem);
  const ofrecer = useSugerencia((s) => s.ofrecer);
  const abrirTamanos = useElegirTamano((s) => s.abrir);
  const [fotoRota, setFotoRota] = useState(false);
  const precios = [...product.prices].sort((a, b) => a.order - b.order);
  const base = precios[0];
  const variosTamanos = precios.length > 1;
  const href = `/producto/${product.slug}`;

  const sumar = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!base) return;
    addItem({
      productId: product.id, productSlug: product.slug, name: product.name,
      image: product.images[0] ?? '', priceLabel: base.label, price: base.price, quantity: 1,
    }, false, 'menu');
    volarAlCarrito(e.currentTarget);
    ofrecer(product.id); // si es una burger, ofrece papas/dip/bebida
  };

  return (
    <article className="group flex items-center gap-4 border-b border-[var(--line)] py-4 last:border-0">
      <Link href={href} className="relative h-[88px] w-[88px] flex-shrink-0 overflow-hidden rounded-[var(--r-md)] bg-dark-300">
        {!fotoRota ? (
          <Image src={imgSrc(product.images[0], 'sm')} alt={product.name} fill sizes="88px" onError={() => setFotoRota(true)}
            className="object-cover transition-transform duration-700 group-hover:scale-110" />
        ) : (
          <span className="absolute inset-0 grid place-items-center font-display text-2xl text-cuero">F</span>
        )}
      </Link>
      <div className="min-w-0 flex-1">
        <Link href={href} className="block">
          <h3 className="font-semibold leading-snug">{product.name}</h3>
          {product.description && <p className="mt-0.5 line-clamp-2 text-sm leading-snug text-apagado">{product.description}</p>}
        </Link>
        <p className="mt-1.5 font-extrabold text-brand">
          {variosTamanos && <span className="mr-1 text-xs font-normal text-apagado">desde</span>}
          {base ? formatPrice(base.price) : '—'}
        </p>
      </div>
      {variosTamanos ? (
        <button type="button" onClick={() => abrirTamanos(product)} className="btn-mas" aria-label={`Elegir tamaño de ${product.name}`} aria-haspopup="dialog" disabled={!product.available}><IconoMas /></button>
      ) : (
        <button type="button" onClick={sumar} className="btn-mas" aria-label={`Sumar ${product.name} al pedido`} disabled={!product.available}><IconoMas /></button>
      )}
    </article>
  );
}
