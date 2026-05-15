import type { Metadata } from 'next';
import Image from 'next/image';

export const metadata: Metadata = {
  title: 'Nosotros | Fredys Burger',
  description: 'Conocé la historia detrás de Fredys Burger, las mejores hamburguesas artesanales de Santa Fe.',
};

const VALUES = [
  { icon: '🥩', title: 'Calidad real',    desc: 'Ingredientes frescos todos los días. Sin congelados, sin atajos.' },
  { icon: '🔥', title: 'Pasión',           desc: 'Cada burger sale de la plancha con dedicación, no de una cadena de producción.' },
  { icon: '🤝', title: 'Cercanía',         desc: 'Somos de Santa Fe, para Santa Fe. Tu pedido lo hace una persona, no un robot.' },
  { icon: '⚡', title: 'Rapidez',          desc: 'Artesanal no significa lento. Te preparamos todo con la calidad que merecés, sin hacerte esperar de más.' },
];

export default function NosotrosPage() {
  return (
    <>
      {/* Hero */}
      <section className="pt-16 pb-16 text-center bg-gradient-to-b from-[#1a0a00] to-dark">
        <h1 className="text-4xl sm:text-5xl font-extrabold text-brand mb-3">Nuestra Historia</h1>
        <p className="text-white/60 text-lg max-w-md mx-auto px-4">Artesanales de verdad, desde el primer día.</p>
      </section>

      {/* Historia */}
      <section className="max-w-6xl mx-auto px-4 py-16 space-y-20">

        {/* Bloque 1 */}
        <div className="grid md:grid-cols-2 gap-10 items-center">
          <div className="relative aspect-square rounded-2xl overflow-hidden bg-dark-200">
            <Image
              src="/logo.png"
              alt="Fredys Burger"
              fill
              className="object-contain p-10"
            />
          </div>
          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-brand mb-4">¿Quiénes somos?</h2>
            <p className="text-white/70 leading-relaxed mb-4">
              Fredys Burger nació de una pasión genuina por la buena hamburguesa. No la del delivery genérico, sino la que se hace con tiempo, con ingredientes frescos y con ganas reales de hacerte feliz.
            </p>
            <p className="text-white/70 leading-relaxed">
              Arrancamos chicos, con una sola receta y muchas ganas. Hoy tenemos una carta amplia, pero la filosofía sigue siendo la misma: cada burger que sale de nuestra cocina tiene que ser la mejor que comiste.
            </p>
          </div>
        </div>

        {/* Bloque 2 */}
        <div className="grid md:grid-cols-2 gap-10 items-center">
          <div className="md:order-2 relative aspect-square rounded-2xl overflow-hidden bg-dark-200">
            <Image
              src="/img/b/b1.1.png"
              alt="Hamburguesas artesanales"
              fill
              className="object-cover"
            />
          </div>
          <div className="md:order-1">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-brand mb-4">Hecho con amor (y mucho cheddar)</h2>
            <p className="text-white/70 leading-relaxed mb-4">
              Cada ingrediente es elegido con criterio. La carne es de calidad, el pan es de papa, y las salsas las hacemos nosotros. Nada viene de una bolsa anónima.
            </p>
            <p className="text-white/70 leading-relaxed">
              Abrimos de martes a domingo a partir de las 19:30hs, porque creemos que la noche merece una buena hamburguesa.
            </p>
          </div>
        </div>

      </section>

      {/* Valores */}
      <section className="bg-dark-100 py-16">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-brand text-center mb-12">Lo que nos mueve</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {VALUES.map((v) => (
              <div
                key={v.title}
                className="bg-dark-200 border border-brand/15 rounded-2xl p-8 text-center hover:border-brand/50 hover:-translate-y-1 transition-all"
              >
                <div className="text-4xl mb-4">{v.icon}</div>
                <h3 className="font-bold text-brand mb-2">{v.title}</h3>
                <p className="text-white/60 text-sm leading-relaxed">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 text-center">
        <h2 className="text-3xl font-extrabold mb-3">¿Te convencimos?</h2>
        <p className="text-white/55 mb-8">Vení a conocernos o pedí desde acá mismo.</p>
        <a
          href="/#menu"
          className="inline-block bg-brand text-black font-extrabold px-10 py-4 rounded-full hover:bg-orange-500 transition-colors"
        >
          Ver el Menú
        </a>
      </section>
    </>
  );
}
