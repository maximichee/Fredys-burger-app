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
      const offset = window.scrollY + 140;
      let current = categories[0]?.slug;
      for (const cat of categories) {
        const el = document.getElementById(cat.slug);
        if (el && el.offsetTop <= offset) current = cat.slug;
      }
      if (current && current !== active) {
        setActive(current);
        scrollPillIntoView(current);
      }
    };
    window.addEventListener('scroll', handler, { passive: true });
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
    <div className="sticky top-[62px] z-40 bg-dark-100/95 backdrop-blur-md border-b border-white/5">
      <div
        ref={containerRef}
        onMouseDown={onMouseDown}
        className="flex gap-2 overflow-x-auto no-scrollbar px-4 py-3 cursor-grab"
      >
        {categories.map((cat) => (
          <button
            key={cat.slug}
            data-slug={cat.slug}
            onClick={() => handleClick(cat.slug)}
            className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all ${
              active === cat.slug
                ? 'bg-brand text-black'
                : 'bg-dark-300 text-white/60 hover:text-white hover:border-brand/30 border border-white/10'
            }`}
          >
            {cat.name}
            <span className={`text-xs rounded-full px-1.5 py-0.5 font-bold ${
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
