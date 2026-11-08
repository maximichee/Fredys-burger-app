'use client';
import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { useCart } from '@/lib/cart-store';
import { CartDrawer } from './cart/CartDrawer';
import { Sugerencia } from './fredys/Sugerencia';
import { ElegirTamano } from './fredys/ElegirTamano';
import { BotonInstalar } from './fredys/App';
import { ClosedBanner } from './ClosedBanner';
import { waLink } from '@/lib/utils';

const LINKS = [
  { href: '/#menu', label: 'Menú' },
  { href: '/#como-pedir', label: 'Cómo pedir' },
  { href: '/nosotros', label: 'Nosotros' },
  { href: '/contacto', label: 'Contacto' },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const totalItems = useCart((s) => s.totalItems());
  const openCart = useCart((s) => s.openCart);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 40);
    handler();
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  // Publica el alto real del menú (cambia con el aviso de cerrado) para que cada página deje ese espacio arriba
  const headerRef = useRef<HTMLElement>(null);
  useEffect(() => {
    const el = headerRef.current;
    if (!el) return;
    const set = () => { if (window.scrollY < 40) document.documentElement.style.setProperty('--nav-h', `${el.offsetHeight}px`); };
    set();
    const ro = new ResizeObserver(set);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setMenuOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [menuOpen]);

  return (
    <>
      <header
        ref={headerRef}
        className={`fixed inset-x-0 top-0 z-50 transition-[background,padding,box-shadow] duration-300 ${
          scrolled ? 'bg-dark/90 py-2 shadow-[0_10px_30px_-10px_rgba(0,0,0,.8)] backdrop-blur-md' : 'bg-transparent py-3.5'
        }`}
      >
        {!scrolled && <ClosedBanner />}
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-[var(--gutter)]">
          <Link href="/" aria-label="Fredy's Burger, inicio" className="flex-shrink-0">
            <Image src="/logo.png" alt="Fredy's Burger" width={150} height={150} priority
              className={`w-auto object-contain transition-[height] duration-300 ${scrolled ? 'h-12' : 'h-16 lg:h-[72px]'}`} />
          </Link>

          <nav className="hidden items-center gap-7 md:flex" aria-label="Principal">
            {LINKS.map((l) => (
              <Link key={l.href} href={l.href} className="text-sm font-semibold text-crema/80 transition-colors hover:text-brand">{l.label}</Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <button onClick={openCart} data-cart-icon className="vidrio relative grid h-12 w-12 place-items-center rounded-full" aria-label={`Ver tu pedido${totalItems ? `, ${totalItems} productos` : ''}`}>
              <svg className="h-[22px] w-[22px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M3 4h2.2l2.1 11.2a2 2 0 0 0 2 1.6h7.9a2 2 0 0 0 2-1.5L21 8H6.1" /><circle cx="10" cy="20.5" r="1.2" /><circle cx="17.5" cy="20.5" r="1.2" />
              </svg>
              {totalItems > 0 && (
                <motion.span key={totalItems} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 500, damping: 14 }}
                  className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-brand px-1 text-xs font-extrabold text-tinta">
                  {totalItems}
                </motion.span>
              )}
            </button>
            <button onClick={() => setMenuOpen(true)} className="grid h-12 w-12 place-items-center rounded-full md:hidden" aria-label="Abrir menú" aria-expanded={menuOpen}>
              <span className="flex flex-col gap-1.5" aria-hidden="true">
                <span className="block h-0.5 w-6 rounded bg-crema" /><span className="block h-0.5 w-6 rounded bg-crema" /><span className="block h-0.5 w-4 self-end rounded bg-brand" />
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* Menú del celular: entra de la derecha como una cortina de carbón con el cuadrillé */}
      <AnimatePresence>
        {menuOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm" onClick={() => setMenuOpen(false)} />
            <motion.nav
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ duration: 0.55, ease: [0.76, 0, 0.24, 1] }}
              className="cuadrille fixed bottom-0 right-0 top-0 z-50 flex w-[86vw] max-w-sm flex-col bg-dark-100 shadow-2xl"
              aria-label="Menú" data-lenis-prevent
            >
              <div className="flex items-center justify-between p-5">
                <Image src="/logo.png" alt="Fredy's Burger" width={150} height={150} className="h-14 w-auto" />
                <button onClick={() => setMenuOpen(false)} className="grid h-12 w-12 place-items-center rounded-full text-2xl text-apagado hover:text-crema" aria-label="Cerrar menú">✕</button>
              </div>
              <div className="flex flex-col px-5">
                {LINKS.map((l, i) => (
                  <motion.div key={l.href} initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 + i * 0.05, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}>
                    <Link href={l.href} onClick={() => setMenuOpen(false)}
                      className="titulo block border-b border-[var(--line)] py-4 text-4xl transition-colors hover:text-brand">{l.label}</Link>
                  </motion.div>
                ))}
              </div>
              <div className="mt-auto space-y-4 p-5">
                <BotonInstalar />
                <Link href="/#menu" onClick={() => setMenuOpen(false)} className="btn-fredys w-full">Armá tu pedido</Link>
                <a href={waLink("Hola Fredy's, quiero hacer una consulta sobre un pedido.")} target="_blank" rel="noopener noreferrer" className="btn-borde w-full">Consultas por WhatsApp</a>
                <p className="text-center text-sm text-apagado">Martes a domingo · 19:30 a 23:30 · Santa Fe</p>
              </div>
            </motion.nav>
          </>
        )}
      </AnimatePresence>

      <CartDrawer />
      <Sugerencia />
      <ElegirTamano />
    </>
  );
}
