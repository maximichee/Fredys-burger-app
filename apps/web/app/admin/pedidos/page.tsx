'use client';
import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { adminFetch } from '@/lib/api';
import { formatPrice } from '@/lib/utils';
import { useOrdersSocket } from '@/lib/use-orders-socket';
import { useOrderSound } from '@/lib/use-order-sound';
import type { Order, OrderStatus } from '@fredys/types';
import { useAviso } from '@/components/admin/Controles';
import { mensajePara, linkWa, leerDatosLocal, guardarDatosLocal, type DatosLocal } from '@/lib/mensajes-wa';


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
// Los que retiran no pasan por "En camino"
const siguiente = (o: Order) =>
  o.deliveryMethod === 'PICKUP' && o.status === 'READY' ? 'DELIVERED' : NEXT_STATUS[o.status as OrderStatus];

const TEXTO_BOTON: Partial<Record<OrderStatus, string>> = {
  CONFIRMED: 'Confirmar pedido', PREPARING: 'Pasar a preparando', READY: 'Marcar listo',
  DELIVERING: 'Salió el delivery', DELIVERED: 'Marcar entregado',
};

type Tab = 'atender' | 'pagados' | 'cancelados';
const TABS: { id: Tab; label: string }[] = [
  { id: 'atender', label: '🔔 Por atender' },
  { id: 'pagados', label: '✅ Pagados' },
  { id: 'cancelados', label: 'Cancelados' },
];

/** Por atender: nuevos y aceptados sin pagar. Aceptado y pagado (o ya entregado) pasa a Pagados */
function tabDe(o: Order): Tab {
  if (o.status === 'CANCELLED') return 'cancelados';
  if (o.status === 'DELIVERED' || (o.paidAt && o.status !== 'PENDING')) return 'pagados';
  return 'atender';
}

/** Agrupa por día: "Hoy", "Ayer", "lunes 8 de noviembre" (la lista viene del más nuevo al más viejo) */
function porDia(lista: Order[]) {
  const hoy = new Date().toDateString(); const ayer = new Date(Date.now() - 864e5).toDateString();
  const grupos: { clave: string; titulo: string; pedidos: Order[] }[] = [];
  for (const o of lista) {
    const d = new Date(o.createdAt); const clave = d.toDateString();
    let g = grupos.find((x) => x.clave === clave);
    if (!g) {
      const titulo = clave === hoy ? 'Hoy' : clave === ayer ? 'Ayer'
        : d.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' }).replace(/^./, (c) => c.toUpperCase());
      grupos.push(g = { clave, titulo, pedidos: [] });
    }
    g.pedidos.push(o);
  }
  return grupos;
}

/** El próximo paso del pedido, con el texto del botón y si manda WhatsApp al cliente */
function paso(o: Order, local: DatosLocal) {
  const estado = siguiente(o);
  if (!estado) return null;
  const wa = !!mensajePara(estado, o, local);
  const retira = o.deliveryMethod === 'PICKUP';
  const texto: Partial<Record<OrderStatus, string>> = {
    CONFIRMED: '📲 Confirmar y mandar WhatsApp',
    PREPARING: '👨‍🍳 Empezar a preparar',
    READY: retira ? '📲 Está listo: avisarle' : '✅ Está listo',
    DELIVERING: '📲 Salió el delivery: avisarle',
    DELIVERED: retira ? '✅ Ya lo retiró' : '✅ Entregado',
  };
  return { estado, wa, texto: texto[estado] ?? STATUS_LABELS[estado] };
}

