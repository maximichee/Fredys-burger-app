'use client';
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

const SLIDES = [
  { image: '/img/logo-slide.png',  title: 'Las mejores hamburguesas de Santa Fe',  cta: 'Ver Menú',     href: '#menu' },
  { image: '/img/burger 1.png',    title: 'Burgers artesanales reales',             cta: 'Ordenar ahora', href: '/carrito' },
  { image: '/img/burger 2.png',    title: 'Sabor intenso en cada mordida',          cta: 'Ver Menú',     href: '#menu' },
  { image: '/img/burger 3.png',    title: 'Ingredientes frescos todos los días',    cta: 'Pedí ahora',   href: '/carrito' },
  { image: '/img/burger 4.png',    title: 'La experiencia burger definitiva',       cta: 'Ordenar ya',   href: '/carrito' },
];

export function HeroSlider() {
  const [index, setIndex] = useState(0);
  const [touchStart, setTouchStart] = useState(0);

  const next = useCallback(() => setIndex((i) => (i + 1) % SLIDES.length), []);
  const prev = useCallback(() => setIndex((i) => (i - 1 + SLIDES.length) % SLIDES.length), []);

  useEffect(() => {
    const id = setInterval(next, 4000);
    return () => clearInterval(id);
  }, [next]);

  return (
    <section
      className="relative h-[55vh] min-h-[380px] overflow-hidden bg-dark-300"
      onTouchStart={(e) => setTouchStart(e.touches[0].clientX)}
      onTouchEnd={(e) => {
        const diff = touchStart - e.changedTouches[0].clientX;
        if (Math.abs(diff) > 50) diff > 0 ? next() : prev();
      }}
    >
      {/* Slides */}
      <AnimatePresence mode="sync">
        <motion.div
          key={index}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6 }}
          className="absolute inset-0"
        >
          <img
            src={SLIDES[index].image}
            alt={SLIDES[index].title}
            className="w-full h-full object-cover object-center"
          />
        </motion.div>
      </AnimatePresence>

      {/* Overlay degradado */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/40 to-dark" />

      {/* Texto */}
      <div className="absolute inset-0 flex flex-col justify-end px-6 pb-12 z-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.4 }}
          >
            <h1 className="text-3xl sm:text-5xl font-extrabold leading-tight text-white text-balance max-w-lg">
              {SLIDES[index].title}
            </h1>
            <Link
              href={SLIDES[index].href}
              className="mt-4 inline-block bg-brand text-black font-bold px-6 py-3 rounded-full hover:bg-brand-strong transition-colors"
            >
              {SLIDES[index].cta}
            </Link>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Dots */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
        {SLIDES.map((_, i) => (
          <button
            key={i}
            onClick={() => setIndex(i)}
            className={`rounded-full transition-all ${
              i === index ? 'bg-brand w-5 h-2' : 'bg-white/40 w-2 h-2'
            }`}
          />
        ))}
      </div>
    </section>
  );
}
