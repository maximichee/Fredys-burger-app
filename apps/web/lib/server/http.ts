import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { Prisma } from '@prisma/client';
import { adminDe } from './auth';
import { ErrorPedido } from './pedidos';

/* Ayudantes de las rutas /api: respuestas JSON, errores claros y control de admin. */

export const json = (data: unknown, init?: ResponseInit) => NextResponse.json(data, init);

/** Ejecuta la ruta y convierte los errores conocidos en respuestas (404, 400, 409) */
export async function responder(fn: () => Promise<unknown>) {
  try {
    const r = await fn();
    return r instanceof Response ? r : json(r ?? { ok: true });
  } catch (e) {
    if (e instanceof ErrorPedido) return json({ message: e.message }, { status: 400 });
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      if (e.code === 'P2025') return json({ message: 'No encontrado' }, { status: 404 });
      if (e.code === 'P2002') return json({ message: 'Ya existe uno con ese nombre o slug' }, { status: 409 });
    }
    console.error(e);
    return json({ message: 'Error del servidor' }, { status: 500 });
  }
}

/** Igual que responder(), pero exige token de admin */
export async function soloAdmin(req: Request, fn: () => Promise<unknown>) {
  if (!(await adminDe(req))) return json({ message: 'No autorizado' }, { status: 401 });
  return responder(fn);
}

export const cuerpo = async <T>(req: Request): Promise<T> => {
  try { return (await req.json()) as T; } catch { throw new ErrorPedido('Datos inválidos'); }
};

/** Después de cambiar el menú desde el panel, el inicio y las fichas se rehacen al momento */
export function refrescarMenu() {
  revalidatePath('/');
  revalidatePath('/producto/[slug]', 'layout');
  revalidatePath('/sitemap.xml');
}
