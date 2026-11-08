import { categoria, editarCategoria, ocultarCategoria, type CategoriaEntrada } from '@/lib/server/menu';
import { responder, soloAdmin, cuerpo, refrescarMenu } from '@/lib/server/http';

export const dynamic = 'force-dynamic';
type Ctx = { params: Promise<{ clave: string }> };

// GET por slug (público); PATCH y DELETE por id (admin), como la API anterior
export const GET = (_: Request, { params }: Ctx) => responder(async () => categoria((await params).clave));

export const PATCH = (req: Request, { params }: Ctx) => soloAdmin(req, async () => {
  const c = await editarCategoria((await params).clave, await cuerpo<CategoriaEntrada>(req));
  refrescarMenu();
  return c;
});

export const DELETE = (req: Request, { params }: Ctx) => soloAdmin(req, async () => {
  await ocultarCategoria((await params).clave);
  refrescarMenu();
  return { ok: true };
});
