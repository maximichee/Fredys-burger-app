'use client';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import type Lenis from 'lenis';

let registered = false;
export function registerGsap() {
  if (registered || typeof window === 'undefined') return;
  gsap.registerPlugin(ScrollTrigger, SplitText);
  ScrollTrigger.config({ ignoreMobileResize: true });
  registered = true;
}

/** Fredy's: golosa, enérgica y cálida. Pareja de las variables de movimiento en globals.css. */
export const M = { ease: 'power4.out', easeIO: 'power3.inOut', pop: 'back.out(2.2)', dur: 0.8, stagger: 0.05, dist: 56, lerp: 0.1 };
export const C = { brand: '#FB8500', cuero: '#5A3A33' };

export const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export const safe = <T,>(fn: () => T): T | undefined => {
  try { return fn(); } catch (e) { console.warn('[fredys]', e); return undefined; }
};

// Lenis vive una sola vez para toda la app
let lenisRef: Lenis | null = null;
export const setLenis = (l: Lenis | null) => { lenisRef = l; };
export const getLenis = () => lenisRef;

/** Hacia dónde tiene que salir cada pieza para que parezca que explota desde el centro de la caja. */
export function haciaElCentro(els: Element[], caja: Element, f = 0.92) {
  const c = caja.getBoundingClientRect();
  const cx = c.left + c.width / 2, cy = c.top + c.height / 2;
  return els.map((el) => { const r = el.getBoundingClientRect(); return { x: (cx - r.left) * f, y: (cy - r.top) * f }; });
}

/** Una semilla del pan vuela del botón "+" al carrito en arco; al llegar, el carrito se sacude. */
export function volarAlCarrito(desde: Element) {
  if (typeof window === 'undefined' || prefersReducedMotion()) return;
  registerGsap();
  safe(() => {
    const destino = document.querySelector('[data-cart-icon]');
    if (!destino) return;
    const a = desde.getBoundingClientRect();
    const b = destino.getBoundingClientRect();
    const x0 = a.left + a.width / 2, y0 = a.top + a.height / 2;
    const x1 = b.left + b.width / 2, y1 = b.top + b.height / 2;

    const semilla = document.createElement('span');
    semilla.setAttribute('aria-hidden', 'true');
    Object.assign(semilla.style, {
      position: 'fixed', left: '0px', top: '0px', width: '16px', height: '9px', marginLeft: '-8px', marginTop: '-4.5px',
      borderRadius: '50%', background: 'var(--cream)', boxShadow: '0 0 0 3px var(--brand), 0 4px 12px rgba(0,0,0,.5)',
      zIndex: '70', pointerEvents: 'none',
    });
    document.body.appendChild(semilla);

    const dur = 0.75;
    gsap.timeline({ onComplete: () => semilla.remove() })
      .set(semilla, { x: x0, y: y0, rotation: -30, scale: 0 })
      .to(semilla, { scale: 1.3, duration: 0.18, ease: M.pop })
      .to(semilla, { x: x1, duration: dur, ease: 'power1.inOut' }, 0.1)
      .to(semilla, { y: Math.max(22, Math.min(y0, y1) - 90), duration: dur * 0.45, ease: 'power2.out' }, 0.1)   // sube en arco, sin salirse de la pantalla
      .to(semilla, { y: y1, duration: dur * 0.55, ease: 'power2.in' }, 0.1 + dur * 0.45)          // y cae al carrito
      .to(semilla, { rotation: 300, scale: 0.5, duration: dur, ease: 'none' }, 0.1)
      .to(semilla, { autoAlpha: 0, duration: 0.12 }, '-=0.08')
      .fromTo(destino, { rotation: 0 }, { keyframes: { rotation: [-14, 11, -7, 4, 0] }, duration: 0.5, ease: 'power1.out' }, '-=0.1')
      .fromTo(destino, { scale: 1 }, { scale: 1.15, duration: 0.14, yoyo: true, repeat: 1, ease: 'power2.out' }, '<');
  });
}

/** Cheddar atado al scroll ([data-chorro]): "baja" se estira hacia abajo al bajar y se recoge al subir;
 *  "mancha" se abre. Llamar dentro de un gsap.context para que se limpie solo. */
export function animarChorros(raiz: ParentNode) {
  raiz.querySelectorAll<HTMLElement>('[data-chorro]').forEach((el) => {
    const img = el.firstElementChild;
    if (!img) return;
    if (el.dataset.chorro === 'mancha') {
      gsap.fromTo(img, { scale: 0.15, rotation: -25, autoAlpha: 0 }, {
        scale: 1, rotation: 0, autoAlpha: 1, ease: 'none',
        scrollTrigger: { trigger: el, start: 'clamp(top 90%)', end: 'clamp(center 55%)', scrub: true },  // clamp: termina aunque la página se acabe
      });
      return;
    }
    gsap.fromTo(img, { clipPath: 'inset(0% 0% 100% 0%)', scaleY: 0.8, transformOrigin: '50% 0%' }, {
      clipPath: 'inset(0% 0% 0% 0%)', scaleY: 1, ease: 'none',
      scrollTrigger: {
        trigger: el, start: 'clamp(top 80%)', scrub: true, invalidateOnRefresh: true,
        end: (st) => Math.min(st.start + el.offsetHeight * 1.1, ScrollTrigger.maxScroll(window)),   // llega completo aunque la página se acabe
      },
    });
  });
}

export { gsap, ScrollTrigger, SplitText };
