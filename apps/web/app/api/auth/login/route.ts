import { ingresar } from '@/lib/server/auth';
import { responder, cuerpo, json } from '@/lib/server/http';

export const dynamic = 'force-dynamic';

export const POST = (req: Request) => responder(async () => {
  const { email, password } = await cuerpo<{ email?: string; password?: string }>(req);
  const r = await ingresar(String(email ?? ''), String(password ?? ''));
  return r ?? json({ message: 'Credenciales incorrectas' }, { status: 401 });
});
