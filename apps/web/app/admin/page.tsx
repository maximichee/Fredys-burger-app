'use client';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { adminFetch } from '@/lib/api';
import { formatPrice, horarioProgramado, imgSrc } from '@/lib/utils';
import { useEstadoLocal } from '@/lib/use-estado-local';
import { tabDe, diaAR, hace } from '@/lib/estado-pedido';
import { token } from '@/components/admin/Controles';
import type { Category, Order, OrderStatus, Product } from '@fredys/types';

/* Resumen del panel, estilo "tarjetas redondeadas + ticket a la derecha". */

const ESTADO: Record<OrderStatus, { texto: string; clase: string }> = {
  PENDING:    { texto: 'Nuevo',      clase: 'bg-yellow-400 text-black' },
  CONFIRMED:  { texto: 'Confirmado', clase: 'bg-blue-400/90 text-black' },
  PREPARING:  { texto: 'Preparando', clase: 'bg-orange-400 text-black' },
  READY:      { texto: 'Listo',      clase: 'bg-green-400 text-black' },
  DELIVERING: { texto: 'En camino',  clase: 'bg-purple-400 text-black' },
  DELIVERED:  { texto: 'Entregado',  clase: 'bg-white/15 text-white/70' },
  CANCELLED:  { texto: 'Cancelado',  clase: 'bg-red-500/80 text-white' },
};
const DIAS_CORTO = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];
const caja = 'rounded-[28px] bg-[#232323] p-5';

