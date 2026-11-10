import { DiscountType, type DiscountCode, type Prisma } from '@prisma/client';
import { db } from './db';
import { ErrorPedido } from './errores';

/* Códigos de descuento. El descuento SIEMPRE lo calcula el servidor (el navegador solo manda el código). */

export const normalizar = (c: unknown) => String(c ?? '').trim().toUpperCase().replace(/\s+/g, '');

/** Por qué un código no sirve, o null si sirve para ese subtotal */
function problema(d: DiscountCode | null, subtotal: number): string | null {
  if (!d || !d.active) return 'Ese código no existe o ya no está activo';
  if (d.expiresAt && d.expiresAt.getTime() < Date.now()) return 'Ese código ya venció';
  if (d.maxUses != null && d.uses >= d.maxUses) return 'Ese código ya se usó todas las veces posibles';
  if (d.minTotal && subtotal < d.minTotal) return `Ese código es para compras desde $${d.minTotal.toLocaleString('es-AR')}`;
  return null;
}

/** Cuánto descuenta (nunca más que el subtotal) */
export const montoDe = (d: Pick<DiscountCode, 'type' | 'value'>, subtotal: number) =>
  Math.min(subtotal, d.type === DiscountType.PERCENT ? Math.round((subtotal * d.value) / 100) : d.value);

export const etiquetaDe = (d: Pick<DiscountCode, 'type' | 'value'>) =>
  d.type === DiscountType.PERCENT ? `${d.value}% off` : `$${d.value.toLocaleString('es-AR')} off`;

/** Para el checkout: valida el código contra el subtotal del carrito */
export async function probarCodigo(codigo: unknown, subtotal: number) {
  const code = normalizar(codigo);
  if (!code) throw new ErrorPedido('Escribí un código');
  const d = await db.discountCode.findUnique({ where: { code } });
  const p = problema(d, subtotal);
  if (p) throw new ErrorPedido(p);
  return { code, etiqueta: etiquetaDe(d!), descuento: montoDe(d!, subtotal) };
}

/** Dentro de la creación del pedido: valida y suma un uso, todo en la misma transacción */
export async function aplicarEnPedido(tx: Prisma.TransactionClient, codigo: unknown, subtotal: number) {
  const code = normalizar(codigo);
  if (!code) return { code: undefined, descuento: 0 };
  const d = await tx.discountCode.findUnique({ where: { code } });
  const p = problema(d, subtotal);
  if (p) throw new ErrorPedido(p);
  // Suma el uso solo si sigue habiendo cupo (evita pasarse del tope con dos pedidos al mismo tiempo)
  const ok = await tx.discountCode.updateMany({
    where: { id: d!.id, ...(d!.maxUses != null ? { uses: { lt: d!.maxUses } } : {}) },
    data: { uses: { increment: 1 } },
  });
  if (!ok.count) throw new ErrorPedido('Ese código ya se usó todas las veces posibles');
  return { code, descuento: montoDe(d!, subtotal) };
}

/* ===== Panel ===== */

export const codigos = () => db.discountCode.findMany({ orderBy: { createdAt: 'desc' } });

type Entrada = { code?: string; type?: string; value?: number; minTotal?: number | null; maxUses?: number | null; expiresAt?: string | null; active?: boolean };

const entero = (v: unknown) => (v === null || v === undefined || v === '' ? null : Math.round(Number(v)));

export async function crearCodigo(e: Entrada) {
  const code = normalizar(e.code);
  if (!/^[A-Z0-9_-]{3,20}$/.test(code)) throw new ErrorPedido('El código tiene que tener de 3 a 20 letras o números, sin espacios');
  const type = e.type === 'FIXED' ? DiscountType.FIXED : DiscountType.PERCENT;
  const value = entero(e.value) ?? 0;
  if (type === DiscountType.PERCENT && !(value >= 1 && value <= 100)) throw new ErrorPedido('El porcentaje va de 1 a 100');
  if (type === DiscountType.FIXED && !(value >= 1)) throw new ErrorPedido('Poné cuántos pesos descuenta');
  const minTotal = entero(e.minTotal), maxUses = entero(e.maxUses);
  if ((minTotal !== null && minTotal < 0) || (maxUses !== null && maxUses < 1)) throw new ErrorPedido('Revisá la compra mínima y los usos');
  const expiresAt = e.expiresAt ? new Date(e.expiresAt) : null;
  if (expiresAt && isNaN(expiresAt.getTime())) throw new ErrorPedido('Fecha de vencimiento inválida');
  return db.discountCode.create({ data: { code, type, value, minTotal, maxUses, expiresAt } });
}

export const pausarCodigo = (id: string, active: boolean) => db.discountCode.update({ where: { id }, data: { active } });
export const borrarCodigo = (id: string) => db.discountCode.delete({ where: { id } });
