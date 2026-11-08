'use client';
import { useState } from 'react';
import Image from 'next/image';
import { imgSrc } from '@/lib/utils';

/** Foto de producto (sin foto: la de promo, vía imgSrc). Si aun así falla la carga, muestra la F de la marca. */
export function FotoProducto({ src, alt, sizes, className = '' }: { src?: string; alt: string; sizes: string; className?: string }) {
  const [rota, setRota] = useState(false);
  if (rota) {
    return <span className="absolute inset-0 grid place-items-center bg-dark-300 font-display text-6xl text-cuero" aria-label={alt} role="img">F</span>;
  }
  return <Image src={imgSrc(src)} alt={alt} fill sizes={sizes} onError={() => setRota(true)} className={className} />;
}
