import { ordenarCategorias } from '@/lib/server/menu';
import { soloAdmin, cuerpo, refrescarMenu } from '@/lib/server/http';
import { ErrorPedido } from '@/lib/server/pedidos';

export const dynamic = 'force-dynamic';

/** PUT { ids: [...] } con las categorías en el orden nuevo */
export const PUT = (req: Request) => soloAdmin(req, async () => {
  const { ids } = await cuerpo<{ ids?: unknown }>(req);
  if (!Array.isArray(ids) || !ids.every((x) => typeof x === 'string')) throw new ErrorPedido('Orden inválido');
  await ordenarCategorias(ids);
  refrescarMenu();
  return { ok: true };
});
