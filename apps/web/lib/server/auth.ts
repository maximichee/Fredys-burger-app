import { SignJWT, jwtVerify } from 'jose';
import bcrypt from 'bcryptjs';
import { db } from './db';

/* Login del panel de admin: misma idea que la API anterior (token "Bearer" que el panel guarda en el navegador). */

const clave = () => {
  const s = process.env.JWT_SECRET;
  if (!s || s.length < 32) throw new Error('Falta JWT_SECRET (mínimo 32 caracteres) en las variables de entorno');
  return new TextEncoder().encode(s);
};

let falso: string | undefined;

export async function ingresar(email: string, password: string) {
  const admin = await db.adminUser.findUnique({ where: { email: String(email).trim().toLowerCase() } });
  // Compara igual aunque no exista, para no revelar qué emails son de admin
  falso ??= bcrypt.hashSync('no-es-una-clave', 10);
  const ok = await bcrypt.compare(String(password), admin?.password ?? falso);
  if (!admin || !ok) return null;
  const token = await new SignJWT({ email: admin.email })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(admin.id)
    .setIssuedAt()
    .setExpirationTime(process.env.JWT_EXPIRES_IN ?? '7d')
    .sign(clave());
  return { accessToken: token, admin: { id: admin.id, email: admin.email, name: admin.name } };
}

/** Admin del pedido, o null si el token falta, venció o no es válido */
export async function adminDe(req: Request) {
  const h = req.headers.get('authorization') ?? '';
  const token = h.startsWith('Bearer ') ? h.slice(7) : '';
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, clave(), { algorithms: ['HS256'] });
    return payload.sub ? { id: payload.sub, email: String(payload.email ?? '') } : null;
  } catch {
    return null;
  }
}
