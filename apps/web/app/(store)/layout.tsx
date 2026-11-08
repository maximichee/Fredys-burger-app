import Image from 'next/image';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { CartBar } from '@/components/fredys/CartBar';
import { Semillas, SEMILLAS_CHICAS, Chorro } from '@/components/fredys/Piezas';
import { waLink, INSTAGRAM_URL } from '@/lib/utils';

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      <main className="min-h-screen">{children}</main>

      {/* ===== PIE ===== */}
      <footer className="relative overflow-x-clip border-t border-[var(--line)] bg-dark pb-28 pt-16 md:pb-12">
        <div className="relative z-[1] mx-auto grid max-w-6xl gap-10 px-[var(--gutter)] md:grid-cols-[auto_1fr_auto] md:items-center">
          <div className="relative mx-auto h-36 w-36 md:mx-0" data-burst>
            <Chorro pieza="mancha" modo="mancha" className="left-1/2 top-1/2 w-[190%] -translate-x-1/2 -translate-y-1/2" />
            <Image src="/logo.png" alt="Fredy's Burger" width={150} height={150} className="relative h-full w-full object-contain" data-pop />
            <Semillas items={SEMILLAS_CHICAS} />
          </div>
          <nav className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm font-semibold md:justify-start" aria-label="Pie">
            <Link href="/#menu" className="hover:text-brand">Menú</Link>
            <Link href="/#como-pedir" className="hover:text-brand">Cómo pedir</Link>
            <Link href="/nosotros" className="hover:text-brand">Nosotros</Link>
            <Link href="/contacto" className="hover:text-brand">Contacto</Link>
            <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer" className="hover:text-brand">Instagram</a>
            <a href={waLink("Hola Fredy's, quiero hacer una consulta sobre un pedido.")} target="_blank" rel="noopener noreferrer" className="hover:text-brand">WhatsApp</a>
          </nav>
          <Link href="/#menu" className="btn-fredys justify-self-center">Armá tu pedido</Link>
        </div>
        <p className="mt-10 text-center text-xs text-apagado/70">Martes a domingo · 19:30 a 23:30 · Santa Fe · © {new Date().getFullYear()} Fredy&apos;s Burger</p>
      </footer>
      {/* ===== /PIE ===== */}

      <CartBar />
    </>
  );
}
