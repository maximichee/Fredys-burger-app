import { pausarCodigo, borrarCodigo } from '@/lib/server/descuentos';
import { soloAdmin, cuerpo } from '@/lib/server/http';

export const dynamic = 'force-dynamic';
type Ctx = { params: Promise<{ id: string }> };

/** PATCH { active } para pausar o reactivar */
export const PATCH = (req: Request, { params }: Ctx) => soloAdmin(req, async () => {
  const { active } = await cuerpo<{ active?: boolean }>(req);
  return pausarCodigo((await params).id, active !== false);
});

/** Borrar no afecta los pedidos que ya lo usaron (guardan el texto del código) */
export const DELETE = (req: Request, { params }: Ctx) => soloAdmin(req, async () => {
  await borrarCodigo((await params).id);
  return { ok: true };
});
