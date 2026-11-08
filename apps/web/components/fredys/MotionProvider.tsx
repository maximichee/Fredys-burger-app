'use client';
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Lenis from 'lenis';
import { gsap, ScrollTrigger, SplitText, M, registerGsap, prefersReducedMotion, safe, setLenis, getLenis, haciaElCentro, animarChorros } from '@/lib/motion';
import { useCart } from '@/lib/cart-store';

/**
 * Movimiento global, marcado en el HTML con atributos:
 *  data-reveal       el bloque sube y aparece al entrar
 *  data-split        el título entra por líneas desde una ranura
 *  data-draw-scrub   el trazo (chorreado) se dibuja conforme bajas
 *  data-burst        las .semilla de adentro saltan desde el centro y flotan
 *  data-pop          la pieza se asienta con un rebote corto
 *  data-chorro       el cheddar chorrea atado al scroll (baja y sube con vos)
 * Sin JS o con "Reducir movimiento" todo se ve completo y quieto.
 */
export function MotionProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Lenis: una sola vez
  useEffect(() => {
    registerGsap();
    if (prefersReducedMotion() || !M.lerp) return;
    const lenis = new Lenis({ lerp: M.lerp, smoothWheel: true, wheelMultiplier: 1 });
    lenis.on('scroll', ScrollTrigger.update);
    const tick = (t: number) => lenis.raf(t * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);
    setLenis(lenis);
    // con el carrito abierto, la rueda mueve el carrito y no la página
    const unsub = useCart.subscribe((s, prev) => {
      if (s.isOpen === prev.isOpen) return;
      if (s.isOpen) lenis.stop(); else lenis.start();
    });
    return () => { unsub(); gsap.ticker.remove(tick); lenis.destroy(); setLenis(null); };
  }, []);

  // Revelados de cada página
  useEffect(() => {
    registerGsap();
    if (prefersReducedMotion()) return;
    const limpiezas: (() => void)[] = [];
    const ctx = gsap.context(() => {
      safe(() => {
        document.querySelectorAll<HTMLElement>('[data-reveal]').forEach((el) => {
          gsap.fromTo(el, { autoAlpha: 0, y: M.dist }, {
            autoAlpha: 1, y: 0, duration: M.dur, ease: M.ease,
            scrollTrigger: { trigger: el, start: 'top 90%', once: true },
          });
          el.style.animation = 'none';
        });
      });

      safe(() => {
        document.querySelectorAll<SVGSVGElement>('[data-draw-scrub]').forEach((svg) => {
          const ps = svg.querySelectorAll<SVGGeometryElement>('path');
          ps.forEach((p) => { const L = p.getTotalLength(); gsap.set(p, { strokeDasharray: L, strokeDashoffset: L }); });
          gsap.to(ps, { strokeDashoffset: 0, ease: 'none', scrollTrigger: { trigger: svg, start: 'top 75%', end: 'bottom 55%', scrub: true } });
        });
      });

      safe(() => {
        document.querySelectorAll<HTMLElement>('[data-burst]').forEach((caja) => {
          const ss = [...caja.querySelectorAll<HTMLElement>('.semilla')];
          if (!ss.length) return;
          const o = haciaElCentro(ss, caja, 1);
          gsap.fromTo(ss, { x: (i) => o[i].x, y: (i) => o[i].y, scale: 0, autoAlpha: 0 }, {
            x: 0, y: 0, scale: 1, autoAlpha: 1, duration: M.dur * 1.15, ease: M.pop, stagger: { each: 0.03, from: 'random' },
            scrollTrigger: { trigger: caja, start: 'top 80%', once: true },
          });
        });
      });

      safe(() => {
        document.querySelectorAll<HTMLElement>('[data-pop]').forEach((el) => {
          gsap.fromTo(el, { scale: 0.85, rotation: -6, autoAlpha: 0 }, {
            scale: 1, rotation: 0, autoAlpha: 1, duration: M.dur, ease: M.pop,
            scrollTrigger: { trigger: el, start: 'top 88%', once: true },
          });
        });
      });

      // Cheddar atado al scroll: baja a la par que bajás y se recoge cuando subís
      safe(() => animarChorros(document));

      // Menú: los renglones de cada categoría entran en cascada corta (en calma: poco recorrido, sin rebote)
      safe(() => {
        document.querySelectorAll<HTMLElement>('[data-cascada]').forEach((grid) => {
          const hijos = [...grid.children];
          gsap.set(hijos, { autoAlpha: 0, y: 24 });
          ScrollTrigger.batch(hijos, {
            start: 'top 92%', once: true,
            onEnter: (lote) => gsap.to(lote, { autoAlpha: 1, y: 0, duration: M.dur * 0.8, ease: M.ease, stagger: M.stagger * 1.2, overwrite: true }),
          });
        });
      });

      // La franja de cuadrillé de cada categoría se dibuja de izquierda a derecha
      safe(() => {
        document.querySelectorAll<HTMLElement>('[data-franja]').forEach((f) => {
          gsap.fromTo(f, { clipPath: 'inset(0 100% 0 0)' }, {
            clipPath: 'inset(0 0% 0 0)', duration: M.dur * 1.4, ease: M.easeIO,
            scrollTrigger: { trigger: f, start: 'top 90%', once: true },
          });
        });
      });

      // Tarjetas que se inclinan con el mouse (solo con puntero fino)
      safe(() => {
        if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
        document.querySelectorAll<HTMLElement>('[data-tilt]').forEach((card) => {
          gsap.set(card, { transformPerspective: 900 });
          const rx = gsap.quickTo(card, 'rotationX', { duration: 0.5, ease: 'power3.out' });
          const ry = gsap.quickTo(card, 'rotationY', { duration: 0.5, ease: 'power3.out' });
          const mover = (e: PointerEvent) => {
            const r = card.getBoundingClientRect();
            ry(((e.clientX - r.left) / r.width - 0.5) * 10);
            rx(-((e.clientY - r.top) / r.height - 0.5) * 8);
          };
          const salir = () => { rx(0); ry(0); };
          card.addEventListener('pointermove', mover);
          card.addEventListener('pointerleave', salir);
          limpiezas.push(() => { card.removeEventListener('pointermove', mover); card.removeEventListener('pointerleave', salir); });
        });
      });

      // Los títulos se dividen cuando ya cargó la fuente real
      const fonts = document.fonts ? document.fonts.ready : Promise.resolve();
      Promise.race([fonts, new Promise((r) => setTimeout(r, 1200))]).then(() => ctx.add(() => safe(() => {
        document.querySelectorAll<HTMLElement>('[data-split]').forEach((el) => {
          SplitText.create(el, {
            type: 'lines', mask: 'lines', linesClass: 'linea', autoSplit: true,
            onSplit: (self) => gsap.from(self.lines, {
              yPercent: 130, duration: M.dur * 1.1, stagger: M.stagger * 1.6, ease: M.ease,
              scrollTrigger: { trigger: el, start: 'top 88%', once: true },
            }),
          });
        });
        ScrollTrigger.refresh();
      })));
    });
    const lenis = getLenis();
    if (lenis) lenis.resize();

    // Si el alto de la página cambia (búsqueda, fotos que cargan), se recalculan los disparos del scroll
    let rT: ReturnType<typeof setTimeout>;
    const ro = new ResizeObserver(() => { clearTimeout(rT); rT = setTimeout(() => { ScrollTrigger.refresh(); getLenis()?.resize(); }, 200); });
    ro.observe(document.body);

    return () => { ro.disconnect(); clearTimeout(rT); limpiezas.forEach((f) => f()); ctx.revert(); };
  }, [pathname]);

  return <>{children}</>;
}
