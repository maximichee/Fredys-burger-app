'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import type { Category, Product } from '@fredys/types';
import { getCategories, getProducts } from '@/lib/api';
import { useCart } from '@/lib/cart-store';
import { useSugerencia } from '@/lib/sugerencia';
import { formatPrice, imgSrc } from '@/lib/utils';
import { volarAlCarrito } from '@/lib/motion';
import { medir } from '@/lib/medir';
import { IconoMas } from './Piezas';

/* "¿Le sumás algo?": aparece al sumar una burger y ofrece una opción de papas, de dip y de bebida
   (lo que todavía no está en el pedido). Se suma con un toque y se cierra sola a los 10 s si no la tocás.
   "Ver más opciones" abre todas las papas, dips y bebidas en filas que se deslizan (ahí no se cierra sola). */

const EXTRAS = [
  { cat: 'papas', titulo: 'Papas', prefer: /cheddar/i, evitar: /bacon/i },
  { cat: 'salsas', titulo: 'Dips y salsas', prefer: /dip/i, evitar: null },
  { cat: 'bebidas', titulo: 'Bebidas', prefer: /lata/i, evitar: null },
] as const;
const ESPERA_MS = 10000;

type Menu = { cats: Category[]; prods: Product[] };
let menuCache: Promise<Menu> | null = null;
const cargarMenu = () => (menuCache ??= Promise.all([getCategories(), getProducts()]).then(([cats, prods]) => ({ cats, prods }))
  .catch((e) => { menuCache = null; throw e; }));

