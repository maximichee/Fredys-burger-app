import { OrderStatus } from '@prisma/client';
import { db } from './db';
import { ErrorPedido } from './errores';
import { aplicarEnPedido } from './descuentos';

export { ErrorPedido };

/* Pedidos. Mejora respecto de la API anterior: los precios se toman de la base, no del navegador,
   así nadie puede mandar un pedido con precios inventados. */


const texto = (v: unknown, max: number, campo: string, opcional = false) => {
  if (v === undefined || v === null || v === '') {
    if (opcional) return undefined;
    throw new ErrorPedido(`Falta ${campo}`);
  }
  const s = String(v).trim();
  if (!s && !opcional) throw new ErrorPedido(`Falta ${campo}`);
  return s.slice(0, max) || undefined;
};

type ItemEntrada = { productId?: string; priceLabel?: string; quantity?: number; comment?: string };
type PedidoEntrada = {
  deliveryMethod?: string; paymentMethod?: string; customerName?: string; customerPhone?: string;
  address?: string; zone?: string; deliveryCost?: number; notes?: string; items?: ItemEntrada[]; scheduledFor?: string;
  discountCode?: string;
};

export async function crearPedido(d: PedidoEntrada) {
  const items = Array.isArray(d.items) ? d.items : [];
  if (!items.length) throw new ErrorPedido('El pedido está vacío');
  if (items.length > 60) throw new ErrorPedido('Demasiados productos');

  const entrega = texto(d.deliveryMethod, 20, 'la forma de entrega')!;
  if (!['DELIVERY', 'PICKUP'].includes(entrega)) throw new ErrorPedido('Forma de entrega inválida');
  const envio = entrega === 'DELIVERY' ? Math.max(0, Math.round(Number(d.deliveryCost) || 0)) : 0;
  if (envio > 50000) throw new ErrorPedido('Costo de envío inválido');

  // El local le escribe al cliente por WhatsApp: hace falta el número completo
  if (String(d.customerPhone ?? '').replace(/\D/g, '').replace(/^0+/, '').length < 10)
    throw new ErrorPedido('Poné tu WhatsApp con código de área (ej: 342 503-9876)');

  // Para más tarde: tiene que dar el tiempo de prepararlo (y no más de una semana)
  let programado: Date | undefined;
  if (d.scheduledFor) {
    programado = new Date(String(d.scheduledFor));
    const falta = programado.getTime() - Date.now();
    if (isNaN(falta) || falta < 30 * 60e3 || falta > 7 * 864e5) throw new ErrorPedido('Ese horario ya no está disponible, elegí otro');
  }

  // Precios de la base
  const ids = [...new Set(items.map((i) => String(i.productId)))];
  const prods = await db.product.findMany({ where: { id: { in: ids } }, include: { prices: true } });
  const lineas = items.map((i) => {
    const p = prods.find((x) => x.id === i.productId);
    const precio = p?.prices.find((x) => x.label === i.priceLabel);
    if (!p || !p.available || !precio) throw new ErrorPedido('Un producto del pedido ya no está disponible. Revisá el carrito.');
    const cantidad = Math.round(Number(i.quantity));
    if (!(cantidad >= 1 && cantidad <= 50)) throw new ErrorPedido('Cantidad inválida');
    return {
      productId: p.id, productName: p.name, priceLabel: precio.label, unitPrice: precio.price, quantity: cantidad,
      comment: texto(i.comment, 300, 'comentario', true), subtotal: precio.price * cantidad,
    };
  });
  const subtotal = lineas.reduce((s, l) => s + l.subtotal, 0);

  // El código de descuento se valida y se cuenta en la misma transacción que el pedido
  return db.$transaction(async (tx) => {
   const { code, descuento } = await aplicarEnPedido(tx, d.discountCode, subtotal);
   return tx.order.create({
    data: {
      code: `PED${Date.now()}`,
      status: OrderStatus.PENDING,
      deliveryMethod: entrega,
      paymentMethod: texto(d.paymentMethod, 20, 'la forma de pago')!,
      customerName: texto(d.customerName, 80, 'el nombre')!,
      customerPhone: texto(d.customerPhone, 30, 'el teléfono')!,
      address: entrega === 'DELIVERY' ? texto(d.address, 200, 'la dirección') : undefined,
      zone: texto(d.zone, 20, 'zona', true),
      notes: texto(d.notes, 500, 'notas', true),
      deliveryCost: envio,
      scheduledFor: programado,
      subtotal,
      discountCode: code,
      discount: descuento,
      total: subtotal - descuento + envio,
      items: { create: lineas },
    },
    include: { items: true },
   });
  });
}

export const pedidos = (estado?: string) =>
  db.order.findMany({
    where: estado && estado in OrderStatus ? { status: estado as OrderStatus } : {},
    include: { items: true },
    orderBy: { createdAt: 'desc' },
  });

export const pedido = (id: string) => db.order.findUniqueOrThrow({ where: { id }, include: { items: true } });

/** Marca (o desmarca, si fue un error) que el local recibió el pago */
export const marcarPago = (id: string, pagado: boolean) =>
  db.order.update({ where: { id }, data: { paidAt: pagado ? new Date() : null }, include: { items: true } });

export function cambiarEstado(id: string, estado: string) {
  if (!(estado in OrderStatus)) throw new ErrorPedido('Estado inválido');
  return db.order.update({ where: { id }, data: { status: estado as OrderStatus }, include: { items: true } });
}
