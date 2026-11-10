import type { Category, Product, Order, CreateOrderDto } from '@fredys/types';

// El menú y los pedidos viven en la misma web (rutas /api en Vercel). Solo se usa desde el navegador:
// las páginas del servidor leen la base directo (lib/server).
const BASE = '';

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}/api${path}`, {
    headers: { 'Content-Type': 'application/json', ...init?.headers },
    ...init,
  });
  if (!res.ok) throw new Error(`API error ${res.status}: ${await res.text()}`);
  return res.json() as Promise<T>;
}

// ─── Categorías ───────────────────────────────────────────────────────────────
export const getCategories = () => apiFetch<Category[]>('/categories');

// ─── Productos ────────────────────────────────────────────────────────────────
export const getProducts = (categorySlug?: string) =>
  apiFetch<Product[]>(`/products${categorySlug ? `?category=${categorySlug}` : ''}`);

export const getProduct = (slug: string) =>
  apiFetch<Product>(`/products/${slug}`);

// ─── Órdenes ─────────────────────────────────────────────────────────────────
export const createOrder = (data: CreateOrderDto) =>
  apiFetch<Order>('/orders', { method: 'POST', body: JSON.stringify(data) });

// ─── Admin ────────────────────────────────────────────────────────────────────
export const adminLogin = (email: string, password: string) =>
  apiFetch<{ accessToken: string; admin: { id: string; email: string; name: string } }>(
    '/auth/login',
    { method: 'POST', body: JSON.stringify({ email, password }) },
  );

export async function adminFetch<T>(path: string, token: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}/api${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...init?.headers },
  });
  // Sesión vencida: de vuelta al login en vez de quedar con la pantalla vacía
  if (res.status === 401 && typeof window !== 'undefined') {
    localStorage.removeItem('admin_token');
    window.location.href = '/admin/login';
  }
  if (!res.ok) {
    const msg = await res.json().then((j) => j?.message).catch(() => null);
    throw new Error(msg || `Error ${res.status}`);
  }
  return res.json() as Promise<T>;
}
