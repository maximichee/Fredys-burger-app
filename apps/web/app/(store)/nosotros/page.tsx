import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { Parrilla, Semillas, SEMILLAS_CHICAS, IconoFlecha, Chorro } from '@/components/fredys/Piezas';

export const metadata: Metadata = {
  title: 'Nosotros',
  description: "Conocé la historia detrás de Fredy's Burger: burgers artesanales en pan de papa, en Santa Fe.",
};

// Textos del dueño (página Nosotros anterior)
const VALORES = [
  { title: 'Calidad real', desc: 'Ingredientes frescos todos los días. Sin congelados, sin atajos.' },
  { title: 'Pasión',       desc: 'Cada burger sale de la plancha con dedicación, no de una cadena de producción.' },
  { title: 'Cercanía',     desc: 'Somos de Santa Fe, para Santa Fe. Tu pedido lo hace una persona, no un robot.' },
  { title: 'Rapidez',      desc: 'Artesanal no significa lento. Te preparamos todo con la calidad que merecés, sin hacerte esperar de más.' },
];

export default function NosotrosPage() {
  return (
    <>
      {/* ===== ENCABEZADO ===== */}
      <section className="cuadrille px-[var(--gutter)] pb-12 pt-[calc(var(--nav-h,92px)+40px)]">
        <div className="mx-auto max-w-6xl">
          <p className="ceja">Nuestra historia</p>
          <h1 className="titulo sticker text-[clamp(3rem,13vw,7rem)] leading-[.95]" data-split>Artesanales de <span className="clave">verdad</span></h1>
          <p className="mt-5 text-lg text-apagado" data-reveal>Desde el primer día.</p>
        </div>
      </section>
      {/* ===== /ENCABEZADO ===== */}

      {/* ===== HISTORIA ===== */}
      <section className="mx-auto grid max-w-6xl items-center gap-12 overflow-x-clip px-[var(--gutter)] py-[var(--section-y)] lg:grid-cols-2">
        <div className="foto-parrilla relative mx-auto aspect-square w-full max-w-[520px]" data-burst>
          {/* Salpicadura de cheddar detrás del plato: se abre mientras bajás */}
          <Chorro pieza="mancha" modo="mancha" className="left-1/2 top-[58%] w-[125%] -translate-x-1/2 -translate-y-1/2" />
          <Parrilla id="plato-nosotros" className="absolute inset-0 h-full w-full" />
          <div className="absolute inset-[6%] overflow-hidden rounded-full bg-black">
            <Image src="/img/rediseno/nosotros-bacon.webp" alt="Bacon Cheeseburger con papas" fill sizes="(max-width: 1024px) 90vw, 520px" className="object-cover [object-position:40%_55%]" />
          </div>
          <Semillas items={SEMILLAS_CHICAS} />
        </div>
        <div>
          <h2 className="titulo text-[clamp(2.4rem,9vw,4rem)]" data-split>¿Quiénes somos?</h2>
          <div className="mt-5 space-y-4 text-lg leading-relaxed text-apagado" data-reveal>
            <p>Fredys Burger nació de una pasión genuina por la buena hamburguesa. No la del delivery genérico, sino la que se hace con tiempo, con ingredientes frescos y con ganas reales de hacerte feliz.</p>
            <p>Arrancamos chicos, con una sola receta y muchas ganas. Hoy tenemos una carta amplia, pero la filosofía sigue siendo la misma: cada burger que sale de nuestra cocina tiene que ser la mejor que comiste.</p>
          </div>
          <h2 className="titulo mt-12 text-[clamp(2rem,7vw,3rem)]" data-split>Hecho con amor (y mucho cheddar)</h2>
          <div className="mt-4 space-y-4 text-lg leading-relaxed text-apagado" data-reveal>
            <p>Cada ingrediente es elegido con criterio. La carne es de calidad, el pan es de papa, y las salsas las hacemos nosotros. Nada viene de una bolsa anónima.</p>
            <p>Abrimos de martes a domingo a partir de las 19:30, porque creemos que la noche merece una buena hamburguesa.</p>
          </div>
        </div>
      </section>
      {/* ===== /HISTORIA ===== */}

      {/* ===== LO QUE NOS MUEVE ===== */}
      <section className="bg-dark-100 py-[var(--section-y)]">
        <div className="mx-auto max-w-6xl px-[var(--gutter)]">
          <p className="ceja">Lo que nos mueve</p>
          <ol className="mt-4">
            {VALORES.map((v, i) => (
              <li key={v.title} className="grid gap-2 border-b border-[var(--line)] py-7 md:grid-cols-[120px_1fr_1.4fr] md:items-baseline md:gap-8" data-reveal>
                <span className="titulo text-5xl text-cuero">0{i + 1}</span>
                <h3 className="titulo text-3xl">{v.title}</h3>
                <p className="text-apagado">{v.desc}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>
      {/* ===== /LO QUE NOS MUEVE ===== */}

      {/* ===== CIERRE ===== */}
      <section className="px-[var(--gutter)] py-[var(--section-y)] text-center">
        <h2 className="titulo sticker text-[clamp(2.8rem,11vw,5.5rem)]" data-split>¿Te convencimos?</h2>
        <p className="mt-4 text-apagado">Elegí la tuya y la ponemos en la plancha.</p>
        <Link href="/#menu" className="btn-fredys mt-8">Armá tu pedido <IconoFlecha /></Link>
      </section>
      {/* ===== /CIERRE ===== */}
    </>
  );
}
