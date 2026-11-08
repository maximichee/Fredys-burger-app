'use client';
import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence, type PanInfo } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCart } from '@/lib/cart-store';
import { useElegirTamano } from '@/lib/elegir-tamano';
import { useSugerencia } from '@/lib/sugerencia';
import { formatPrice, imgSrc } from '@/lib/utils';
import { volarAlCarrito, getLenis, prefersReducedMotion } from '@/lib/motion';
import { medir } from '@/lib/medir';

/* Hoja "Elegí el tamaño": sube desde abajo (en computadora, ventana centrada).
   Tamaño + cantidad + "Sumar al pedido", sin salir del menú. Se cierra tocando afuera, con ✕, Escape o arrastrando hacia abajo. */
export function ElegirTamano() {
  const { producto, cerrar } = useElegirTamano();
  const addItem = useCart((s) => s.addItem);
  const ofrecer = useSugerencia((s) => s.ofrecer);
  const pathname = usePathname();
  const [sel, setSel] = useState(0);
  const [cant, setCant] = useState(1);
  const primerTamano = useRef<HTMLButtonElement>(null);

  const precios = producto ? [...producto.prices].sort((a, b) => a.order - b.order) : [];
  const elegido = precios[sel];

  // Al abrir: arranca en el primer tamaño, frena el scroll suave y enfoca el primer tamaño
  useEffect(() => {
    if (!producto) return;
    setSel(0); setCant(1);
    medir('select_item', { item_list_name: 'menu', items: [{ item_id: producto.slug, item_name: producto.name }] });
    const lenis = getLenis();
    lenis?.stop();
    const t = setTimeout(() => primerTamano.current?.focus({ preventScroll: true }), 350);
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') cerrar(); };
    window.addEventListener('keydown', esc);
    return () => { clearTimeout(t); window.removeEventListener('keydown', esc); lenis?.start(); };
  }, [producto, cerrar]);

  useEffect(() => { cerrar(); }, [pathname, cerrar]);

  const sumar = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!producto || !elegido) return;
    addItem({
      productId: producto.id, productSlug: producto.slug, name: producto.name, image: producto.images[0] ?? '',
      priceLabel: elegido.label, price: elegido.price, quantity: cant,
    }, false, 'hoja');
    volarAlCarrito(e.currentTarget);
    const id = producto.id;
    cerrar();
    setTimeout(() => ofrecer(id), 450); // la sugerencia de papas/bebida entra cuando la hoja ya bajó
  };

  const alSoltar = (_: unknown, info: PanInfo) => { if (info.offset.y > 110 || info.velocity.y > 600) cerrar(); };
  const reducir = typeof window !== 'undefined' && prefersReducedMotion();

  return (
    <AnimatePresence>
      {producto && (
        <>
          <motion.div key="fondo" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm" onClick={cerrar} />
          <div key="caja" className="pointer-events-none fixed inset-0 z-50 flex items-end justify-center md:items-center md:p-6">
          <motion.div
            role="dialog" aria-modal="true" aria-label={`Elegí el tamaño de ${producto.name}`}
            initial={reducir ? { opacity: 0 } : { y: '100%' }} animate={reducir ? { opacity: 1 } : { y: 0 }} exit={reducir ? { opacity: 0 } : { y: '100%' }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            drag="y" dragConstraints={{ top: 0, bottom: 0 }} dragElastic={{ top: 0, bottom: 0.6 }} onDragEnd={alSoltar}
            className="cuadrille pointer-events-auto relative max-h-[88svh] w-full overflow-y-auto rounded-t-[var(--r-xl)] border-t border-[var(--line)] bg-dark-100 px-[var(--gutter)] pb-[max(16px,env(safe-area-inset-bottom))] pt-3 shadow-2xl md:w-[460px] md:rounded-[var(--r-xl)] md:border md:p-6"
            data-lenis-prevent
          >
            {/* Manija para arrastrar (celular) */}
            <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-crema/25 md:hidden" aria-hidden="true" />

            <div className="flex items-start gap-4">
              <span className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-[var(--r-md)] bg-dark-300">
                <Image src={imgSrc(producto.images[0], 'sm')} alt="" fill sizes="80px" className="object-cover" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="titulo text-[1.9rem] leading-[.95]">{producto.name}</p>
                {producto.description && <p className="mt-1 line-clamp-2 text-sm text-apagado">{producto.description}</p>}
              </div>
              <button type="button" onClick={cerrar} aria-label="Cerrar" className="-mr-2 -mt-1 grid h-11 w-11 flex-shrink-0 place-items-center rounded-full text-apagado transition-colors hover:text-crema">✕</button>
            </div>

            <fieldset className="mt-5">
              <legend className="mb-2.5 text-sm font-semibold uppercase tracking-[.14em] text-brand">Tamaño</legend>
              <div className="grid grid-cols-2 gap-2 min-[400px]:grid-cols-3">
                {precios.map((p, i) => (
                  <button key={p.id} ref={i === 0 ? primerTamano : undefined} type="button" onClick={() => setSel(i)} aria-pressed={sel === i}
                    className="ficha flex-col !items-start !justify-center gap-0.5">
                    <span className="text-sm font-semibold capitalize">{p.label}</span>
                    <span className="font-extrabold text-brand">{formatPrice(p.price)}</span>
                  </button>
                ))}
              </div>
            </fieldset>

            <div className="mt-5 flex items-center justify-between gap-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-[var(--line)] p-1">
                <button type="button" onClick={() => setCant(Math.max(1, cant - 1))} aria-label="Una menos"
                  className="grid h-11 w-11 place-items-center rounded-full bg-dark-300 text-xl font-bold transition-colors hover:bg-brand/25">−</button>
                <span className="w-7 text-center text-lg font-extrabold" aria-live="polite">{cant}</span>
                <button type="button" onClick={() => setCant(cant + 1)} aria-label="Una más"
                  className="grid h-11 w-11 place-items-center rounded-full bg-dark-300 text-xl font-bold transition-colors hover:bg-brand/25">+</button>
              </div>
              <Link href={`/producto/${producto.slug}`} onClick={cerrar} className="min-h-[44px] content-center text-sm font-semibold text-apagado underline-offset-4 transition-colors hover:text-crema hover:underline">
                Ver fotos y detalle
              </Link>
            </div>

            <button type="button" onClick={sumar} disabled={!elegido} className="btn-fredys mt-5 w-full justify-between">
              <span>Sumar al pedido</span>
              <span>{elegido ? formatPrice(elegido.price * cant) : ''}</span>
            </button>
          </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
