import { Navbar } from '@/components/Navbar';
import { PageTransition } from '@/components/PageTransition';

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-16">
        <PageTransition>{children}</PageTransition>
      </main>
      <footer className="bg-dark-100 border-t border-white/5 py-10 mt-20">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row justify-between gap-8">
          <div>
            <p className="font-bold text-brand text-lg">Fredys Burger</p>
            <p className="text-white/40 text-sm mt-1">Las mejores hamburguesas artesanales de Santa Fe.</p>
          </div>
          <div className="text-white/40 text-sm space-y-1">
            <p>📍 Santa Fe, Argentina</p>
            <p>⏰ Mar–Dom · 19:30–23:30hs</p>
            <p>📱 <a href="https://wa.me/5493425039876" className="hover:text-brand transition-colors">+54 9 342 503-9876</a></p>
          </div>
        </div>
        <p className="text-center text-white/20 text-xs mt-8">© 2026 Fredys Burger — Todos los derechos reservados</p>
      </footer>
    </>
  );
}
