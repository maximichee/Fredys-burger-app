import type { Category, Product } from '@fredys/types';
import { db } from './db';

/* Menú: lo mismo que hacía la API de NestJS (apps/api), ahora dentro de la web.
   Lo usan las páginas del servidor (directo) y las rutas /api (para el navegador y el panel). */

const CON_PRECIOS = { category: true, prices: { orderBy: { order: 'asc' as const } } } as const;

/** Categorías activas, en orden, con cuántos productos tienen */
export function categorias() {
  return db.category.findMany({
    where: { active: true },
    orderBy: { order: 'asc' },
    include: { _count: { select: { products: true } } },
  }) as unknown as Promise<(Category & { _count: { products: number } })[]>;
}

export function categoria(slug: string) {
  return db.category.findUniqueOrThrow({ where: { slug } }) as unknown as Promise<Category>;
}

/** Productos disponibles (opcional: de una categoría), por nombre */
export function productos(categoriaSlug?: string) {
  return db.product.findMany({
    where: { available: true, ...(categoriaSlug ? { category: { slug: categoriaSlug } } : {}) },
    include: CON_PRECIOS,
    orderBy: { name: 'asc' },
  }) as unknown as Promise<Product[]>;
}

export function producto(slug: string) {
  return db.product.findUniqueOrThrow({ where: { slug }, include: CON_PRECIOS }) as unknown as Promise<Product>;
}

/* ===== Panel de admin ===== */

type PrecioEntrada = { label: string; price: number; order?: number };
export type ProductoEntrada = {
  slug?: string; name?: string; description?: string; images?: string[]; categoryId?: string;
  prices?: PrecioEntrada[]; featured?: boolean; available?: boolean;
};

const precios = (ps: PrecioEntrada[]) => ps.map((p, i) => ({ label: String(p.label), price: Math.round(Number(p.price)), order: p.order ?? i }));

export function crearProducto(d: ProductoEntrada) {
  const { prices = [], ...resto } = d;
  return db.product.create({
    data: {
      slug: String(resto.slug), name: String(resto.name), description: resto.description ?? '',
      images: resto.images ?? [], categoryId: String(resto.categoryId), featured: !!resto.featured,
      prices: { create: precios(prices) },
    },
    include: CON_PRECIOS,
  });
}

export async function editarProducto(id: string, d: ProductoEntrada) {
  const { prices, ...resto } = d;
  if (prices) await db.productPrice.deleteMany({ where: { productId: id } });
  return db.product.update({
    where: { id },
    data: { ...resto, ...(prices ? { prices: { create: precios(prices) } } : {}) },
    include: CON_PRECIOS,
  });
}

/** "Borrar" deja el producto no disponible (los pedidos viejos lo siguen nombrando) */
export const ocultarProducto = (id: string) => db.product.update({ where: { id }, data: { available: false } });

export type CategoriaEntrada = { slug?: string; name?: string; order?: number; active?: boolean };
export const crearCategoria = (d: CategoriaEntrada) =>
  db.category.create({ data: { slug: String(d.slug), name: String(d.name), order: d.order ?? 0 } });
export const editarCategoria = (id: string, d: CategoriaEntrada) => db.category.update({ where: { id }, data: d });
export const ocultarCategoria = (id: string) => db.category.update({ where: { id }, data: { active: false } });
