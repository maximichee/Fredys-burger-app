'use client';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

const NAV = [
  { href: '/admin',            label: 'Dashboard', icon: '📊' },
  { href: '/admin/pedidos',    label: 'Pedidos',   icon: '📦' },
  { href: '/admin/productos',  label: 'Productos', icon: '🍔' },
  { href: '/admin/categorias', label: 'Categorías',icon: '📂' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router   = useRouter();
  const pathname = usePathname();
  const [token,       setToken]       = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const t = localStorage.getItem('admin_token');
    if (!t && pathname !== '/admin/login') router.push('/admin/login');
    else setToken(t);
  }, [pathname, router]);

  const logout = () => {
    localStorage.removeItem('admin_token');
    router.push('/admin/login');
  };

  if (pathname === '/admin/login') return <>{children}</>;
  if (!token) return null;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">

      {/* ── TOPBAR MOBILE ─────────────────────────────── */}
      <header className="md:hidden fixed top-0 inset-x-0 z-40 bg-dark-100 border-b border-white/5 flex items-center justify-between px-4 h-14">
        <button onClick={() => setSidebarOpen(true)} className="p-1 text-white/60">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <span className="font-extrabold text-brand">Fredys Admin</span>
        <div className="w-8" />
      </header>

      {/* ── SIDEBAR OVERLAY MOBILE ────────────────────── */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-50 md:hidden"
              onClick={() => setSidebarOpen(false)}
            />
            <motion.aside
              initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 35 }}
              className="fixed left-0 top-0 bottom-0 w-64 bg-dark-100 z-50 flex flex-col md:hidden shadow-2xl"
            >
              <SidebarContent pathname={pathname} logout={logout} onNav={() => setSidebarOpen(false)} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* ── SIDEBAR DESKTOP (siempre visible) ────────── */}
      <aside className="hidden md:flex fixed left-0 top-0 bottom-0 w-56 bg-dark-100 border-r border-white/5 flex-col z-30">
        <SidebarContent pathname={pathname} logout={logout} />
      </aside>

      {/* ── CONTENIDO PRINCIPAL ───────────────────────── */}
      <main className="md:ml-56 pt-14 md:pt-0 pb-20 md:pb-0 min-h-screen overflow-auto">
        {children}
      </main>

      {/* ── BOTTOM NAV MOBILE ─────────────────────────── */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-dark-100 border-t border-white/5 flex">
        {NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex-1 flex flex-col items-center justify-center py-2 gap-0.5 text-xs font-semibold transition-colors ${
              pathname === item.href ? 'text-brand' : 'text-white/40'
            }`}
          >
            <span className="text-xl leading-none">{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>

    </div>
  );
}

function SidebarContent({
  pathname, logout, onNav,
}: {
  pathname: string;
  logout: () => void;
  onNav?: () => void;
}) {
  return (
    <>
      <div className="p-5 border-b border-white/5">
        <p className="font-extrabold text-brand text-lg">Fredys</p>
        <p className="text-white/30 text-xs">Panel Admin</p>
      </div>
      <nav className="flex-1 p-3 space-y-1">
        {NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNav}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              pathname === item.href
                ? 'bg-brand/15 text-brand'
                : 'text-white/50 hover:text-white hover:bg-white/5'
            }`}
          >
            <span>{item.icon}</span>{item.label}
          </Link>
        ))}
      </nav>
      <div className="p-3 border-t border-white/5">
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-white/40 hover:text-red-400 hover:bg-red-400/5 transition-all"
        >
          🚪 Cerrar sesión
        </button>
      </div>
    </>
  );
}
