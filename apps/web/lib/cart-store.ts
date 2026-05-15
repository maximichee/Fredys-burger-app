'use client';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CartItem } from '@fredys/types';

interface CartStore {
  items: CartItem[];
  isOpen: boolean;
  addItem: (item: CartItem) => void;
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

      addItem: (item) => {
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
        set({ isOpen: true });
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
      openCart:  () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),

      subtotal: () => get().items.reduce((s, i) => s + i.price * i.quantity, 0),
      totalItems: () => get().items.reduce((s, i) => s + i.quantity, 0),
    }),
    { name: 'fredys-cart' },
  ),
);
