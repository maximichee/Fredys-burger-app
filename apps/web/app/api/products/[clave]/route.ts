import { producto, editarProducto, ocultarProducto, type ProductoEntrada } from '@/lib/server/menu';
import { responder, soloAdmin, cuerpo, refrescarMenu } from '@/lib/server/http';

export const dynamic = 'force-dynamic';
type Ctx = { params: Promise<{ clave: string }> };

// GET por slug (público); PATCH y DELETE por id (admin), como la API anterior
export const GET = (_: Request, { params }: Ctx) => responder(async () => producto((await params).clave));

export const PATCH = (req: Request, { params }: Ctx) => soloAdmin(req, async () => {
  const p = await editarProducto((await params).clave, await cuerpo<ProductoEntrada>(req));
  refrescarMenu();
  return p;
});

export const DELETE = (req: Request, { params }: Ctx) => soloAdmin(req, async () => {
  const p = await ocultarProducto((await params).clave);
  refrescarMenu();
  return p;
});
