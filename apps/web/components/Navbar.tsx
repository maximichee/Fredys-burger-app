'use client';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { useCart } from '@/lib/cart-store';
import { CartDrawer } from './cart/CartDrawer';
import { isOpen } from '@/lib/utils';

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const totalItems = useCart((s) => s.totalItems());
  const openCart   = useCart((s) => s.openCart);
  const storeOpen  = isOpen();

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  return (
    <>
      <motion.header
        className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
          scrolled ? 'bg-dark/95 backdrop-blur-md shadow-lg shadow-black/30 py-2' : 'bg-dark/80 backdrop-blur-sm py-4'
        }`}
        initial={{ y: -80 }} animate={{ y: 0 }} transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        <div className="max-w-6xl mx-auto px-4 flex items-center justify-between">
          {/* Hamburger */}
          <button
            onClick={() => setMenuOpen(true)}
            className="flex flex-col gap-1.5 p-2 rounded-lg hover:bg-white/5 transition-colors"
            aria-label="Abrir menú"
          >
            <span className="block w-5 h-0.5 bg-white rounded" />
            <span className="block w-5 h-0.5 bg-white rounded" />
            <span className="block w-5 h-0.5 bg-white rounded" />
          </button>

          {/* Logo */}
          <Link href="/" className="absolute left-1/2 -translate-x-1/2">
            <Image
              src="/logo.png" alt="Fredys Burger"
              width={scrolled ? 40 : 56} height={scrolled ? 40 : 56}
              className="transition-all duration-300 object-contain"
              priority
            />
          </Link>

          {/* Carrito */}
          <button
            onClick={openCart}
            className="relative p-2 rounded-lg hover:bg-white/5 transition-colors"
            aria-label="Ver carrito"
          >
            {storeOpen ? (
              <>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                {totalItems > 0 && (
                  <motion.span
                    key={totalItems}
                    initial={{ scale: 0 }} animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1 bg-brand text-black text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center"
                  >
                    {totalItems}
                  </motion.span>
                )}
              </>
            ) : (
              <span className="text-xs font-bold text-red-400 border border-red-400/30 rounded-full px-3 py-1">Cerrado</span>
            )}
          </button>
        </div>
      </motion.header>

      {/* Side menu */}
      <AnimatePresence>
        {menuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/70 z-50 backdrop-blur-sm"
              onClick={() => setMenuOpen(false)}
            />
            <motion.nav
              initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 35 }}
              className="fixed left-0 top-0 bottom-0 w-72 bg-dark-100 z-50 flex flex-col shadow-2xl"
            >
              <div className="flex items-center justify-between p-6 border-b border-white/5">
                <Image src="/logo.png" alt="Fredys" width={48} height={48} className="object-contain" />
                <button onClick={() => setMenuOpen(false)} className="p-2 text-white/50 hover:text-white transition-colors">✕</button>
              </div>
              <div className="flex flex-col p-4 gap-1">
                {[
                  { href: '/', label: 'Inicio' },
                  { href: '/#menu', label: 'Menú' },
                  { href: '/nosotros', label: 'Nosotros' },
                  { href: '/contacto', label: 'Contacto' },
                ].map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMenuOpen(false)}
                    className="px-4 py-3 rounded-xl text-white/80 font-semibold hover:bg-white/5 hover:text-brand transition-all"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
              <div className="mt-auto p-6 border-t border-white/5 text-sm text-white/40 space-y-1">
                <p>⏰ Mar–Dom · 19:30–23:30hs</p>
                <p>📍 Santa Fe, Argentina</p>
              </div>
            </motion.nav>
          </>
        )}
      </AnimatePresence>

      <CartDrawer />
    </>
  );
}
