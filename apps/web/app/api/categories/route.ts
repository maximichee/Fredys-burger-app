import { categorias, todasCategorias, crearCategoria, type CategoriaEntrada } from '@/lib/server/menu';
import { responder, soloAdmin, cuerpo, refrescarMenu } from '@/lib/server/http';

export const dynamic = 'force-dynamic';

// ?todas=1 (solo admin): incluye las ocultas
export const GET = (req: Request) =>
  new URL(req.url).searchParams.has('todas') ? soloAdmin(req, todasCategorias) : responder(() => categorias());

export const POST = (req: Request) => soloAdmin(req, async () => {
  const c = await crearCategoria(await cuerpo<CategoriaEntrada>(req));
  refrescarMenu();
  return c;
});
