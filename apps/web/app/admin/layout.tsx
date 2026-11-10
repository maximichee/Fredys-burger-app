'use client';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { adminFetch } from '@/lib/api';
import { useEstadoLocal } from '@/lib/use-estado-local';
import { tabDe } from '@/lib/estado-pedido';
import type { Order, Product } from '@fredys/types';

/* Panel del local: pensado para la computadora (barra lateral fija). En el celular, barra de abajo. */

type Clave = 'resumen' | 'pedidos' | 'productos' | 'categorias';
const NAV: { grupo: string; items: { href: string; label: string; clave: Clave; ayuda: string }[] }[] = [
  { grupo: 'Local', items: [
    { href: '/admin',         label: 'Resumen', clave: 'resumen', ayuda: 'Cómo viene el día' },
    { href: '/admin/pedidos', label: 'Pedidos', clave: 'pedidos', ayuda: 'Atender y avisar' },
  ] },
  { grupo: 'Menú', items: [
    { href: '/admin/productos',  label: 'Productos',  clave: 'productos',  ayuda: 'Precios, fotos y agotados' },
    { href: '/admin/categorias', label: 'Categorías', clave: 'categorias', ayuda: 'Secciones y su orden' },
  ] },
];
const TODOS = NAV.flatMap((g) => g.items);

/** Íconos de línea, del mismo grosor que el resto del panel */
function Icono({ de, className = 'h-5 w-5' }: { de: Clave | 'web' | 'salir'; className?: string }) {
  const p = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden {...p}>
      {de === 'resumen' && <><path d="M4 20h16" /><rect x="5" y="11" width="3" height="6" rx="1" /><rect x="10.5" y="6" width="3" height="11" rx="1" /><rect x="16" y="9" width="3" height="8" rx="1" /></>}
      {de === 'pedidos' && <><path d="M6 3h12l1 4H5l1-4z" /><path d="M5 7h14v12a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V7z" /><path d="M9 11a3 3 0 0 0 6 0" /></>}
      {de === 'productos' && <><path d="M4 11a8 6 0 0 1 16 0z" /><path d="M3.5 14h17" /><path d="M5 17.5h14a1 1 0 0 1-1 2.5H6a1 1 0 0 1-1-2.5z" /></>}
      {de === 'categorias' && <><rect x="3" y="3" width="7" height="7" rx="2" /><rect x="14" y="3" width="7" height="7" rx="2" /><rect x="3" y="14" width="7" height="7" rx="2" /><rect x="14" y="14" width="7" height="7" rx="2" /></>}
      {de === 'web' && <><path d="M14 4h6v6" /><path d="M20 4l-9 9" /><path d="M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" /></>}
      {de === 'salir' && <><path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3" /><path d="M10 17l-5-5 5-5" /><path d="M5 12h11" /></>}
    </svg>
  );
}

