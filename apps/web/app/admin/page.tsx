'use client';
import { useEffect, useState } from 'react';
import { adminFetch } from '@/lib/api';
import type { Order, Product } from '@fredys/types';

const STATUS_COLORS: Record<string, string> = {
  PENDING:    'bg-yellow-500/15 text-yellow-400',
  CONFIRMED:  'bg-blue-500/15 text-blue-400',
  PREPARING:  'bg-orange-500/15 text-orange-400',
  READY:      'bg-green-500/15 text-green-400',
  DELIVERING: 'bg-purple-500/15 text-purple-400',
  DELIVERED:  'bg-green-700/15 text-green-600',
  CANCELLED:  'bg-red-500/15 text-red-400',
};

const STATUS_LABELS: Record<string, string> = {
  PENDING:    'Pendiente',
  CONFIRMED:  'Confirmado',
  PREPARING:  'Preparando',
  READY:      'Listo',
  DELIVERING: 'En camino',
  DELIVERED:  'Entregado',
  CANCELLED:  'Cancelado',
};

export default function AdminDashboard() {
  const [orders, setOrders]     = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const token = typeof window !== 'undefined' ? localStorage.getItem('admin_token') ?? '' : '';

  useEffect(() => {
    if (!token) return;
    adminFetch<Order[]>('/orders', token).then(setOrders).catch(console.error);
    adminFetch<Product[]>('/products', token).then(setProducts).catch(console.error);
  }, [token]);

  const today = orders.filter((o) => {
    const d = new Date(o.createdAt);
    const now = new Date();
    return d.toDateString() === now.toDateString();
  });
  const todayRevenue = today.filter((o) => o.status !== 'CANCELLED').reduce((s, o) => s + o.total, 0);
  const pending = orders.filter((o) => o.status === 'PENDING').length;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-extrabold">Dashboard</h1>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Pedidos hoy',    value: today.length,         icon: '📦' },
          { label: 'Pendientes',     value: pending,              icon: '⏳', urgent: pending > 0 },
          { label: 'Total hoy',      value: `$${todayRevenue.toLocaleString('es-AR')}`, icon: '💰' },
          { label: 'Productos',      value: products.length,      icon: '🍔' },
        ].map((stat) => (
          <div key={stat.label} className={`bg-dark-100 border rounded-2xl p-4 ${stat.urgent ? 'border-brand/40' : 'border-white/5'}`}>
            <p className="text-2xl mb-1">{stat.icon}</p>
            <p className="text-2xl font-extrabold">{stat.value}</p>
            <p className="text-white/40 text-sm">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Últimos pedidos */}
      <div className="bg-dark-100 border border-white/5 rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-white/5">
          <h2 className="font-bold">Últimos pedidos</h2>
        </div>
        <div className="divide-y divide-white/5">
          {orders.slice(0, 10).map((order) => (
            <div key={order.id} className="flex items-center gap-4 px-4 py-3 text-sm">
              <div className="flex-1 min-w-0">
                <p className="font-semibold truncate">{order.customerName}</p>
                <p className="text-white/40 text-xs">{order.code} · {new Date(order.createdAt).toLocaleString('es-AR')}</p>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${STATUS_COLORS[order.status]}`}>
                {STATUS_LABELS[order.status]}
              </span>
              <span className="font-bold text-brand">${order.total.toLocaleString('es-AR')}</span>
            </div>
          ))}
          {orders.length === 0 && (
            <p className="text-center text-white/30 py-8 text-sm">No hay pedidos todavía</p>
          )}
        </div>
      </div>
    </div>
  );
}
