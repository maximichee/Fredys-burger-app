import type { Metadata } from 'next';
import { HORARIOS, waLink, INSTAGRAM_URL } from '@/lib/utils';
import { Parrilla, IconoFlecha } from '@/components/fredys/Piezas';

export const metadata: Metadata = {
  title: 'Contacto',
  description: "Escribinos por WhatsApp o seguinos en Instagram. Fredy's Burger, Santa Fe.",
};

export default function ContactoPage() {
  return (
    <>
      {/* ===== ENCABEZADO ===== */}
      <section className="cuadrille relative overflow-clip px-[var(--gutter)] pb-16 pt-[calc(var(--nav-h,92px)+40px)]">
        <Parrilla id="plato-contacto" className="pointer-events-none absolute -right-24 -top-10 h-80 w-80 opacity-60" aro={false} />
        <div className="relative mx-auto max-w-6xl">
          <p className="ceja">Contacto</p>
          <h1 className="titulo sticker text-[clamp(3rem,13vw,7rem)] leading-[.95]" data-split>Hablemos de <span className="clave">burgers</span></h1>
          <p className="mt-5 max-w-[40ch] text-lg text-apagado" data-reveal>Escribinos por WhatsApp para cualquier consulta. Para pedir, lo más rápido es armar tu pedido acá.</p>
        </div>
      </section>
      {/* ===== /ENCABEZADO ===== */}

      {/* ===== CANALES Y HORARIO ===== */}
      <section className="mx-auto grid max-w-6xl gap-6 px-[var(--gutter)] pb-[var(--section-y)] lg:grid-cols-2">
        <div className="space-y-6">
          <a href={waLink("Hola Fredy's, vengo de la web y tengo una consulta.")} target="_blank" rel="noopener noreferrer"
            className="vidrio group block rounded-[var(--r-lg)] p-7 transition-transform hover:-translate-y-1" data-reveal>
            <p className="ceja">WhatsApp</p>
            <p className="titulo text-4xl">+54 9 342 503-9876</p>
            <p className="mt-2 text-apagado">Para cualquier consulta sobre tu pedido.</p>
            <span className="btn-fredys mt-6">Escribinos <IconoFlecha /></span>
          </a>
          <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer"
            className="vidrio group block rounded-[var(--r-lg)] p-7 transition-transform hover:-translate-y-1" data-reveal>
            <p className="ceja">Instagram</p>
            <p className="titulo text-4xl">@fredysburger</p>
            <p className="mt-2 text-apagado">Fotos, promos y novedades.</p>
          </a>
          <div className="vidrio rounded-[var(--r-lg)] p-7" data-reveal>
            <p className="ceja">Dónde estamos</p>
            <p className="text-lg">Santa Fe, Argentina. Envíos y retiro: te pasamos la dirección por WhatsApp cuando confirmás.</p>
          </div>
        </div>

        <div className="vidrio h-fit rounded-[var(--r-lg)] p-7" data-reveal>
          <p className="ceja">Horario</p>
          <ul className="divide-y divide-[var(--line)]">
            {HORARIOS.map((h) => (
              <li key={h.day} className="flex justify-between py-3">
                <span className="font-semibold">{h.day}</span>
                <span className={h.open ? '' : 'text-apagado'}>{h.time}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>
      {/* ===== /CANALES Y HORARIO ===== */}
    </>
  );
}
