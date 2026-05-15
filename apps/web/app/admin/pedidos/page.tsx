'use client';
import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { adminFetch } from '@/lib/api';
import { formatPrice } from '@/lib/utils';
import { useOrdersSocket } from '@/lib/use-orders-socket';
import { useOrderSound } from '@/lib/use-order-sound';
import type { Order, OrderStatus } from '@fredys/types';

const ALL_STATUSES: OrderStatus[] = ['PENDING','CONFIRMED','PREPARING','READY','DELIVERING','DELIVERED','CANCELLED'];

const STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING: 'Pendiente', CONFIRMED: 'Confirmado', PREPARING: 'Preparando',
  READY: 'Listo', DELIVERING: 'En camino', DELIVERED: 'Entregado', CANCELLED: 'Cancelado',
};

const STATUS_COLORS: Record<OrderStatus, string> = {
  PENDING: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/20',
  CONFIRMED: 'bg-blue-500/15 text-blue-400 border-blue-500/20',
  PREPARING: 'bg-orange-500/15 text-orange-400 border-orange-500/20',
  READY: 'bg-green-500/15 text-green-400 border-green-500/20',
  DELIVERING: 'bg-purple-500/15 text-purple-400 border-purple-500/20',
  DELIVERED: 'bg-emerald-700/15 text-emerald-500 border-emerald-700/20',
  CANCELLED: 'bg-red-500/15 text-red-400 border-red-500/20',
};

const NEXT_STATUS: Partial<Record<OrderStatus, OrderStatus>> = {
  PENDING: 'CONFIRMED', CONFIRMED: 'PREPARING', PREPARING: 'READY',
  READY: 'DELIVERING', DELIVERING: 'DELIVERED',
};

