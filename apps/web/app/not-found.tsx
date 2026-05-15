import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Página no encontrada | Fredys Burger' };

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center px-4 bg-dark">
      <style>{`
        @keyframes flicker {
          0%,94%,100%{opacity:1} 95%{opacity:.5} 97%{opacity:1} 98%{opacity:.3}
        }
        @keyframes wobble {
          0%,100%{transform:rotate(-5deg)} 50%{transform:rotate(5deg)}
        }
        .anim-flicker { animation: flicker 3s infinite; }
        .anim-wobble  { display:inline-block; animation: wobble 2.4s ease-in-out infinite; }
      `}</style>

      <h1 className="anim-flicker text-[9rem] font-extrabold leading-none text-brand">404</h1>
      <span className="anim-wobble text-5xl mt-1 mb-6">🍔</span>
      <p className="text-2xl font-extrabold mb-2">Esta página se quemó en la plancha</p>
      <p className="text-white/45 mb-8 max-w-xs leading-relaxed">
        La URL que buscás no existe o fue movida.<br />Las hamburguesas siguen esperándote.
      </p>
      <div className="flex gap-3 flex-wrap justify-center">
        <Link href="/" className="bg-brand text-black font-bold px-7 py-3 rounded-full hover:bg-orange-500 transition-colors">
          Volver al inicio
        </Link>
        <Link href="/#menu" className="border border-white/15 text-white/70 font-semibold px-7 py-3 rounded-full hover:border-brand/50 hover:text-brand transition-colors">
          Ver el menú
        </Link>
      </div>
    </div>
  );
}
