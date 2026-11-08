import Link from 'next/link';
import type { Metadata } from 'next';
import { Parrilla } from '@/components/fredys/Piezas';

export const metadata: Metadata = { title: 'Página no encontrada' };

export default function NotFound() {
  return (
    <div className="cuadrille relative flex min-h-screen flex-col items-center justify-center overflow-clip px-[var(--gutter)] text-center">
      <Parrilla id="plato-404" className="pointer-events-none absolute left-1/2 top-1/2 h-[min(90vw,560px)] w-[min(90vw,560px)] -translate-x-1/2 -translate-y-1/2 opacity-50" />
      <div className="relative">
        <p className="titulo sticker text-[clamp(7rem,40vw,14rem)] leading-none">404</p>
        <h1 className="titulo mt-4 text-[clamp(2rem,8vw,3.2rem)]">Esta página se quemó en la plancha</h1>
        <p className="mx-auto mt-3 max-w-xs text-apagado">La dirección que buscás no existe o se movió. Las burgers siguen esperándote.</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/#menu" className="btn-fredys">Armá tu pedido</Link>
          <Link href="/" className="btn-borde">Volver al inicio</Link>
        </div>
      </div>
    </div>
  );
}