export function Sugerencia() {
  const { para, vez, cerrar, noGracias } = useSugerencia();
  const items = useCart((s) => s.items);
  const addItem = useCart((s) => s.addItem);
  const carritoAbierto = useCart((s) => s.isOpen);
  const pathname = usePathname();
  const [menu, setMenu] = useState<Menu | null>(null);
  const [sumadas, setSumadas] = useState<string[]>([]);
  const [todas, setTodas] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => { if (para) cargarMenu().then(setMenu).catch(() => cerrar()); }, [para, cerrar]);

  // Cada oferta nueva arranca de cero
  useEffect(() => { setSumadas([]); setTodas(false); }, [vez]);

  // Se cierra al cambiar de página o al abrir el carrito
  useEffect(() => { cerrar(); }, [pathname, cerrar]);
  useEffect(() => { if (carritoAbierto) cerrar(); }, [carritoAbierto, cerrar]);

  // Qué ofrecer: solo después de una burger (no de un extra) y solo lo que falta en el pedido
  const ofertas = useMemo(() => {
    if (!menu || !para) return [];
    const catId = (slug: string) => menu.cats.find((c) => c.slug === slug)?.id;
    const idsExtras = new Set(EXTRAS.map((e) => catId(e.cat)).filter(Boolean));
    const recien = menu.prods.find((p) => p.id === para);
    if (!recien || idsExtras.has(recien.categoryId)) return [];
    const enCarrito = new Set(items.map((i) => i.productId));
    return EXTRAS.flatMap((e) => {
      const lista = menu.prods.filter((p) => p.categoryId === catId(e.cat) && p.available && p.prices.length);
      if (!lista.length || lista.some((p) => enCarrito.has(p.id))) return [];
      const elegido = lista.find((p) => e.prefer.test(p.name) && !(e.evitar && e.evitar.test(p.name))) ?? lista[0];
      return [elegido];
    });
    // Se calcula al abrir: lo que se suma desde acá queda con su ✓ hasta cerrar
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [menu, para, vez]);

  // Todas las opciones de cada grupo, para "Ver más opciones"
  const catalogo = useMemo(() => {
    if (!menu) return [];
    return EXTRAS.map((e) => {
      const id = menu.cats.find((c) => c.slug === e.cat)?.id;
      return { titulo: e.titulo, prods: menu.prods.filter((p) => p.categoryId === id && p.available && p.prices.length) };
    }).filter((g) => g.prods.length);
  }, [menu]);

  const abierta = !!para && ofertas.length > 0;
  useEffect(() => { if (abierta) medir('sugerencia_vista', { opciones: ofertas.map((o) => o.slug).join(',') }); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [abierta, vez]);
  const precioDe = (p: Product) => [...p.prices].sort((a, b) => a.order - b.order)[0];
  const veces = (id: string) => sumadas.filter((x) => x === id).length;

  const programarCierre = () => { clearTimeout(timer.current); timer.current = setTimeout(cerrar, ESPERA_MS); };
  const pausar = () => clearTimeout(timer.current);
  useEffect(() => { if (abierta) programarCierre(); return pausar; /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [abierta, vez]);

  // Si no hay nada para ofrecer, se libera el estado
  useEffect(() => { if (para && menu && ofertas.length === 0) cerrar(); }, [para, menu, ofertas.length, cerrar]);

  const sumar = (p: Product, e: React.MouseEvent<HTMLButtonElement>) => {
    const precio = precioDe(p);
    addItem({ productId: p.id, productSlug: p.slug, name: p.name, image: p.images[0] ?? '', priceLabel: precio.label, price: precio.price, quantity: 1 }, false, 'sugerencia');
    volarAlCarrito(e.currentTarget);
    const nuevas = [...sumadas, p.id];
    setSumadas(nuevas);
    if (todas) return; // con todas las opciones abiertas, se cierra a mano
    if (ofertas.every((o) => nuevas.includes(o.id))) { pausar(); setTimeout(cerrar, 900); } else programarCierre();
  };

  return (
    <AnimatePresence>
      {abierta && (
        <motion.div
          key={vez}
          role="dialog" aria-label="¿Le sumás algo?"
          initial={{ y: 40, opacity: 0, scale: 0.96 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ y: 30, opacity: 0, transition: { duration: 0.25 } }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          onPointerEnter={pausar} onPointerDown={pausar} onFocus={pausar} onPointerLeave={() => { if (!todas) programarCierre(); }}
          className="vidrio fixed inset-x-3 bottom-[calc(84px+env(safe-area-inset-bottom))] z-[45] rounded-[var(--r-lg)] bg-dark-100/80 p-4 md:inset-x-auto md:bottom-6 md:right-6 md:w-[380px]"
        >
          <div className="mb-2 flex items-start justify-between gap-3">
            <p className="titulo text-[1.7rem] leading-none">¿Le sumás algo?</p>
            <button type="button" onClick={cerrar} aria-label="Cerrar" className="-mr-2 -mt-2 grid h-11 w-11 place-items-center rounded-full text-apagado transition-colors hover:text-crema">✕</button>
          </div>
          {!todas ? (
          <ul className="divide-y divide-[var(--line)]">
            {ofertas.map((p) => {
              const precio = precioDe(p);
              const lista = sumadas.includes(p.id);
              return (
                <li key={p.id} className="flex items-center gap-3 py-2">
                  <span className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-[var(--r-sm)] bg-dark-300">
                    <Image src={imgSrc(p.images[0], 'sm')} alt="" fill sizes="48px" className="object-cover" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold">{p.name}</span>
                    <span className="text-sm font-extrabold text-brand">{formatPrice(precio.price)}</span>
                  </span>
                  {lista ? (
                    <span className="grid h-11 min-w-[44px] place-items-center px-2 text-sm font-bold text-cheddar" aria-live="polite">✓ Sumada</span>
                  ) : (
                    <button type="button" onClick={(e) => sumar(p, e)} className="btn-mas" aria-label={`Sumar ${p.name} al pedido`}><IconoMas /></button>
                  )}
                </li>
              );
            })}
          </ul>
          ) : (
            <div className="-mx-4 max-h-[min(40vh,380px)] space-y-4 overflow-y-auto px-4 pb-1 pt-1" data-lenis-prevent>
              {catalogo.map((g) => (
                <section key={g.titulo} aria-label={g.titulo}>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-[.14em] text-brand">{g.titulo}</p>
                  <ul className="no-scrollbar -mx-4 flex snap-x gap-2.5 overflow-x-auto px-4 pb-1">
                    {g.prods.map((p) => {
                      const n = veces(p.id);
                      return (
                        <li key={p.id} className="w-[112px] flex-shrink-0 snap-start">
                          <button type="button" onClick={(e) => sumar(p, e)} aria-label={`Sumar ${p.name} al pedido${n ? `, ya sumaste ${n}` : ''}`}
                            className="group block w-full text-left">
                            <span className={`relative block aspect-[4/3] overflow-hidden rounded-[var(--r-sm)] bg-dark-300 ring-2 transition-shadow ${n ? 'ring-cheddar' : 'ring-transparent'}`}>
                              <Image src={imgSrc(p.images[0], 'sm')} alt="" fill sizes="112px" className="object-cover transition-transform duration-500 group-hover:scale-110" />
                              <span className={`absolute bottom-1.5 right-1.5 grid h-7 min-w-7 place-items-center rounded-full px-1.5 text-xs font-extrabold shadow-[0_2px_0_var(--choco)] ${n ? 'bg-cheddar text-tinta' : 'bg-brand text-tinta'}`} aria-hidden="true">
                                {n ? `✓ ${n}` : '+'}
                              </span>
                            </span>
                            <span className="mt-1.5 line-clamp-2 block text-xs font-semibold leading-snug">{p.name}</span>
                            <span className="block text-xs font-extrabold text-brand">{formatPrice(precioDe(p).price)}</span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </section>
              ))}
            </div>
          )}
          <button type="button" onClick={() => { pausar(); setTodas((t) => !t); }} aria-expanded={todas}
            className="mt-2 flex min-h-[44px] w-full items-center justify-center gap-2 rounded-full border border-[var(--line)] text-sm font-semibold text-crema transition-colors hover:border-brand/50">
            {todas ? 'Ver menos' : 'Ver más opciones'}
            <span className={`transition-transform duration-300 ${todas ? 'rotate-180' : ''}`} aria-hidden="true">▾</span>
          </button>
          {/* Si ya sumó algo desde acá, es "Listo" (cerrar) y no "No, gracias" (que apaga la sugerencia en la visita) */}
          <button type="button" onClick={sumadas.length ? cerrar : () => { medir('sugerencia_no_gracias'); noGracias(); }} className="mt-1 min-h-[44px] w-full text-sm font-semibold text-apagado underline-offset-4 transition-colors hover:text-crema hover:underline">
            {sumadas.length ? 'Listo' : 'No, gracias'}
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
