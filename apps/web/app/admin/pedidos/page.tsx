'use client';
import { useEffect, useMemo, useState, useCallback } from 'react';
import { adminFetch } from '@/lib/api';
import { formatPrice, horarioProgramado } from '@/lib/utils';
import { useOrdersSocket } from '@/lib/use-orders-socket';
import { useOrderSound } from '@/lib/use-order-sound';
import type { Order, OrderStatus } from '@fredys/types';
import { useAviso } from '@/components/admin/Controles';
import { tabDe, hace, type Tab } from '@/lib/estado-pedido';
import { mensajePara, linkWa, leerDatosLocal, guardarDatosLocal, type DatosLocal } from '@/lib/mensajes-wa';


const STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING: 'Pendiente', CONFIRMED: 'Confirmado', PREPARING: 'Preparando',
  READY: 'Listo', DELIVERING: 'En camino', DELIVERED: 'Entregado', CANCELLED: 'Cancelado',
};

const STATUS_COLORS: Record<OrderStatus, string> = {
  PENDING: 'bg-yellow-400 text-black', CONFIRMED: 'bg-blue-400/90 text-black', PREPARING: 'bg-orange-400 text-black',
  READY: 'bg-green-400 text-black', DELIVERING: 'bg-purple-400 text-black', DELIVERED: 'bg-white/15 text-white/70',
  CANCELLED: 'bg-red-500/80 text-white',
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

const TABS: { id: Tab; label: string }[] = [
  { id: 'atender', label: '🔔 Por atender' },
  { id: 'pagados', label: '✅ Pagados' },
  { id: 'cancelados', label: 'Cancelados' },
];


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

  const [busca, setBusca] = useState('');
  const filtered = useMemo(() => {
    const q = busca.trim().toLowerCase(), dig = q.replace(/\D/g, '');
    return orders.filter((o) => tabDe(o) === tab && (!q ||
      o.customerName.toLowerCase().includes(q) || o.code.toLowerCase().includes(q) ||
      (dig.length >= 3 && o.customerPhone.replace(/\D/g, '').includes(dig))));
  }, [orders, tab, busca]);
  const grupos = porDia(filtered);

  // En la computadora el detalle queda fijo a la derecha: si no hay nada elegido, se muestra el primero
  useEffect(() => {
    if (window.innerWidth < 1024) return;
    setSelected((s) => (s && filtered.some((o) => o.id === s.id) ? s : filtered[0] ?? null));
  }, [filtered]);

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
    <div className="mx-auto flex max-w-[1500px] flex-col gap-4 p-4 sm:p-6 lg:h-screen">
      {/* Encabezado */}
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="mr-2 text-2xl font-extrabold">Pedidos</h1>
        <span className="flex items-center gap-1.5 rounded-full bg-green-500/10 px-3 py-1 text-xs font-bold text-green-300">
          <span className="relative flex h-2 w-2"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-60" /><span className="relative h-2 w-2 rounded-full bg-green-400" /></span>
          En vivo
        </span>
        <div className="relative ml-auto w-full max-w-sm">
          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/30">⌕</span>
          <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar por nombre, teléfono o N°…"
            className="w-full rounded-full border border-white/10 bg-[#1c1c1c] py-2.5 pl-10 pr-4 text-sm placeholder:text-white/30 focus:border-brand focus:outline-none" />
        </div>
        <button onClick={() => setVerDatos((v) => !v)} className={`rounded-full px-4 py-2.5 text-sm font-bold ${verDatos ? 'bg-white text-black' : 'bg-[#232323] text-white/60 hover:text-white'}`}>
          ⚙ Datos del local
        </button>
        <button onClick={load} className="flex h-10 w-10 items-center justify-center rounded-full bg-[#232323] text-white/60 hover:text-white" aria-label="Actualizar" title="Actualizar">↻</button>
      </div>

      {(verDatos || (!local.direccion && !local.alias)) && (
        <div className="grid gap-3 rounded-[24px] bg-[#232323] p-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
          <label className="space-y-1 text-xs font-bold text-white/50">
            Dirección para retirar
            <input value={local.direccion} onChange={(e) => cambiarLocal({ ...local, direccion: e.target.value })} placeholder="Ej: San Martín 1234"
              className="w-full rounded-2xl border border-white/10 bg-[#2e2e2e] px-3.5 py-2.5 text-sm font-normal text-white focus:border-brand focus:outline-none" />
          </label>
          <label className="space-y-1 text-xs font-bold text-white/50">
            Alias para transferencias
            <input value={local.alias} onChange={(e) => cambiarLocal({ ...local, alias: e.target.value })} placeholder="Ej: fredys.burger.mp"
              className="w-full rounded-2xl border border-white/10 bg-[#2e2e2e] px-3.5 py-2.5 text-sm font-normal text-white focus:border-brand focus:outline-none" />
          </label>
          <p className="max-w-[220px] text-[11px] text-white/40">Van en los mensajes de WhatsApp al cliente. Se guardan en esta compu.</p>
        </div>
      )}

      {/* Pestañas */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
        {TABS.map((t) => {
          const n = orders.filter((o) => tabDe(o) === t.id).length;
          return (
            <button key={t.id} onClick={() => { setTab(t.id); setSelected(null); }}
              className={`flex-shrink-0 rounded-full px-5 py-2.5 text-sm font-bold transition-all ${
                tab === t.id ? 'bg-brand text-black' : 'bg-[#232323] text-white/55 hover:text-white'}`}>
              {t.label} <span className="ml-1 opacity-60">{n}</span>
            </button>
          );
        })}
        <p className="ml-auto hidden text-xs text-white/35 xl:block">El botón verde 📲 abre WhatsApp con el mensaje listo: solo tocás <b className="text-white/60">Enviar</b>.</p>
      </div>

      <div className="grid min-h-0 flex-1 gap-5 lg:grid-cols-[1fr_400px]">
        {/* Lista */}
        <div className="space-y-3 lg:overflow-y-auto lg:pr-2">
          {grupos.map((g) => (
            <section key={g.clave} className="space-y-2.5">
              <h3 className="sticky top-0 z-10 flex items-baseline justify-between bg-[#0a0a0a] py-2 text-sm font-extrabold">
                {g.titulo}
                <span className="text-xs font-semibold text-white/40">
                  {g.pedidos.length} pedido{g.pedidos.length > 1 ? 's' : ''}{tab !== 'cancelados' ? ` · ${formatPrice(g.pedidos.reduce((s, o) => s + o.total, 0))}` : ''}
                </span>
              </h3>
              {g.pedidos.map((order) => {
                const p = paso(order, local);
                const debePago = !order.paidAt && !['PENDING', 'CANCELLED'].includes(order.status);
                const sel = selected?.id === order.id;
                return (
                  <div key={order.id} role="button" tabIndex={0} onClick={() => setSelected(order)}
                    onKeyDown={(e) => e.key === 'Enter' && setSelected(order)}
                    className={`cursor-pointer rounded-[24px] bg-[#232323] p-4 transition-all hover:bg-[#282828] ${
                      sel ? 'ring-2 ring-brand' : order.status === 'PENDING' ? 'ring-1 ring-yellow-400/50' : ''}`}>
                    <div className="flex items-start gap-3">
                      <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-extrabold ${
                        order.status === 'PENDING' ? 'bg-yellow-400 text-black' : 'bg-brand/20 text-brand'}`}>
                        {order.customerName.trim()[0]?.toUpperCase()}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-x-2">
                          <p className="font-extrabold">{order.customerName}</p>
                          <span className="text-xs text-white/35">{hace(order.createdAt)} · #{order.code.slice(-5)}</span>
                        </div>
                        <p className="mt-0.5 truncate text-sm text-white/55">
                          {order.items?.map((i) => `${i.quantity}x ${i.productName}`).join(' · ')}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-1.5 text-[11px] font-bold">
                          <span className="rounded-full bg-white/[0.07] px-2.5 py-1 text-white/70">{order.deliveryMethod === 'PICKUP' ? '🏪 Retira' : '🛵 Delivery'}</span>
                          {order.scheduledFor && <span className="rounded-full bg-cyan-400/15 px-2.5 py-1 text-cyan-300">⏰ {horarioProgramado(order.scheduledFor)}</span>}
                          {order.paidAt
                            ? <span className="rounded-full bg-green-500/15 px-2.5 py-1 text-green-300">💰 Pagado</span>
                            : debePago && <span className="rounded-full bg-red-500/15 px-2.5 py-1 text-red-300">Falta el pago · {order.paymentMethod === 'CASH' ? 'efectivo' : 'transferencia'}</span>}
                          {order.notes && <span className="rounded-full bg-white/[0.07] px-2.5 py-1 text-white/60">📝 con aclaración</span>}
                          {!!order.discount && <span className="rounded-full bg-brand/15 px-2.5 py-1 text-brand">🏷️ {order.discountCode}</span>}
                        </div>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-lg font-extrabold tabular-nums">{formatPrice(order.total)}</p>
                        <span className={`mt-1 inline-block rounded-full px-2.5 py-1 text-[11px] font-bold ${STATUS_COLORS[order.status as OrderStatus]}`}>
                          {STATUS_LABELS[order.status as OrderStatus]}
                        </span>
                      </div>
                    </div>
                    {(p || debePago) && (
                      <div className="mt-3 flex gap-2 pl-14" onClick={(e) => e.stopPropagation()}>
                        {p && (
                          <button onClick={() => pasarA(order, p.estado, p.wa)}
                            className={`flex-1 rounded-full py-2.5 text-sm font-bold text-black transition-colors ${
                              p.wa ? 'bg-green-500 hover:bg-green-400' : 'bg-brand hover:bg-brand-strong'}`}>
                            {p.texto}
                          </button>
                        )}
                        {debePago && (
                          <button onClick={() => marcarPago(order, true)}
                            className="rounded-full border border-green-500/40 bg-green-500/10 px-4 py-2.5 text-sm font-bold text-green-300 hover:bg-green-500/20">
                            💰 Recibí el pago
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </section>
          ))}
          {filtered.length === 0 && (
            <div className="rounded-[24px] bg-[#1c1c1c] py-20 text-center text-sm text-white/35">
              {busca ? 'Ningún pedido coincide con la búsqueda' : tab === 'atender' ? 'Nada pendiente por ahora 🙌' : 'Todavía no hay pedidos acá'}
            </div>
          )}
        </div>

        {/* Detalle tipo ticket: fijo a la derecha en la compu, pantalla completa en el celular */}
        {selected ? (
          <aside className="fixed inset-0 z-50 overflow-y-auto bg-[#0a0a0a] p-3 lg:static lg:z-auto lg:bg-transparent lg:p-0">
            <Detalle pedido={selected} local={local} pasarA={pasarA} cancelar={cancel} marcarPago={marcarPago} cerrar={() => setSelected(null)} />
          </aside>
        ) : (
          <aside className="hidden items-center justify-center rounded-[28px] bg-[#1c1c1c] text-sm text-white/30 lg:flex">
            Elegí un pedido para ver el detalle
          </aside>
        )}
      </div>
      {Aviso}
    </div>
  );
}

/** Ticket con todo el pedido y sus acciones */
function Detalle({ pedido, local, pasarA, cancelar, marcarPago, cerrar }: {
  pedido: Order; local: DatosLocal;
  pasarA: (o: Order, e: OrderStatus, avisar: boolean) => void;
  cancelar: (o: Order, avisar: boolean) => void;
  marcarPago: (o: Order, pagado: boolean) => void;
  cerrar: () => void;
}) {
  const p = paso(pedido, local);
  const abierto = !['DELIVERED', 'CANCELLED'].includes(pedido.status);
  const retira = pedido.deliveryMethod === 'PICKUP';
  return (
    <div className="overflow-hidden rounded-[28px] bg-[#2b2b2b] lg:max-h-full lg:overflow-y-auto">
      <div className="m-3 rounded-[22px] bg-[#3a3a3a] p-4">
        <div className="flex items-start justify-between gap-2">
          <p className="text-xs font-extrabold uppercase tracking-widest text-white/70">{retira ? 'Retira en el local' : 'Dirección de entrega'}</p>
          <button onClick={cerrar} className="-mt-1 text-lg text-white/40 hover:text-white lg:hidden" aria-label="Cerrar">✕</button>
        </div>
        <p className="mt-2 text-sm text-white/85">📍 {retira ? 'Lo pasa a buscar' : pedido.address}</p>
        <p className="mt-1 text-sm text-white/65">
          {pedido.scheduledFor ? <b className="text-cyan-300">⏰ {retira ? 'Lo busca' : 'Entregar'} {horarioProgramado(pedido.scheduledFor)}</b> : <>🕑 Pidió {hace(pedido.createdAt)} · lo antes posible</>}
        </p>
        <p className="mt-1 text-sm text-white/65">
          📱 {pedido.customerPhone}
          <a href={linkWa(pedido)} target="_blank" rel="noopener noreferrer" className="ml-2 font-bold text-green-400 hover:underline">abrir chat</a>
        </p>
      </div>

      <div className="px-5">
        <div className="flex items-center justify-between py-2">
          <p className="text-lg font-extrabold">{pedido.customerName}</p>
          <p className="text-xs text-white/40">#{pedido.code.slice(-5)}</p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <span className={`rounded-full px-3 py-1 text-xs font-bold ${STATUS_COLORS[pedido.status as OrderStatus]}`}>{STATUS_LABELS[pedido.status as OrderStatus]}</span>
          <span className="rounded-full bg-white/[0.07] px-3 py-1 text-xs font-bold text-white/70">💳 {pedido.paymentMethod === 'CASH' ? 'Efectivo' : 'Transferencia'}</span>
          {pedido.paidAt
            ? <button onClick={() => marcarPago(pedido, false)} title="Tocá para deshacer" className="rounded-full bg-green-500/15 px-3 py-1 text-xs font-bold text-green-300">💰 Pagado · deshacer</button>
            : pedido.status !== 'CANCELLED' && <button onClick={() => marcarPago(pedido, true)} className="rounded-full border border-green-500/40 px-3 py-1 text-xs font-bold text-green-300 hover:bg-green-500/10">💰 Marcar pagado</button>}
        </div>

        <ul className="mt-4 space-y-3">
          {pedido.items?.map((i) => (
            <li key={i.id} className="flex items-center justify-between gap-3 text-sm">
              <span className="flex min-w-0 items-center gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white/[0.07] text-xs font-extrabold">{i.quantity}x</span>
                <span className="min-w-0">
                  <span className="block truncate font-semibold">{i.productName}</span>
                  <span className="text-xs capitalize text-white/40">{i.priceLabel}{i.comment ? ` · ${i.comment}` : ''}</span>
                </span>
              </span>
              <span className="shrink-0 font-bold tabular-nums">{formatPrice(i.subtotal)}</span>
            </li>
          ))}
        </ul>
        {pedido.notes && <p className="mt-4 rounded-2xl bg-yellow-400/10 px-3 py-2.5 text-sm text-yellow-100">📝 {pedido.notes}</p>}
      </div>

      <div className="relative my-5">
        <span className="absolute -left-3 top-1/2 h-6 w-6 -translate-y-1/2 rounded-full bg-[#0a0a0a]" />
        <span className="absolute -right-3 top-1/2 h-6 w-6 -translate-y-1/2 rounded-full bg-[#0a0a0a]" />
        <div className="mx-6 border-t-2 border-dashed border-white/15" />
      </div>

      <div className="space-y-2 px-5 pb-5 text-sm">
        <div className="flex justify-between text-white/60"><span>Subtotal</span><span>{formatPrice(pedido.subtotal)}</span></div>
        {!!pedido.discount && (
          <div className="flex justify-between text-brand"><span>🏷️ Descuento {pedido.discountCode}</span><span>−{formatPrice(pedido.discount)}</span></div>
        )}
        <div className="flex justify-between text-white/60"><span>Envío</span><span>{retira ? 'Retira' : formatPrice(pedido.deliveryCost)}</span></div>
        <div className="flex justify-between pt-1 text-xl font-extrabold"><span>TOTAL</span><span>{formatPrice(pedido.total)}</span></div>

        {p && (
          <div className="space-y-1 pt-3">
            <button onClick={() => pasarA(pedido, p.estado, p.wa)}
              className={`w-full rounded-full py-3.5 font-bold text-black transition-colors ${p.wa ? 'bg-green-500 hover:bg-green-400' : 'bg-brand hover:bg-brand-strong'}`}>
              {p.texto}
            </button>
            {p.wa && (
              <button onClick={() => pasarA(pedido, p.estado, false)} className="w-full py-1 text-xs text-white/35 hover:text-white">
                {TEXTO_BOTON[p.estado]} sin mandar mensaje
              </button>
            )}
          </div>
        )}
        {abierto && (
          <div className="flex gap-2 pt-1">
            <button onClick={() => cancelar(pedido, true)}
              className="flex-1 rounded-full border border-red-500/30 py-2.5 text-xs font-bold text-red-300 hover:bg-red-500/10">Cancelar y avisar</button>
            <button onClick={() => cancelar(pedido, false)}
              className="rounded-full bg-white/[0.06] px-4 py-2.5 text-xs text-white/45 hover:text-white">Sin avisar</button>
          </div>
        )}
      </div>
    </div>
  );
}
