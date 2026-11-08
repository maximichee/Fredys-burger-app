'use client';
import { useEffect, useLayoutEffect, useRef } from 'react';
import Image from 'next/image';
import { gsap, M, C, registerGsap, prefersReducedMotion, haciaElCentro } from '@/lib/motion';
import { useEstadoLocal } from '@/lib/use-estado-local';
import { Parrilla, Semillas, SEMILLAS_PORTADA, IconoFlecha, Chorro } from './Piezas';

/* ===== PORTADA =====
   Firma: la parrilla se enciende naranja y se enfría, la burger sale de la penumbra,
   saltan las semillas y entra el titular. Al bajar, el queso de la burger se derrite.
   Se salta con un toque. En la segunda visita de la sesión va al doble de velocidad. */

const useIsoLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

export function Hero() {
  const root = useRef<HTMLElement>(null);
  // Estado en vivo (hora de Argentina, se actualiza solo)
  const estado = useEstadoLocal();
  const cerrado = estado && !estado.abierto;

  useIsoLayoutEffect(() => {
    registerGsap();
    const el = root.current;
    if (!el) return;
    const q = (s: string) => el.querySelector(s);
    const qa = <T extends Element>(s: string) => [...el.querySelectorAll<T>(s)];

    let tl: gsap.core.Timeline | null = null;
    if (prefersReducedMotion()) {
      return;
    }

    let flotados: gsap.core.Tween[] = [];
    const semillas = qa<HTMLElement>('.semilla');
    const saltar = () => { if (tl && tl.isActive()) tl.progress(1); };

    const ctx = gsap.context(() => {
      const lineas = qa<SVGLineElement>('.parrilla line');
      lineas.forEach((l) => { const L = l.getTotalLength(); gsap.set(l, { strokeDasharray: L, strokeDashoffset: L, stroke: C.brand }); });
      gsap.set(qa('.hero__line-in'), { yPercent: 130, y: 0 });
      const origen = haciaElCentro(semillas, q('.hero__media')!, 0.92);
      gsap.set([...qa('[data-hero-in]'), ...qa('[data-hero-img]'), ...semillas], { autoAlpha: 0 });
      gsap.set(q('.parrilla'), { autoAlpha: 1 });
      document.documentElement.classList.add('firma-lista');

      const flotar = () => {
        flotados.forEach((t) => t.kill());
        flotados = semillas.map((s) => gsap.to(s, {
          x: `+=${gsap.utils.random(-7, 7)}`, y: `+=${gsap.utils.random(-12, 12)}`,
          duration: gsap.utils.random(6, 9), repeat: -1, yoyo: true, ease: 'sine.inOut',
        }));
      };

      tl = gsap.timeline({ defaults: { ease: M.ease } })
        .to(lineas, { strokeDashoffset: 0, duration: 0.55, stagger: 0.022, ease: M.easeIO }, 0)
        .to(lineas, { stroke: C.cuero, duration: 0.9, ease: 'power1.out' }, 0.7)
        .fromTo(qa('[data-hero-img]'), { autoAlpha: 0, scale: 1.16, yPercent: 5 }, { autoAlpha: 1, scale: 1, yPercent: 0, duration: M.dur * 1.6 }, 0.2)
        .fromTo(semillas, { x: (i) => origen[i].x, y: (i) => origen[i].y, scale: 0, autoAlpha: 0 },
          { x: 0, y: 0, scale: 1, autoAlpha: 1, duration: M.dur * 1.15, ease: M.pop, stagger: { each: 0.018, from: 'random' } }, 0.6)
        .to(qa('.hero__line-in'), { yPercent: 0, duration: M.dur * 1.1, stagger: M.stagger * 1.8 }, 0.5)
        .fromTo(qa('[data-hero-in]'), { autoAlpha: 0, y: M.dist * 0.45 }, { autoAlpha: 1, y: 0, duration: M.dur, stagger: M.stagger * 2 }, 1.0);
      tl.to(q('[data-hero-cta]'), { scale: 1.06, duration: 0.14, yoyo: true, repeat: 1, ease: 'power2.out' }, 1.6)
        .call(flotar);

      // Segunda visita de la sesión: la mitad de tiempo
      try { if (sessionStorage.getItem('fredys-firma')) tl.timeScale(2); sessionStorage.setItem('fredys-firma', '1'); } catch { /* sin almacenamiento */ }

      // Al bajar: la burger se aleja y gira, la parrilla rota y las semillas se dispersan.
      // Cada pieza en su propia caja, para no pisar lo que anima la firma.
      const parrilla = q('.parrilla');
      gsap.set(parrilla, { xPercent: -50, yPercent: -50, x: 0, y: 0 });
      gsap.timeline({ scrollTrigger: { trigger: el, start: 'top top', end: 'bottom top', scrub: true } })
        .to(q('.hero__escena'), { scale: 0.84, rotation: -6, yPercent: 12, ease: 'none' }, 0)
        .to(parrilla, { rotation: 40, scale: 0.9, ease: 'none' }, 0)
        .to(q('.hero__semillas'), { scale: 1.5, autoAlpha: 0.25, ease: 'none' }, 0);
    }, el);

    window.addEventListener('pointerdown', saltar, { passive: true });
    window.addEventListener('keydown', saltar);
    return () => {
      window.removeEventListener('pointerdown', saltar);
      window.removeEventListener('keydown', saltar);
      flotados.forEach((t) => t.kill());
      ctx.revert();
    };
  }, []);

  return (
    <section ref={root} className="hero relative grid min-h-[100svh] content-start overflow-clip px-[var(--gutter)] pb-7 pt-[86px] lg:grid-cols-[1.05fr_1fr] lg:content-center lg:items-center lg:gap-x-6 lg:pt-24" aria-label="Portada">

      <div className="hero__media foto-parrilla relative -mx-[var(--gutter)] h-[min(44svh,420px)] lg:col-start-2 lg:row-start-1 lg:mx-0 lg:h-[min(80svh,680px)]">
        <Parrilla id="plato-portada" className="absolute left-1/2 top-1/2 aspect-square w-[min(92vw,470px)] -translate-x-1/2 -translate-y-1/2 overflow-visible lg:w-[min(44vw,640px)]" />
        {/* Escena: la firma anima la foto; el scroll anima esta caja (así no se pisan) */}
        <div className="hero__escena absolute inset-0">
          <Image
            data-hero-img
            src="/img/rediseno/portada-mushroom.webp"
            alt="Mushroom Burger: pan de papa, carne, cheddar, bacon y champiñones"
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover [-webkit-mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_74%,transparent_96%)] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_74%,transparent_96%)] [object-position:50%_47%]"
          />
          {/* El queso de la burger se derrite por el pan mientras bajás; se desvanece antes del titular */}
          <Chorro pieza="chorreado" className="chorro--fundido chorro--recortado left-[22%] top-[47%] bottom-[-6%] w-[56%] overflow-hidden" />
        </div>
        <div className="hero__semillas absolute inset-0">
          <Semillas items={SEMILLAS_PORTADA} />
        </div>
      </div>

      <div className="relative z-[2] lg:col-start-1 lg:row-start-1">
        <h1 className="titulo sticker -mt-[.55em] text-[clamp(3.2rem,16vw,8.6rem)] leading-[.92] lg:mt-0 lg:text-[clamp(4.5rem,7.6vw,8.8rem)]">
          <span className="hero__line"><span className="hero__line-in">Sabor</span></span>
          <span className="hero__line"><span className="hero__line-in">intenso en</span></span>
          <span className="hero__line"><span className="hero__line-in">cada <span className="clave">mordida</span></span></span>
        </h1>

        <div className="mt-[46px]">
          <a className="btn-fredys" href="#menu" data-hero-cta data-hero-in>
            {cerrado ? 'Mirá el menú' : 'Armá tu pedido'} <IconoFlecha />
          </a>
        </div>
        <p data-hero-in className="mt-[22px] max-w-[34ch] text-apagado">
          Burgers artesanales en pan de papa. Pedí online y retirá en el local o recibila en tu casa.
        </p>
        <p data-hero-in className="mt-2.5 text-sm font-semibold tracking-wide">
          Martes a domingo <b className="font-semibold text-brand">·</b> 19:30 a 23:30 <b className="font-semibold text-brand">·</b> Santa Fe
        </p>
        {/* Sin data-hero-in: aparece cuando el horario se calcula. Abierto: punto verde que late. */}
        {estado && (
          <p className="mt-4 inline-flex flex-wrap items-center gap-x-2 gap-y-0.5 rounded-full border border-[var(--line)] px-4 py-2 text-sm font-semibold" role="status">
            <span className="relative flex h-2 w-2" aria-hidden="true">
              {estado.abierto && <span className="absolute inset-0 animate-ping rounded-full bg-green-400 opacity-60 motion-reduce:animate-none" />}
              <span className={`relative h-2 w-2 rounded-full ${estado.abierto ? 'bg-green-400' : 'bg-red-400'}`} />
            </span>
            <span className="text-crema">{estado.abierto ? estado.corto : `Cerrado · ${estado.corto.replace('Abrimos', 'abrimos')}`}</span>
            {estado.abierto && <span className="text-apagado">· {estado.detalle}</span>}
          </p>
        )}
      </div>
    </section>
  );
}
/* ===== /PORTADA ===== */
