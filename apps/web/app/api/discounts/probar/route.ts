import { probarCodigo } from '@/lib/server/descuentos';
import { responder, cuerpo } from '@/lib/server/http';

export const dynamic = 'force-dynamic';

/** Checkout: POST { code, subtotal } → { code, etiqueta, descuento }. El pedido lo vuelve a calcular al crearse. */
export const POST = (req: Request) => responder(async () => {
  const { code, subtotal } = await cuerpo<{ code?: string; subtotal?: number }>(req);
  return probarCodigo(code, Math.max(0, Math.round(Number(subtotal) || 0)));
});
