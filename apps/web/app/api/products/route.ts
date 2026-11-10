import { productos, todosProductos, crearProducto, type ProductoEntrada } from '@/lib/server/menu';
import { responder, soloAdmin, cuerpo, refrescarMenu } from '@/lib/server/http';

export const dynamic = 'force-dynamic';

// ?todas=1 (solo admin): incluye los agotados y los de categorías ocultas
export const GET = (req: Request) => {
  const q = new URL(req.url).searchParams;
  return q.has('todas') ? soloAdmin(req, todosProductos) : responder(() => productos(q.get('category') ?? undefined));
};

export const POST = (req: Request) => soloAdmin(req, async () => {
  const p = await crearProducto(await cuerpo<ProductoEntrada>(req));
  refrescarMenu();
  return p;
});
