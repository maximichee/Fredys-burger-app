'use client';
import { create } from 'zustand';

/** "¿Le sumás algo?": después de sumar una burger se ofrecen papas, un dip y una bebida.
 *  Si el cliente dice "No, gracias", no se vuelve a ofrecer en la visita. */
const SIN_EXTRAS = 'fredys-sin-extras';

interface SugerenciaStore {
  /** id del producto recién sumado; null = cerrada */
  para: string | null;
  vez: number;
  ofrecer: (productId: string) => void;
  cerrar: () => void;
  noGracias: () => void;
}

export const useSugerencia = create<SugerenciaStore>((set) => ({
  para: null,
  vez: 0,
  ofrecer: (productId) => {
    try { if (sessionStorage.getItem(SIN_EXTRAS)) return; } catch { /* sin almacenamiento */ }
    set((s) => ({ para: productId, vez: s.vez + 1 }));
  },
  cerrar: () => set({ para: null }),
  noGracias: () => {
    try { sessionStorage.setItem(SIN_EXTRAS, '1'); } catch { /* sin almacenamiento */ }
    set({ para: null });
  },
}));
