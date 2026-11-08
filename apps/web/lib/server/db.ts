import { PrismaClient } from '@prisma/client';

/** Conexión única a la base (Supabase). Solo se importa desde el servidor (rutas /api y páginas del servidor). */
const g = globalThis as unknown as { prisma?: PrismaClient };
export const db = g.prisma ?? new PrismaClient();
if (process.env.NODE_ENV !== 'production') g.prisma = db;
