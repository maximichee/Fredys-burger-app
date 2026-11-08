'use client';
import { create } from 'zustand';
import type { Product } from '@fredys/types';

/** Hoja "Elegí el tamaño": el "+" del menú la abre para burgers con varios tamaños, sin salir del menú. */
export const useElegirTamano = create<{ producto: Product | null; abrir: (p: Product) => void; cerrar: () => void }>((set) => ({
  producto: null,
  abrir: (producto) => set({ producto }),
  cerrar: () => set({ producto: null }),
}));
