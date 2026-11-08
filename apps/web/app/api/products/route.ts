import { productos, crearProducto, type ProductoEntrada } from '@/lib/server/menu';
import { responder, soloAdmin, cuerpo, refrescarMenu } from '@/lib/server/http';

export const dynamic = 'force-dynamic';

export const GET = (req: Request) =>
  responder(() => productos(new URL(req.url).searchParams.get('category') ?? undefined));

export const POST = (req: Request) => soloAdmin(req, async () => {
  const p = await crearProducto(await cuerpo<ProductoEntrada>(req));
  refrescarMenu();
  return p;
});