export default function AdminPedidosPage() {
  const [orders, setOrders]   = useState<Order[]>([]);
  const [filter, setFilter]   = useState<OrderStatus | 'ALL'>('ALL');
  const [selected, setSelected] = useState<Order | null>(null);
  const playSound = useOrderSound();
  const token = typeof window !== 'undefined' ? localStorage.getItem('admin_token') ?? '' : '';

  const load = useCallback(() => {
    adminFetch<Order[]>('/orders', token).then(setOrders).catch(console.error);
  }, [token]);

  // Polling de respaldo cada 60s
  useEffect(() => { load(); const id = setInterval(load, 60000); return () => clearInterval(id); }, [load]);

  // WebSocket: auto-refresh al llegar nuevo pedido o actualización
  useOrdersSocket({
    onNewOrder: () => { load(); playSound(); },
    onOrderUpdated: (updated) => {
      setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
      setSelected((prev) => (prev?.id === updated.id ? updated : prev));
    },
  });

  const filtered = filter === 'ALL' ? orders : orders.filter((o) => o.status === filter);

  const advanceStatus = async (order: Order) => {
    const next = NEXT_STATUS[order.status as OrderStatus];
    if (!next) return;
    await adminFetch(`/orders/${order.id}/status`, token, { method: 'PATCH', body: JSON.stringify({ status: next }) });
    load();
    if (selected?.id === order.id) setSelected({ ...order, status: next });
  };

  const cancel = async (order: Order) => {
    if (!confirm('¿Cancelar este pedido?')) return;
    await adminFetch(`/orders/${order.id}/status`, token, { method: 'PATCH', body: JSON.stringify({ status: 'CANCELLED' }) });
    load();
    setSelected(null);
  };

  return (
    <div className="p-6 h-screen flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold">Pedidos</h1>
        <button onClick={load} className="text-white/40 hover:text-white text-sm transition-colors">↻ Actualizar</button>
      </div>

      {/* Filtros */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar">
        {(['ALL', ...ALL_STATUSES] as const).map((s) => (
          <button key={s} onClick={() => setFilter(s)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
              filter === s ? 'bg-brand text-black' : 'bg-dark-200 text-white/50 hover:text-white'
            }`}>
            {s === 'ALL' ? 'Todos' : STATUS_LABELS[s]}
            <span className="ml-1 opacity-60">
              {s === 'ALL' ? orders.length : orders.filter((o) => o.status === s).length}
            </span>
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-hidden grid lg:grid-cols-[1fr_360px] gap-4 min-h-0">
        {/* Lista */}
        <div className="overflow-y-auto space-y-2 pr-1">
          {filtered.map((order) => (
            <button key={order.id} onClick={() => setSelected(order)}
              className={`w-full text-left bg-dark-100 border rounded-2xl p-4 transition-all hover:border-white/15 ${
                selected?.id === order.id ? 'border-brand/50' : 'border-white/5'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-bold text-sm">{order.customerName}</p>
                  <p className="text-white/40 text-xs mt-0.5">{order.code}</p>
                  <p className="text-white/30 text-xs">{new Date(order.createdAt).toLocaleString('es-AR')}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold border ${STATUS_COLORS[order.status as OrderStatus]}`}>
                    {STATUS_LABELS[order.status as OrderStatus]}
                  </span>
                  <p className="text-brand font-bold text-sm mt-1">{formatPrice(order.total)}</p>
                </div>
              </div>
            </button>
          ))}
          {filtered.length === 0 && (
            <div className="text-center text-white/30 py-16 text-sm">No hay pedidos con este filtro</div>
          )}
        </div>

        {/* Detalle */}
        <AnimatePresence mode="wait">
          {selected && (
            <motion.div key={selected.id}
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
              className="bg-dark-100 border border-white/5 rounded-2xl p-5 overflow-y-auto space-y-4"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="font-extrabold text-lg">{selected.customerName}</h2>
                  <p className="text-white/40 text-xs">{selected.code}</p>
                </div>
                <button onClick={() => setSelected(null)} className="text-white/30 hover:text-white">✕</button>
              </div>

              <div className="space-y-1 text-sm text-white/60">
                <p>📱 {selected.customerPhone}</p>
                {selected.address && <p>📍 {selected.address}</p>}
                <p>💳 {selected.paymentMethod === 'CASH' ? 'Efectivo' : 'Transferencia'}</p>
                <p>🛵 {selected.deliveryMethod === 'PICKUP' ? 'Retiro en local' : 'Delivery'}</p>
              </div>

              <div className="space-y-2 border-t border-white/5 pt-4">
                <p className="text-xs font-bold text-white/40 uppercase tracking-wider">Productos</p>
                {selected.items?.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span>{item.productName} <span className="text-white/40">({item.priceLabel}) x{item.quantity}</span></span>
                    <span className="text-brand font-bold">{formatPrice(item.subtotal)}</span>
                  </div>
                ))}
              </div>

              <div className="border-t border-white/5 pt-4 space-y-1 text-sm">
                <div className="flex justify-between text-white/50"><span>Subtotal</span><span>{formatPrice(selected.subtotal)}</span></div>
                <div className="flex justify-between text-white/50"><span>Envío</span><span>{formatPrice(selected.deliveryCost)}</span></div>
                <div className="flex justify-between font-extrabold text-brand text-base"><span>Total</span><span>{formatPrice(selected.total)}</span></div>
              </div>

              {selected.notes && (
                <div className="bg-dark-200 rounded-xl p-3 text-sm text-white/60">
                  <p className="text-xs font-bold text-white/30 mb-1">OBSERVACIONES</p>
                  {selected.notes}
                </div>
              )}

              <div className="space-y-2 pt-2">
                {NEXT_STATUS[selected.status as OrderStatus] && (
                  <button onClick={() => advanceStatus(selected)}
                    className="w-full bg-brand text-black font-bold py-3 rounded-xl hover:bg-brand-strong transition-colors">
                    → {STATUS_LABELS[NEXT_STATUS[selected.status as OrderStatus]!]}
                  </button>
                )}
                {!['DELIVERED','CANCELLED'].includes(selected.status) && (
                  <button onClick={() => cancel(selected)}
                    className="w-full bg-red-600/10 text-red-400 border border-red-600/20 font-semibold py-2.5 rounded-xl hover:bg-red-600/20 transition-colors text-sm">
                    Cancelar pedido
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