export default function AdminDashboard() {
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [cats, setCats] = useState<Category[]>([]);
  const estado = useEstadoLocal();

  useEffect(() => {
    const cargar = () => adminFetch<Order[]>('/orders', token()).then(setOrders).catch(() => setOrders([]));
    cargar();
    adminFetch<Product[]>('/products?todas=1', token()).then(setProducts).catch(() => {});
    adminFetch<Category[]>('/categories?todas=1', token()).then(setCats).catch(() => {});
    const id = setInterval(cargar, 30000);
    return () => clearInterval(id);
  }, []);

  const d = useMemo(() => {
    const lista = orders ?? [];
    const hoy = diaAR(Date.now()), ayer = diaAR(Date.now() - 864e5);
    const validos = lista.filter((o) => o.status !== 'CANCELLED');
    const delDia = (dia: string) => validos.filter((o) => diaAR(o.createdAt) === dia);
    const suma = (xs: Order[]) => xs.reduce((s, o) => s + o.total, 0);
    const deHoy = delDia(hoy), deAyer = delDia(ayer);

    const semana = Array.from({ length: 7 }, (_, i) => {
      const dia = diaAR(Date.now() - (6 - i) * 864e5), xs = delDia(dia);
      return { dia, nombre: i === 6 ? 'Hoy' : DIAS_CORTO[new Date(`${dia}T12:00:00-03:00`).getDay()], total: suma(xs), pedidos: xs.length };
    });

    const conteo = new Map<string, number>();
    validos.filter((o) => diaAR(o.createdAt) >= semana[0].dia).forEach((o) =>
      o.items?.forEach((i) => conteo.set(i.productName, (conteo.get(i.productName) ?? 0) + i.quantity)));

    const porAtender = lista.filter((o) => tabDe(o) === 'atender');
    return {
      porAtender,
      // El ticket muestra el más viejo sin atender (el que hay que resolver primero)
      proximo: [...porAtender].sort((a, b) => +new Date(a.createdAt) - +new Date(b.createdAt))[0],
      ventasHoy: suma(deHoy), ventasAyer: suma(deAyer),
      pedidosHoy: deHoy.length, pedidosAyer: deAyer.length,
      cobradoHoy: suma(deHoy.filter((o) => o.paidAt)),
      semana,
      top: [...conteo].sort((a, b) => b[1] - a[1]).slice(0, 6),
      programados: lista
        .filter((o) => o.scheduledFor && !['CANCELLED', 'DELIVERED'].includes(o.status) && +new Date(o.scheduledFor) > Date.now() - 30 * 60e3)
        .sort((a, b) => +new Date(a.scheduledFor!) - +new Date(b.scheduledFor!)),
    };
  }, [orders]);

  const porNombre = useMemo(() => new Map(products.map((p) => [p.name, p])), [products]);
  const agotados = products.filter((p) => !p.available).length;
  const fotoCat = (c: Category) => products.find((p) => p.categoryId === c.id && p.images[0])?.images[0];

  return (
    <div className="mx-auto grid max-w-[1400px] gap-5 p-4 sm:p-6 xl:grid-cols-[1fr_340px]">
      <div className="min-w-0 space-y-5">
        {/* Encabezado */}
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-extrabold">Resumen</h1>
            {estado && (
              <p className="mt-1 flex items-center gap-2 text-sm text-white/50">
                <span className={`h-2 w-2 rounded-full ${estado.abierto ? 'bg-green-400' : 'bg-white/30'}`} />{estado.corto}
              </p>
            )}
          </div>
          {agotados > 0 && (
            <Link href="/admin/productos" className="rounded-full bg-[#232323] px-4 py-2 text-xs font-bold text-white/60 hover:text-white">
              {agotados} producto{agotados > 1 ? 's' : ''} agotado{agotados > 1 ? 's' : ''} →
            </Link>
          )}
        </div>

        {/* Números del día */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Numero titulo="Ventas hoy" valor={formatPrice(d.ventasHoy)} comparar={[d.ventasHoy, d.ventasAyer]} cargando={!orders} />
          <Numero titulo="Pedidos hoy" valor={String(d.pedidosHoy)} comparar={[d.pedidosHoy, d.pedidosAyer]} cargando={!orders} />
          <Numero titulo="Por atender" valor={String(d.porAtender.length)} nota="nuevos o sin pagar" cargando={!orders} resaltar={d.porAtender.length > 0} />
          <Numero titulo="Cobrado hoy" valor={formatPrice(d.cobradoHoy)}
            nota={d.ventasHoy > d.cobradoHoy ? `falta ${formatPrice(d.ventasHoy - d.cobradoHoy)}` : 'todo cobrado'} cargando={!orders} />
        </div>

        {/* En celular el ticket va arriba: es lo primero que hay que ver */}
        <div className="xl:hidden"><Ticket pedido={d.proximo} cuantos={d.porAtender.length} /></div>

        {/* Categorías */}
        <section>
          <Titulo titulo="Categorías" sub={`${cats.filter((c) => c.active).length} en el menú`} href="/admin/categorias" />
          <div className="no-scrollbar -mx-1 flex gap-4 overflow-x-auto px-1 pb-1">
            {cats.map((c) => (
              <Link key={c.id} href="/admin/categorias" className="group w-[76px] shrink-0 text-center">
                <span className={`mx-auto block h-[68px] w-[68px] overflow-hidden rounded-full bg-[#2e2e2e] ring-2 ring-transparent transition group-hover:ring-brand ${c.active ? '' : 'opacity-40 grayscale'}`}>
                  {fotoCat(c) && <img src={imgSrc(fotoCat(c), 'sm')} alt="" className="h-full w-full object-cover" />}
                </span>
                <span className="mt-1.5 block truncate text-[11px] text-white/60">{c.name}</span>
              </Link>
            ))}
          </div>
        </section>

        {/* Más vendidos */}
        <section>
          <Titulo titulo="Más vendidos" sub="últimos 7 días" href="/admin/productos" />
          {d.top.length === 0 ? (
            <p className={`${caja} text-sm text-white/35`}>Todavía no hay ventas esta semana</p>
          ) : (
            <div className="no-scrollbar -mx-1 flex gap-4 overflow-x-auto px-1 pb-1 pt-10">
              {d.top.map(([nombre, n], i) => {
                const p = porNombre.get(nombre);
                return (
                  <div key={nombre} className="relative w-[150px] shrink-0 rounded-[24px] bg-[#232323] px-3 pb-3 pt-14 text-center">
                    <img src={imgSrc(p?.images[0], 'sm')} alt=""
                      className="absolute -top-9 left-1/2 h-[88px] w-[88px] -translate-x-1/2 rounded-full object-cover shadow-[0_10px_25px_rgba(0,0,0,.5)]" />
                    <span className="absolute left-3 top-3 text-xs font-extrabold text-white/25">#{i + 1}</span>
                    <p className="truncate text-sm font-extrabold">{nombre}</p>
                    <p className="text-[11px] text-white/40">{p?.prices[0] ? `desde ${formatPrice(p.prices[0].price)}` : ' '}</p>
                    <p className="mt-2 text-lg font-extrabold tabular-nums text-brand">{n}</p>
                    <p className="-mt-1 text-[10px] uppercase tracking-wider text-white/35">vendidos</p>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <div className="grid gap-5 lg:grid-cols-[1.3fr_1fr]">
          <VentasSemana semana={d.semana} />
          <section className={caja}>
            <Titulo titulo="Programados" sub="para más tarde" />
            {d.programados.length === 0 && <p className="text-sm text-white/35">No hay pedidos programados</p>}
            <ul className="space-y-2">
              {d.programados.slice(0, 5).map((o) => (
                <li key={o.id} className="flex items-center justify-between gap-3 rounded-2xl bg-white/[0.04] px-3 py-2 text-sm">
                  <span className="min-w-0 truncate"><b>{o.customerName}</b> <span className="text-white/40">· {o.deliveryMethod === 'PICKUP' ? 'retira' : 'delivery'}</span></span>
                  <span className="shrink-0 text-xs font-bold text-cyan-300">⏰ {horarioProgramado(o.scheduledFor!)}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>

        {/* Últimos pedidos */}
        <section>
          <Titulo titulo="Últimos pedidos" href="/admin/pedidos" />
          <div className={`${caja} overflow-x-auto !p-2`}>
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead>
                <tr className="text-[11px] uppercase tracking-wider text-white/35">
                  <th className="px-3 py-2 font-semibold">Cliente</th>
                  <th className="px-3 py-2 font-semibold">Pedido</th>
                  <th className="px-3 py-2 font-semibold">Entrega</th>
                  <th className="px-3 py-2 text-right font-semibold">Total</th>
                  <th className="px-3 py-2 text-right font-semibold">Estado</th>
                </tr>
              </thead>
              <tbody>
                {(orders ?? []).slice(0, 7).map((o) => (
                  <tr key={o.id} className="border-t border-white/5">
                    <td className="px-3 py-2.5">
                      <span className="flex items-center gap-2.5">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand/20 text-xs font-extrabold text-brand">
                          {o.customerName.trim()[0]?.toUpperCase()}
                        </span>
                        <span>
                          <span className="block font-semibold">{o.customerName}</span>
                          <span className="text-[11px] text-white/35">{hace(o.createdAt)}</span>
                        </span>
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-xs text-white/50">#{o.code.slice(-5)}</td>
                    <td className="max-w-[180px] truncate px-3 py-2.5 text-xs text-white/50">
                      {o.deliveryMethod === 'PICKUP' ? 'Retira en el local' : o.address}
                    </td>
                    <td className="px-3 py-2.5 text-right font-bold tabular-nums">{formatPrice(o.total)}</td>
                    <td className="px-3 py-2.5 text-right">
                      <span className={`inline-block rounded-full px-2.5 py-1 text-[11px] font-bold ${ESTADO[o.status as OrderStatus].clase}`}>
                        {ESTADO[o.status as OrderStatus].texto}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {orders && orders.length === 0 && <p className="p-4 text-sm text-white/35">No hay pedidos todavía</p>}
          </div>
        </section>
      </div>

      {/* Ticket: el próximo pedido a atender */}
      <aside className="hidden xl:sticky xl:top-6 xl:block xl:h-fit">
        <Ticket pedido={d.proximo} cuantos={d.porAtender.length} />
      </aside>
    </div>
  );
}

function Titulo({ titulo, sub, href }: { titulo: string; sub?: string; href?: string }) {
  return (
    <div className="mb-3 flex items-end justify-between gap-2">
      <div>
        <h2 className="text-lg font-extrabold">{titulo}</h2>
        {sub && <p className="text-xs text-brand">{sub}</p>}
      </div>
      {href && (
        <Link href={href} className="flex items-center gap-2 text-xs font-semibold text-white/60 hover:text-white">
          Ver más <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-white/10">›</span>
        </Link>
      )}
    </div>
  );
}

function Numero({ titulo, valor, comparar, nota, cargando, resaltar }: {
  titulo: string; valor: string; comparar?: [number, number]; nota?: string; cargando?: boolean; resaltar?: boolean;
}) {
  let dif: React.ReactNode = nota;
  if (comparar) {
    const [hoy, ayer] = comparar;
    if (!ayer) dif = hoy ? 'ayer no hubo' : 'sin datos de ayer';
    else {
      const p = Math.round(((hoy - ayer) / ayer) * 100);
      dif = <><span className={p >= 0 ? 'text-green-400' : 'text-red-400'}>{p >= 0 ? '▲' : '▼'} {Math.abs(p)}%</span> vs. ayer</>;
    }
  }
  return (
    <div className={`rounded-[24px] p-4 ${resaltar ? 'bg-brand text-black' : 'bg-[#232323]'}`}>
      <p className={`text-xs font-semibold ${resaltar ? 'text-black/60' : 'text-white/45'}`}>{titulo}</p>
      <p className="mt-1 text-2xl font-extrabold tabular-nums sm:text-3xl">{cargando ? '…' : valor}</p>
      <p className={`mt-1 text-xs ${resaltar ? 'text-black/60' : 'text-white/40'}`}>{cargando ? ' ' : dif}</p>
    </div>
  );
}

/** Ventas de los últimos 7 días: una sola serie, barras finas, detalle al pasar el mouse o tocar */
function VentasSemana({ semana }: { semana: { dia: string; nombre: string; total: number; pedidos: number }[] }) {
  const [activo, setActivo] = useState<number | null>(null);
  const max = Math.max(...semana.map((s) => s.total), 1);
  const i = activo ?? 6, sel = semana[i];
  return (
    <section className={caja}>
      <Titulo titulo="Ventas" sub="últimos 7 días" />
      <p className="text-2xl font-extrabold tabular-nums">{formatPrice(sel.total)}</p>
      <p className="mb-4 text-xs text-white/45">
        {i === 6 ? 'hoy' : sel.nombre} · {sel.pedidos} pedido{sel.pedidos === 1 ? '' : 's'} · semana {formatPrice(semana.reduce((s, x) => s + x.total, 0))}
      </p>
      <div className="relative h-36" onMouseLeave={() => setActivo(null)} role="img"
        aria-label={`Ventas por día: ${semana.map((s) => `${s.nombre} ${formatPrice(s.total)}`).join(', ')}`}>
        <div className="absolute inset-x-0 top-1/2 border-t border-dashed border-white/[0.06]" />
        <div className="absolute inset-0 flex items-end gap-2 border-b border-white/10">
          {semana.map((s, j) => (
            <button key={s.dia} type="button" onMouseEnter={() => setActivo(j)} onFocus={() => setActivo(j)} onClick={() => setActivo(j)}
              className="group flex h-full flex-1 items-end justify-center" aria-label={`${s.nombre}: ${formatPrice(s.total)}`}>
              <span className={`block w-full max-w-[30px] rounded-t-[4px] transition-colors ${j === i ? 'bg-brand' : 'bg-brand/40 group-hover:bg-brand/70'}`}
                style={{ height: s.total ? `${Math.max((s.total / max) * 100, 2)}%` : '2px' }} />
            </button>
          ))}
        </div>
      </div>
      <div className="mt-2 flex gap-2">
        {semana.map((s, j) => (
          <span key={s.dia} className={`flex-1 text-center text-[11px] capitalize ${j === i ? 'font-bold text-white/80' : 'text-white/35'}`}>{s.nombre}</span>
        ))}
      </div>
    </section>
  );
}

/** Panel tipo ticket con el pedido que hay que atender primero */
function Ticket({ pedido, cuantos }: { pedido?: Order; cuantos: number }) {
  return (
    <div className="overflow-hidden rounded-[28px] bg-[#2b2b2b]">
      <div className="m-3 rounded-[22px] bg-[#3a3a3a] p-4">
        <p className="text-xs font-extrabold uppercase tracking-widest text-white/70">
          {pedido ? (pedido.deliveryMethod === 'PICKUP' ? 'Retira en el local' : 'Dirección de entrega') : 'Próximo pedido'}
        </p>
        {pedido ? (
          <>
            <p className="mt-2 text-sm text-white/80">📍 {pedido.deliveryMethod === 'PICKUP' ? 'Lo pasa a buscar' : pedido.address}</p>
            <p className="mt-1 text-sm text-white/60">
              {pedido.scheduledFor ? <>⏰ {horarioProgramado(pedido.scheduledFor)}</> : <>🕑 pidió {hace(pedido.createdAt)}</>}
            </p>
          </>
        ) : <p className="mt-2 text-sm text-white/50">Cuando entre un pedido aparece acá.</p>}
      </div>

      {pedido && (
        <div className="px-5 pb-5">
          <div className="flex items-center justify-between py-2">
            <p className="font-extrabold">{pedido.customerName}</p>
            <p className="text-xs text-white/40">#{pedido.code.slice(-5)}</p>
          </div>
          <span className={`inline-block rounded-full px-3 py-1 text-xs font-bold ${ESTADO[pedido.status as OrderStatus].clase}`}>
            {ESTADO[pedido.status as OrderStatus].texto}{pedido.status !== 'PENDING' && !pedido.paidAt ? ' · falta el pago' : ''}
          </span>

          <ul className="mt-4 space-y-3">
            {pedido.items?.map((i) => (
              <li key={i.id} className="flex items-center justify-between gap-3 text-sm">
                <span className="min-w-0">
                  <span className="block truncate font-semibold">{i.productName}</span>
                  <span className="text-xs capitalize text-white/40">{i.priceLabel} · x{i.quantity}</span>
                </span>
                <span className="shrink-0 font-bold tabular-nums">{formatPrice(i.subtotal)}</span>
              </li>
            ))}
          </ul>
          {pedido.notes && <p className="mt-3 rounded-xl bg-white/5 px-3 py-2 text-xs text-white/60">📝 {pedido.notes}</p>}
        </div>
      )}

      {/* Corte del ticket */}
      <div className="relative">
        <span className="absolute -left-3 top-1/2 h-6 w-6 -translate-y-1/2 rounded-full bg-[#0a0a0a]" />
        <span className="absolute -right-3 top-1/2 h-6 w-6 -translate-y-1/2 rounded-full bg-[#0a0a0a]" />
        <div className="mx-6 border-t-2 border-dashed border-white/15" />
      </div>

      <div className="space-y-2 p-5 text-sm">
        {pedido && (
          <>
            <div className="flex justify-between text-white/60"><span>Subtotal</span><span>{formatPrice(pedido.subtotal)}</span></div>
            {!!pedido.discount && (
              <div className="flex justify-between text-brand"><span>🏷️ Descuento {pedido.discountCode}</span><span>−{formatPrice(pedido.discount)}</span></div>
            )}
            <div className="flex justify-between text-white/60"><span>Envío</span><span>{formatPrice(pedido.deliveryCost)}</span></div>
            <div className="flex justify-between pt-1 text-lg font-extrabold"><span>TOTAL</span><span>{formatPrice(pedido.total)}</span></div>
          </>
        )}
        <Link href="/admin/pedidos"
          className={`mt-3 block rounded-full py-3.5 text-center font-bold transition-colors ${
            pedido ? 'bg-brand text-black hover:bg-brand-strong' : 'bg-black/40 text-white/60 hover:text-white'}`}>
          {pedido ? `Atender${cuantos > 1 ? ` (${cuantos} esperando)` : ''}` : 'Ver pedidos'}
        </Link>
      </div>
    </div>
  );
}