export default function AdminPedidosPage() {
  const [orders, setOrders]   = useState<Order[]>([]);
  const [tab, setTab] = useState<Tab>('atender');
  const { avisar: avisarToast, Aviso } = useAviso();
  const [selected, setSelected] = useState<Order | null>(null);
  const [local, setLocal] = useState<DatosLocal>({ direccion: '', alias: '' });
  const [verDatos, setVerDatos] = useState(false);
  useEffect(() => { setLocal(leerDatosLocal()); }, []);
  const cambiarLocal = (d: DatosLocal) => { setLocal(d); guardarDatosLocal(d); };
  const playSound = useOrderSound();
  const token = typeof window !== 'undefined' ? localStorage.getItem('admin_token') ?? '' : '';

  const load = useCallback(() => {
    adminFetch<Order[]>('/orders', token).then(setOrders).catch(console.error);
  }, [token]);

  // Polling de respaldo cada 60s
  useEffect(() => { load(); const id = setInterval(load, 60000); return () => clearInterval(id); }, [load]);

  // Pedidos en vivo (revisa cada 8 s): suena al llegar uno nuevo
  useOrdersSocket({
    onNewOrder: () => { load(); playSound(); },
    onOrderUpdated: (updated) => {
      setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
      setSelected((prev) => (prev?.id === updated.id ? updated : prev));
    },
  });

  const filtered = orders.filter((o) => tabDe(o) === tab);
  const grupos = porDia(filtered);

  /** "Recibí el pago": si ya estaba aceptado, pasa a la pestaña Pagados */
  const marcarPago = async (order: Order, pagado: boolean) => {
    try {
      const o = await adminFetch<Order>(`/orders/${order.id}/pago`, token, { method: 'PATCH', body: JSON.stringify({ pagado }) });
      setOrders((prev) => prev.map((x) => (x.id === o.id ? o : x)));
      setSelected((prev) => (prev?.id === o.id ? o : prev));
      if (pagado && tabDe(o) === 'pagados') avisarToast(`Pedido de ${o.customerName.split(' ')[0]} pasó a "Pagados"`);
    } catch (e) { avisarToast((e as Error).message, true); }
  };

  /** Cambia el estado y, si corresponde, abre WhatsApp con el mensaje para el cliente ya escrito */
  const pasarA = async (order: Order, estado: OrderStatus, avisar: boolean) => {
    const texto = avisar ? mensajePara(estado, order, local) : null;
    // Se abre antes de esperar al servidor: si no, el navegador lo bloquea como ventana emergente
    if (texto) window.open(linkWa(order, texto), '_blank');
    try {
      await adminFetch(`/orders/${order.id}/status`, token, { method: 'PATCH', body: JSON.stringify({ status: estado }) });
      setOrders((prev) => prev.map((o) => (o.id === order.id ? { ...o, status: estado } : o)));
      setSelected(estado === 'CANCELLED' ? null : { ...order, status: estado });
    } catch (e) {
      alert(`No se pudo cambiar el estado: ${(e as Error).message}`);
    }
  };

  const cancel = (order: Order, avisar: boolean) => {
    if (!confirm(avisar ? '¿Cancelar este pedido y avisarle al cliente?' : '¿Cancelar este pedido sin avisar?')) return;
    pasarA(order, 'CANCELLED', avisar);
  };

  return (
    <div className="p-4 sm:p-6 lg:h-screen flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold">Pedidos</h1>
        <div className="flex items-center gap-4">
          <button onClick={() => setVerDatos((v) => !v)} className="text-white/40 hover:text-white text-sm transition-colors">
            ⚙ Datos
          </button>
          <button onClick={load} className="text-white/40 hover:text-white text-sm transition-colors" aria-label="Actualizar" title="Actualizar">↻</button>
        </div>
      </div>

      <p className="rounded-2xl border border-green-500/20 bg-green-500/10 px-4 py-3 text-sm text-green-200">
        Cuando llega un pedido, tocá el <b>botón verde 📲</b>: se abre WhatsApp con el mensaje para el cliente ya escrito. Solo tocás <b>Enviar</b>.
      </p>

      {(verDatos || (!local.direccion && !local.alias)) && (
        <div className="grid gap-3 rounded-2xl border border-white/5 bg-dark-100 p-4 sm:grid-cols-2">
          <p className="text-xs text-white/45 sm:col-span-2">
            Estos datos van en los mensajes de WhatsApp que le mandás al cliente. Se guardan en este navegador.
          </p>
          <label className="space-y-1 text-xs font-bold text-white/50">
            Dirección para retirar
            <input value={local.direccion} onChange={(e) => cambiarLocal({ ...local, direccion: e.target.value })}
              placeholder="Ej: San Martín 1234"
              className="w-full rounded-xl border border-white/10 bg-dark-200 px-3 py-2 text-sm font-normal text-white focus:border-brand focus:outline-none" />
          </label>
          <label className="space-y-1 text-xs font-bold text-white/50">
            Alias para transferencias
            <input value={local.alias} onChange={(e) => cambiarLocal({ ...local, alias: e.target.value })}
              placeholder="Ej: fredys.burger.mp"
              className="w-full rounded-xl border border-white/10 bg-dark-200 px-3 py-2 text-sm font-normal text-white focus:border-brand focus:outline-none" />
          </label>
        </div>
      )}

      {/* Pestañas: lo que hay que atender queda solo; lo pagado y lo cancelado va aparte */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar">
        {TABS.map((t) => {
          const n = orders.filter((o) => tabDe(o) === t.id).length;
          return (
            <button key={t.id} onClick={() => { setTab(t.id); setSelected(null); }}
              className={`flex-shrink-0 rounded-full px-4 py-2 text-sm font-bold transition-all ${
                tab === t.id ? 'bg-brand text-black' : 'bg-dark-200 text-white/50 hover:text-white'}`}>
              {t.label} <span className="ml-1 opacity-60">{n}</span>
            </button>
          );
        })}
      </div>

      <div className="flex-1 grid lg:grid-cols-[1fr_360px] gap-4 min-h-0 lg:overflow-hidden">
        {/* Lista */}
        <div className="space-y-2 lg:overflow-y-auto lg:pr-1">
          {grupos.map((g) => (
          <section key={g.clave} className="space-y-2">
            <h3 className="sticky top-0 z-10 flex items-baseline justify-between bg-[#0a0a0a] py-2 text-sm font-extrabold">
              {g.titulo}
              <span className="text-xs font-semibold normal-case text-white/40">
                {g.pedidos.length} pedido{g.pedidos.length > 1 ? 's' : ''}{tab !== 'cancelados' ? ` · ${formatPrice(g.pedidos.reduce((s, o) => s + o.total, 0))}` : ''}
              </span>
            </h3>
          {g.pedidos.map((order) => { const p = paso(order, local); const debePago = !order.paidAt && !['PENDING', 'CANCELLED'].includes(order.status); return (
            <div key={order.id} role="button" tabIndex={0} onClick={() => setSelected(order)}
              onKeyDown={(e) => e.key === 'Enter' && setSelected(order)}
              className={`w-full cursor-pointer text-left bg-dark-100 border rounded-2xl p-4 transition-all hover:border-white/15 ${
                selected?.id === order.id ? 'border-brand/50' : order.status === 'PENDING' ? 'border-yellow-500/40' : 'border-white/5'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-bold text-sm">
                    {order.status === 'PENDING' && <span className="mr-2 rounded bg-yellow-400 px-1.5 py-0.5 text-[10px] font-extrabold text-black">NUEVO</span>}
                    {order.customerName}
                  </p>
                  <p className="text-white/40 text-xs">{order.deliveryMethod === 'PICKUP' ? 'Retira' : 'Delivery'} · {order.items?.reduce((s, i) => s + i.quantity, 0) ?? 0} productos</p>
                  <p className="text-white/40 text-xs mt-0.5">{order.code}</p>
                  <p className="text-white/30 text-xs">{new Date(order.createdAt).toLocaleString('es-AR')}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold border ${STATUS_COLORS[order.status as OrderStatus]}`}>
                    {STATUS_LABELS[order.status as OrderStatus]}
                  </span>
                  <p className="text-brand font-bold text-sm mt-1">{formatPrice(order.total)}</p>
                  {order.paidAt && <p className="mt-1 text-xs font-bold text-green-400">💰 Pagado</p>}
                </div>
              </div>
              {debePago && (
                <button onClick={(e) => { e.stopPropagation(); marcarPago(order, true); }}
                  className="mt-3 w-full rounded-xl border border-green-500/40 bg-green-500/10 py-2.5 text-sm font-bold text-green-300 hover:bg-green-500/20">
                  💰 Recibí el pago {order.paymentMethod === 'CASH' ? '(efectivo)' : '(transferencia)'}
                </button>
              )}
              {p && (
                <div className="mt-2 flex gap-2" onClick={(e) => e.stopPropagation()}>
                  <button onClick={() => pasarA(order, p.estado, p.wa)}
                    className={`flex-1 rounded-xl py-2.5 text-sm font-bold text-black transition-colors ${
                      p.wa ? 'bg-green-500 hover:bg-green-400' : 'bg-brand hover:bg-brand-strong'}`}>
                    {p.texto}
                  </button>
                  <button onClick={() => setSelected(order)}
                    className="rounded-xl border border-white/10 px-3 text-xs font-bold text-white/50 hover:text-white">
                    Ver
                  </button>
                </div>
              )}
            </div>
          ); })}
          </section>
          ))}
          {filtered.length === 0 && (
            <div className="text-center text-white/30 py-16 text-sm">
              {tab === 'atender' ? 'Nada pendiente por ahora 🙌' : 'Todavía no hay pedidos acá'}
            </div>
          )}
        </div>

        {/* Detalle */}
        <AnimatePresence mode="wait">
          {selected && (
            <motion.div key={selected.id}
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-dark-100 p-5 pb-24 overflow-y-auto space-y-4 lg:static lg:z-auto lg:border lg:border-white/5 lg:rounded-2xl lg:pb-5"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="font-extrabold text-lg">{selected.customerName}</h2>
                  <p className="text-white/40 text-xs">{selected.code}</p>
                </div>
                <button onClick={() => setSelected(null)} className="text-white/30 hover:text-white">✕</button>
              </div>

              <div className="space-y-1 text-sm text-white/60">
                <p>📱 {selected.customerPhone}{' '}
                  <a href={linkWa(selected)} target="_blank" rel="noopener noreferrer" className="ml-1 text-green-400 underline">abrir chat</a>
                </p>
                {selected.address && <p>📍 {selected.address}</p>}
                <p>💳 {selected.paymentMethod === 'CASH' ? 'Efectivo' : 'Transferencia'}
                  {selected.paidAt
                    ? <> · <b className='text-green-400'>pagado</b> <button onClick={() => marcarPago(selected, false)} className='ml-1 text-xs text-white/35 underline hover:text-white'>deshacer</button></>
                    : selected.status !== 'CANCELLED' && <> · <button onClick={() => marcarPago(selected, true)} className='text-green-400 underline'>marcar pagado</button></>}
                </p>
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

              <Acciones pedido={selected} local={local} pasarA={pasarA} cancelar={cancel} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      {Aviso}
    </div>
  );
}

/** Botones del pedido: el principal cambia el estado y abre WhatsApp con el mensaje para el cliente */
function Acciones({
  pedido, local, pasarA, cancelar,
}: {
  pedido: Order; local: DatosLocal;
  pasarA: (o: Order, e: OrderStatus, avisar: boolean) => void;
  cancelar: (o: Order, avisar: boolean) => void;
}) {
  const p = paso(pedido, local);
  const abierto = !['DELIVERED', 'CANCELLED'].includes(pedido.status);

  return (
    <div className="space-y-2 border-t border-white/5 pt-4">
      {p && (
        <>
          <button onClick={() => pasarA(pedido, p.estado, p.wa)}
            className={`w-full rounded-xl py-3 font-bold text-black transition-colors ${
              p.wa ? 'bg-green-500 hover:bg-green-400' : 'bg-brand hover:bg-brand-strong'}`}>
            {p.texto}
          </button>
          {p.wa && (
            <button onClick={() => pasarA(pedido, p.estado, false)}
              className="w-full py-1 text-xs text-white/35 hover:text-white">
              {TEXTO_BOTON[p.estado]} sin mandar mensaje
            </button>
          )}
        </>
      )}
      {abierto && (
        <div className="flex gap-2 pt-1">
          <button onClick={() => cancelar(pedido, true)}
            className="flex-1 rounded-xl border border-red-600/20 bg-red-600/10 py-2.5 text-sm font-semibold text-red-400 transition-colors hover:bg-red-600/20">
            Cancelar y avisar
          </button>
          <button onClick={() => cancelar(pedido, false)}
            className="rounded-xl border border-white/10 px-3 py-2.5 text-xs text-white/40 hover:text-white">
            Cancelar sin avisar
          </button>
        </div>
      )}
    </div>
  );
}

