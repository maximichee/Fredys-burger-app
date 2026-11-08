import { categorias, crearCategoria, type CategoriaEntrada } from '@/lib/server/menu';
import { responder, soloAdmin, cuerpo, refrescarMenu } from '@/lib/server/http';

export const dynamic = 'force-dynamic';

export const GET = () => responder(() => categorias());

export const POST = (req: Request) => soloAdmin(req, async () => {
  const c = await crearCategoria(await cuerpo<CategoriaEntrada>(req));
  refrescarMenu();
  return c;
});
