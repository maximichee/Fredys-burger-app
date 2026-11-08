'use client';
import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import type { Category } from '@fredys/types';

interface CategoryPillsProps {
  categories: (Category & { _count?: { products: number } })[];
}

export function CategoryPills({ categories }: CategoryPillsProps) {
  const [active, setActive] = useState(categories[0]?.slug ?? '');
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const startX    = useRef(0);
  const scrollLeft = useRef(0);

  // Highlight activo al scrollear
  useEffect(() => {
    const handler = () => {
      // Posición en pantalla (no offsetTop: el menú es "relative" y lo desfasaba).
      // Línea de corte: debajo del navbar + la barra de cápsulas.
      const corte = (containerRef.current?.getBoundingClientRect().bottom ?? 140) + 24;
      let current = categories[0]?.slug;
      for (const cat of categories) {
        const el = document.getElementById(cat.slug);
        if (el && el.getBoundingClientRect().top <= corte) current = cat.slug;
      }
      if (current && current !== active) {
        setActive(current);
        scrollPillIntoView(current);
      }
    };
    window.addEventListener('scroll', handler, { passive: true });
    handler();
    return () => window.removeEventListener('scroll', handler);
  }, [categories, active]);

  function scrollPillIntoView(slug: string) {
    const container = containerRef.current;
    if (!container) return;
    const pill = container.querySelector<HTMLElement>(`[data-slug="${slug}"]`);
    if (!pill) return;
    const offset = pill.offsetLeft - container.clientWidth / 2 + pill.clientWidth / 2;
    container.scrollTo({ left: offset, behavior: 'smooth' });
  }

  function handleClick(slug: string) {
    if (isDragging.current) return;
    setActive(slug);
    document.getElementById(slug)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    scrollPillIntoView(slug);
  }

  // Mouse drag
  function onMouseDown(e: React.MouseEvent) {
    isDragging.current = false;
    startX.current = e.pageX - (containerRef.current?.offsetLeft ?? 0);
    scrollLeft.current = containerRef.current?.scrollLeft ?? 0;
    containerRef.current!.style.cursor = 'grabbing';

    const move = (e: MouseEvent) => {
      const x = e.pageX - (containerRef.current?.offsetLeft ?? 0);
      if (Math.abs(x - startX.current) > 5) isDragging.current = true;
      if (containerRef.current) containerRef.current.scrollLeft = scrollLeft.current - (x - startX.current);
    };
    const up = () => {
      containerRef.current!.style.cursor = 'grab';
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', up);
    };
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
  }

  return (
    <div className="sticky top-16 z-40 mt-6 border-y border-[var(--line)] bg-dark/90 backdrop-blur-md">
      <div
        ref={containerRef}
        onMouseDown={onMouseDown}
        className="no-scrollbar mx-auto flex max-w-6xl cursor-grab gap-2 overflow-x-auto px-[var(--gutter)] py-3"
      >
        {categories.map((cat) => (
          <button
            key={cat.slug}
            data-slug={cat.slug}
            onClick={() => handleClick(cat.slug)}
            className={`flex min-h-[44px] flex-shrink-0 items-center gap-2 rounded-full px-4 text-sm font-semibold transition-all ${
              active === cat.slug
                ? 'bg-brand text-tinta shadow-[0_3px_0_var(--choco)]'
                : 'border border-[var(--line)] bg-dark-200 text-apagado hover:border-brand/40 hover:text-crema'
            }`}
          >
            {cat.name}
            <span className={`rounded-full px-1.5 py-0.5 text-xs font-bold ${
              active === cat.slug ? 'bg-black/15' : 'bg-white/10'
            }`}>
              {cat._count?.products ?? 0}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
