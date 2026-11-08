'use client';
import { useEffect, useRef, useState } from 'react';
import { useCart } from '@/lib/cart-store';
import { formatPrice } from '@/lib/utils';
import { gsap, registerGsap, prefersReducedMotion } from '@/lib/motion';
import { IconoFlecha, CHEDDAR } from './Piezas';

/** Barra fija del celular: "Ver tu pedido · $total". Aparece al pasar la portada
 *  y se esconde al llegar a la sección de contacto para no taparla. */
export function CartBar() {
  const totalItems = useCart((s) => s.totalItems());
  const subtotal = useCart((s) => s.subtotal());
  const openCart = useCart((s) => s.openCart);
  const [pasoPortada, setPasoPortada] = useState(false);
  const [enContacto, setEnContacto] = useState(false);

  useEffect(() => {
    const hero = document.querySelector('.hero');
    const contacto = document.querySelector('[data-contacto]');
    if (!hero) setPasoPortada(true);
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.target === hero) setPasoPortada(!e.isIntersecting);
        if (e.target === contacto) setEnContacto(e.isIntersecting);
      });
    }, { threshold: 0 });
    if (hero) io.observe(hero);
    if (contacto) io.observe(contacto);
    return () => io.disconnect();
  }, []);

  const visible = totalItems > 0 && pasoPortada && !enContacto;

  // Cada vez que se suma algo, el cheddar chorrea sobre la barra y a los 2 s se recoge (no tapa el total)
  const queso = useRef<HTMLImageElement>(null);
  const antes = useRef(totalItems);
  useEffect(() => {
    const subio = totalItems > antes.current;
    antes.current = totalItems;
    const img = queso.current;
    if (!subio || !visible || !img || prefersReducedMotion()) return;
    registerGsap();
    const tl = gsap.timeline({ delay: 0.3 })
      .fromTo(img, { clipPath: 'inset(0% 0% 100% 0%)', scaleY: 0.6, autoAlpha: 1 },
        { clipPath: 'inset(0% 0% 0% 0%)', scaleY: 1, duration: 0.8, ease: 'power2.out' })
      .to(img, { clipPath: 'inset(0% 0% 100% 0%)', scaleY: 0.7, duration: 0.6, ease: 'power2.in' }, '+=2')
      .set(img, { autoAlpha: 0 });
    return () => { tl.kill(); };
  }, [totalItems, visible]);

  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-40 p-3 pb-[max(12px,env(safe-area-inset-bottom))] md:hidden ${visible
        ? 'visible translate-y-0 [transition:transform_.5s_var(--ease),visibility_0s]'
        : 'invisible translate-y-[130%] [transition:transform_.5s_var(--ease),visibility_0s_.5s]'}`}
      aria-hidden={!visible}
    >
      <div className="relative">
        <button type="button" onClick={openCart} tabIndex={visible ? 0 : -1} className="btn-fredys w-full justify-between">
          <span>Ver tu pedido · {totalItems}</span>
          <span className="flex items-center gap-2">{formatPrice(subtotal)} <IconoFlecha /></span>
        </button>
        {/* Cheddar (imagen 5) sobre el borde de arriba, entre el texto y el total */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <span className="pointer-events-none absolute left-1/2 top-0 w-[34%] max-w-[170px] -translate-x-[42%] -translate-y-[38%]" aria-hidden="true">
          <img ref={queso} src={CHEDDAR.borde.src} alt="" width={CHEDDAR.borde.w} height={CHEDDAR.borde.h} className="queso-barra block h-auto w-full" />
        </span>
      </div>
    </div>
  );
}
