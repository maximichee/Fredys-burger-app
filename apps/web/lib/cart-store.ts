'use client';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CartItem } from '@fredys/types';
import { medirItems, type Origen } from './medir';

interface CartStore {
  items: CartItem[];
  isOpen: boolean;
  /** abrir=false suma sin abrir el panel (el "+" del menú avisa con la semilla que vuela al carrito) */
  addItem: (item: CartItem, abrir?: boolean, origen?: Origen) => void;
  removeItem: (productId: string, priceLabel: string) => void;
  updateQuantity: (productId: string, priceLabel: string, qty: number) => void;
  updateComment: (productId: string, priceLabel: string, comment: string) => void;
  clearCart: () => void;
  openCart: () => void;
  closeCart: () => void;
  subtotal: () => number;
  totalItems: () => number;
}

export const useCart = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,

      addItem: (item, abrir = true, origen) => {
        medirItems('add_to_cart', [item], origen ? { origen } : {});
        const existing = get().items.find(
          (i) => i.productId === item.productId && i.priceLabel === item.priceLabel,
        );
        if (existing) {
          set((s) => ({
            items: s.items.map((i) =>
              i.productId === item.productId && i.priceLabel === item.priceLabel
                ? { ...i, quantity: i.quantity + item.quantity }
                : i,
            ),
          }));
        } else {
          set((s) => ({ items: [...s.items, item] }));
        }
        if (abrir) set({ isOpen: true });
      },

      removeItem: (productId, priceLabel) =>
        set((s) => ({
          items: s.items.filter(
            (i) => !(i.productId === productId && i.priceLabel === priceLabel),
          ),
        })),

      updateQuantity: (productId, priceLabel, qty) => {
        if (qty <= 0) {
          get().removeItem(productId, priceLabel);
          return;
        }
        set((s) => ({
          items: s.items.map((i) =>
            i.productId === productId && i.priceLabel === priceLabel
              ? { ...i, quantity: qty }
              : i,
          ),
        }));
      },

      updateComment: (productId, priceLabel, comment) =>
        set((s) => ({
          items: s.items.map((i) =>
            i.productId === productId && i.priceLabel === priceLabel
              ? { ...i, comment }
              : i,
          ),
        })),

      clearCart: () => set({ items: [] }),
      openCart:  () => { medirItems('view_cart', get().items); set({ isOpen: true }); },
      closeCart: () => set({ isOpen: false }),

      subtotal: () => get().items.reduce((s, i) => s + i.price * i.quantity, 0),
      totalItems: () => get().items.reduce((s, i) => s + i.quantity, 0),
    }),
    {
      name: 'fredys-cart',
      skipHydration: true,
      storage: typeof window !== 'undefined'
        ? { getItem: (k) => JSON.parse(localStorage.getItem(k) ?? 'null'), setItem: (k, v) => localStorage.setItem(k, JSON.stringify(v)), removeItem: (k) => localStorage.removeItem(k) }
        : { getItem: () => null, setItem: () => {}, removeItem: () => {} },
    },
  ),
);
