import type { Category, Product, Order, CreateOrderDto } from '@fredys/types';

const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

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

export const adminFetch = <T>(path: string, token: string, init?: RequestInit) =>
  apiFetch<T>(path, { ...init, headers: { Authorization: `Bearer ${token}`, ...init?.headers } });
