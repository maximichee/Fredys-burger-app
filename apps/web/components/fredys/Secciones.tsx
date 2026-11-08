import Image from 'next/image';
import Link from 'next/link';
import type { Product } from '@fredys/types';
import { FotoProducto } from './FotoProducto';
import { ListaHorarios } from './ListaHorarios';
import { formatPrice, ZONAS, PAGOS, waLink, INSTAGRAM_URL } from '@/lib/utils';
import { Parrilla, Semillas, SEMILLAS_CHICAS, IconoFlecha, Chorro } from './Piezas';

/* ===== LAS ELEGIDAS DE FREDY =====
   Las burgers marcadas como destacadas en el sistema. Fila que se desliza con el dedo. */
export function Elegidas({ products }: { products: Product[] }) {
  if (products.length === 0) return null;
  return (
    <section className="relative overflow-x-clip py-[var(--section-y)]" aria-labelledby="elegidas-t">
      <div className="relative z-[1] mx-auto max-w-6xl px-[var(--gutter)]">
        <p className="ceja">Las elegidas</p>
        <h2 id="elegidas-t" className="titulo mb-8 text-[clamp(2.6rem,10vw,5rem)]" data-split>Las elegidas de Fredy</h2>
      </div>
      <div className="no-scrollbar relative z-[1] mx-auto flex max-w-6xl snap-x snap-mandatory gap-4 overflow-x-auto px-[var(--gutter)] pb-6">
        {products.map((p) => {
          const base = [...p.prices].sort((a, b) => a.order - b.order)[0];
          return (
            <Link key={p.id} href={`/producto/${p.slug}`} data-reveal data-tilt
              className="vidrio group w-[78vw] max-w-[360px] flex-shrink-0 snap-start overflow-hidden rounded-[var(--r-lg)] p-3">
              <div className="relative aspect-[4/3] overflow-hidden rounded-[var(--r-md)] bg-black">
                <FotoProducto src={p.images[0]} alt={p.name} sizes="(max-width: 640px) 78vw, 360px"
                  className="object-cover transition-transform duration-[900ms] [transition-timing-function:var(--ease)] group-hover:scale-105" />
              </div>
              <div className="px-2 pb-1 pt-4">
                <h3 className="titulo sticker sticker--sm text-[2rem] leading-none">{p.name}</h3>
                {p.description && <p className="mt-2 line-clamp-2 text-sm text-apagado">{p.description}</p>}
                <div className="mt-4 flex items-center justify-between">
                  <p className="text-xl font-extrabold">{base && <><small className="block text-xs font-normal text-apagado">desde</small>{formatPrice(base.price)}</>}</p>
                  <span className="btn-mas" aria-hidden="true"><IconoFlecha /></span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
/* ===== /LAS ELEGIDAS DE FREDY ===== */

/* ===== CÓMO LLEGA TU PEDIDO =====
   Tres pasos unidos por un hilo de cheddar que baja conforme bajás. Envío y pago claros antes de pedir. */
const PASOS = [
  { t: 'Armás tu pedido', d: 'Elegís tus burgers y el tamaño acá mismo, sin llamar a nadie.' },
  { t: 'Lo confirmás por WhatsApp', d: 'Te llega el detalle armado: lo mandás y listo.' },
  { t: 'Retirás o te lo llevamos', d: 'Retiro gratis en el local o envío a tu casa. Tarda entre 30 y 45 minutos.' },
];

export function ComoLlega() {
  return (
    <section id="como-pedir" className="cuadrille scroll-mt-20 bg-dark-100 py-[var(--section-y)]" aria-labelledby="como-t">
      <div className="mx-auto grid max-w-6xl gap-12 px-[var(--gutter)] lg:grid-cols-[1fr_1fr] lg:gap-20">
        <div>
          <p className="ceja">Cómo pedir</p>
          <h2 id="como-t" className="titulo text-[clamp(2.6rem,10vw,5rem)]" data-split>Así llega tu pedido</h2>
          <ol className="relative mt-10 space-y-10 pl-14">
            {/* Un hilo de cheddar baja por los pasos mientras bajás y se junta al final */}
            <Chorro pieza="hilo" className="chorro--estirado -left-1.5 top-4 -bottom-6 w-12" />
            {PASOS.map((p, i) => (
              <li key={p.t} className="relative" data-reveal>
                <span className="absolute -left-14 top-0 grid h-9 w-9 place-items-center rounded-full bg-brand font-display text-lg text-tinta shadow-[0_3px_0_var(--choco)]">{i + 1}</span>
                <h3 className="text-xl font-semibold">{p.t}</h3>
                <p className="mt-1 text-apagado">{p.d}</p>
              </li>
            ))}
          </ol>
          <a href="#menu" className="btn-fredys mt-12">Armá tu pedido <IconoFlecha /></a>
        </div>

        <div className="space-y-5">
          <div className="vidrio rounded-[var(--r-lg)] p-6" data-reveal>
            <h3 className="font-semibold">Envío</h3>
            <ul className="mt-3 divide-y divide-[var(--line)]">
              {ZONAS.map((z) => (
                <li key={z.value} className="flex justify-between py-2.5 text-sm">
                  <span className="text-apagado">{z.label}</span>
                  <span className="font-semibold">{z.price === 0 ? 'Gratis' : formatPrice(z.price)}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="vidrio rounded-[var(--r-lg)] p-6" data-reveal>
            <h3 className="font-semibold">Pagás como quieras</h3>
            <p className="mt-2 text-sm text-apagado">{PAGOS.map((p) => p.label).join(' o ')}, cuando confirmás el pedido.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
/* ===== /CÓMO LLEGA TU PEDIDO ===== */

/* ===== POR QUÉ FREDY'S =====
   Una frase grande con sus propias palabras y el sello que gira. Sin grilla de íconos. */
export function PorQue() {
  return (
    <section className="py-[var(--section-y)]" aria-labelledby="porque-t">
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-[var(--gutter)] lg:grid-cols-[1.4fr_1fr]">
        <div>
          <p className="ceja">Por qué Fredy&apos;s</p>
          <h2 id="porque-t" className="titulo text-[clamp(2.8rem,11vw,6rem)] leading-[.98]" data-split>Sin congelados, sin atajos</h2>
          <p className="mt-6 max-w-[44ch] text-lg text-apagado" data-reveal>
            Somos de Santa Fe, para Santa Fe. Cada burger sale de la plancha en pan de papa, y tu pedido lo hace una persona, no un robot.
          </p>
          {/* Reseña real de cliente: se agrega acá cuando haya una con nombre y permiso (ver LEEME-REDISENO.md) */}
          <Link href="/nosotros" className="btn-borde mt-8" data-reveal>Conocé la historia <IconoFlecha /></Link>
        </div>
        <div className="foto-parrilla relative mx-auto aspect-square w-[min(72vw,340px)]" data-burst>
          {/* Gira el texto, no la caja: una caja cuadrada que rota se sale de lado en celular */}
          <svg className="absolute inset-0 h-full w-full" viewBox="0 0 120 120" aria-hidden="true">
            <defs><path id="circulo-sello" d="M60,60 m-50,0 a50,50 0 1,1 100,0 a50,50 0 1,1 -100,0" /></defs>
            <g className="sello">
              <text fontSize="9" letterSpacing="2.4" fill="var(--cream)" fontFamily="var(--font-poppins)" fontWeight="600">
                <textPath href="#circulo-sello" textLength="314" lengthAdjust="spacing">FREDY&apos;S BURGER • SANTA FE • PAN DE PAPA • </textPath>
              </text>
            </g>
          </svg>
          <Parrilla id="plato-sello" className="absolute inset-[22%]" />
          <Image src="/logo.png" alt="" width={150} height={150} className="absolute inset-[30%] h-[40%] w-[40%] object-contain" />
          <Semillas items={SEMILLAS_CHICAS} />
          {/* Un hilo de cheddar cae sobre el plato mientras bajás */}
          <Chorro pieza="hilo" className="chorro--fundido bottom-[71%] left-[46%] w-[15%]" />
        </div>
      </div>
    </section>
  );
}
/* ===== /POR QUÉ FREDY'S ===== */

/* ===== HORARIO Y CONTACTO ===== */
export function HorarioContacto() {
  return (
    <section id="contacto" className="cuadrille scroll-mt-20 bg-dark-100 py-[var(--section-y)]" aria-labelledby="horario-t" data-contacto>
      <div className="mx-auto grid max-w-6xl gap-10 px-[var(--gutter)] lg:grid-cols-2 lg:gap-20">
        <div>
          <p className="ceja">Horario y contacto</p>
          <h2 id="horario-t" className="titulo text-[clamp(2.6rem,10vw,5rem)]" data-split>La plancha se prende a las 19:30</h2>
          <p className="mt-5 max-w-[42ch] text-apagado" data-reveal>
            Hacemos envíos y retiro en Santa Fe. Para retirar, te pasamos la dirección por WhatsApp cuando confirmás.
          </p>
          <div className="mt-8 flex flex-wrap gap-3" data-reveal>
            <a href={waLink("Hola Fredy's, vengo de la web y tengo una consulta.")} target="_blank" rel="noopener noreferrer" className="btn-fredys">Escribinos por WhatsApp <IconoFlecha /></a>
            <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer" className="btn-borde">@fredysburger</a>
          </div>
        </div>
        <div className="vidrio rounded-[var(--r-lg)] p-6" data-reveal>
          <ListaHorarios />
        </div>
      </div>
    </section>
  );
}
/* ===== /HORARIO Y CONTACTO ===== */