/** Email del admin, leído del token (solo para mostrarlo) */
const emailDe = (t: string) => {
  try { return JSON.parse(atob(t.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))).email as string; } catch { return ''; }
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router   = useRouter();
  const pathname = usePathname();
  const [token,       setToken]       = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [cuenta, setCuenta] = useState({ atender: 0, nuevos: 0, agotados: 0 });

  useEffect(() => {
    const t = localStorage.getItem('admin_token');
    if (!t && pathname !== '/admin/login') router.push('/admin/login');
    else setToken(t);
  }, [pathname, router]);

  // Contadores de la barra: pedidos esperando y productos agotados (se refrescan solos)
  useEffect(() => {
    if (!token) return;
    const revisar = () => {
      adminFetch<Order[]>('/orders', token).then((os) => setCuenta((c) => ({
        ...c, atender: os.filter((o) => tabDe(o) === 'atender').length, nuevos: os.filter((o) => o.status === 'PENDING').length,
      }))).catch(() => {});
      adminFetch<Product[]>('/products?todas=1', token).then((ps) => setCuenta((c) => ({ ...c, agotados: ps.filter((p) => !p.available).length }))).catch(() => {});
    };
    revisar();
    const id = setInterval(revisar, 20000);
    return () => clearInterval(id);
  }, [token, pathname]);

  // La pestaña del navegador avisa si hay pedidos esperando
  useEffect(() => {
    const base = "Panel · Fredy's";
    document.title = cuenta.atender ? `(${cuenta.atender}) Pedidos · ${base}` : base;
  }, [cuenta.atender, pathname]);

  const logout = () => {
    localStorage.removeItem('admin_token');
    router.push('/admin/login');
  };

  if (pathname === '/admin/login') return <>{children}</>;
  if (!token) return null;

  const badge = (clave: Clave) =>
    clave === 'pedidos' && cuenta.atender ? { n: cuenta.atender, urgente: cuenta.nuevos > 0 }
      : clave === 'productos' && cuenta.agotados ? { n: cuenta.agotados, urgente: false } : null;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">

      {/* ── TOPBAR CELULAR ─────────────────────────────── */}
      <header className="md:hidden fixed top-0 inset-x-0 z-40 bg-[#141414] border-b border-white/5 flex items-center justify-between px-4 h-14">
        <button onClick={() => setSidebarOpen(true)} className="p-1 text-white/60" aria-label="Abrir menú">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <span className="font-extrabold text-brand">Fredy&apos;s · Panel</span>
        <div className="w-8" />
      </header>

      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-50 md:hidden" onClick={() => setSidebarOpen(false)} />
            <motion.aside initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 35 }}
              className="fixed left-0 top-0 bottom-0 w-72 bg-[#161616] z-50 flex flex-col md:hidden shadow-2xl">
              <Barra pathname={pathname} logout={logout} badge={badge} email={emailDe(token)} onNav={() => setSidebarOpen(false)} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* ── BARRA LATERAL (computadora) ───────────────── */}
      <aside className="hidden md:flex fixed left-3 top-3 bottom-3 w-[244px] rounded-[28px] bg-[#161616] flex-col z-30 overflow-hidden">
        <Barra pathname={pathname} logout={logout} badge={badge} email={emailDe(token)} />
      </aside>

      <main className="md:ml-[268px] pt-14 md:pt-0 pb-20 md:pb-0 min-h-screen overflow-auto">
        {children}
      </main>

      {/* ── BARRA DE ABAJO (celular) ──────────────────── */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-[#141414] border-t border-white/5 flex">
        {TODOS.map((item) => {
          const b = badge(item.clave), activo = pathname === item.href;
          return (
            <Link key={item.href} href={item.href}
              className={`relative flex-1 flex flex-col items-center justify-center py-2 gap-1 text-[11px] font-semibold ${activo ? 'text-brand' : 'text-white/45'}`}>
              <Icono de={item.clave} />
              {item.label}
              {b && <span className={`absolute right-[22%] top-1 min-w-[18px] rounded-full px-1 text-center text-[10px] font-extrabold leading-[18px] ${b.urgente ? 'bg-yellow-400 text-black' : 'bg-white/15 text-white'}`}>{b.n}</span>}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

function Barra({ pathname, logout, badge, email, onNav }: {
  pathname: string; logout: () => void; email: string; onNav?: () => void;
  badge: (c: Clave) => { n: number; urgente: boolean } | null;
}) {
  const estado = useEstadoLocal();
  return (
    <>
      {/* Marca y estado del local */}
      <div className="p-5 pb-4">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="" className="h-11 w-11 rounded-2xl bg-white/[0.04] object-contain p-1" />
          <div>
            <p className="text-lg font-extrabold leading-tight text-brand">Fredy&apos;s</p>
            <p className="text-[11px] text-white/35">Panel del local</p>
          </div>
        </div>
        {estado && (
          <p className={`mt-4 flex items-center gap-2 rounded-2xl px-3 py-2 text-xs font-bold ${estado.abierto ? 'bg-green-500/10 text-green-300' : 'bg-white/[0.05] text-white/50'}`}>
            <span className={`h-2 w-2 shrink-0 rounded-full ${estado.abierto ? 'bg-green-400' : 'bg-white/30'}`} />
            {estado.corto}
          </p>
        )}
      </div>

      {/* Secciones */}
      <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-2">
        {NAV.map((g) => (
          <div key={g.grupo}>
            <p className="px-3 pb-2 text-[10px] font-extrabold uppercase tracking-[0.18em] text-white/25">{g.grupo}</p>
            <div className="space-y-1">
              {g.items.map((item) => {
                const activo = pathname === item.href, b = badge(item.clave);
                return (
                  <Link key={item.href} href={item.href} onClick={onNav} title={item.ayuda}
                    className={`group relative flex items-center gap-3 rounded-2xl px-3 py-2.5 transition-all ${
                      activo ? 'bg-brand text-black' : 'text-white/60 hover:bg-white/[0.05] hover:text-white'}`}>
                    <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${activo ? 'bg-black/10' : 'bg-white/[0.05] group-hover:bg-white/[0.08]'}`}>
                      <Icono de={item.clave} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-bold leading-tight">{item.label}</span>
                      <span className={`block truncate text-[11px] ${activo ? 'text-black/60' : 'text-white/30'}`}>{item.ayuda}</span>
                    </span>
                    {b && (
                      <span className={`relative flex h-6 min-w-[24px] items-center justify-center rounded-full px-1.5 text-[11px] font-extrabold ${
                        b.urgente ? 'bg-yellow-400 text-black' : activo ? 'bg-black/15 text-black' : 'bg-white/10 text-white/80'}`}
                        title={item.clave === 'pedidos' ? 'Pedidos por atender' : 'Productos agotados'}>
                        {b.urgente && <span className="absolute inset-0 animate-ping rounded-full bg-yellow-400/60" />}
                        <span className="relative">{b.n}</span>
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Ver la web y cuenta */}
      <div className="space-y-2 p-3">
        <a href="/" target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-3 rounded-2xl bg-white/[0.04] px-3 py-3 text-sm font-semibold text-white/70 hover:bg-white/[0.07] hover:text-white">
          <Icono de="web" className="h-[18px] w-[18px]" /> Ver la web
          <span className="ml-auto text-[11px] text-white/30">como cliente</span>
        </a>
        <div className="flex items-center gap-3 rounded-2xl px-3 py-2">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand/20 text-sm font-extrabold text-brand">
            {(email[0] ?? 'A').toUpperCase()}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-xs font-bold">Administrador</span>
            <span className="block truncate text-[11px] text-white/35">{email}</span>
          </span>
          <button onClick={logout} title="Cerrar sesión" aria-label="Cerrar sesión"
            className="flex h-9 w-9 items-center justify-center rounded-xl text-white/40 hover:bg-red-500/10 hover:text-red-400">
            <Icono de="salir" className="h-[18px] w-[18px]" />
          </button>
        </div>
      </div>
    </>
  );
}
