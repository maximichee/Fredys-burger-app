'use client';
import { create } from 'zustand';
import { medir } from './medir';

/** Instalar la web como app. Android y computadora: el navegador ofrece el aviso (beforeinstallprompt).
 *  iPhone: no hay aviso; se explica "Compartir → Agregar a inicio". */
type AvisoInstalar = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }> };

interface InstalarStore {
  aviso: AvisoInstalar | null;
  esIOS: boolean;
  instalada: boolean;
  iniciar: () => () => void;
  instalar: () => Promise<boolean>;
}

export const useInstalar = create<InstalarStore>((set, get) => ({
  aviso: null,
  esIOS: false,
  instalada: false,
  iniciar: () => {
    const nav = navigator as Navigator & { standalone?: boolean };
    const instalada = window.matchMedia('(display-mode: standalone)').matches || nav.standalone === true;
    const esIOS = /iphone|ipad|ipod/i.test(navigator.userAgent) && !instalada;
    set({ instalada, esIOS });
    const alAviso = (e: Event) => { e.preventDefault(); set({ aviso: e as AvisoInstalar }); };
    const alInstalar = () => { medir('instalar_app', { resultado: 'instalada' }); set({ aviso: null, instalada: true }); };
    window.addEventListener('beforeinstallprompt', alAviso);
    window.addEventListener('appinstalled', alInstalar);
    return () => { window.removeEventListener('beforeinstallprompt', alAviso); window.removeEventListener('appinstalled', alInstalar); };
  },
  instalar: async () => {
    const { aviso } = get();
    if (!aviso) return false;
    await aviso.prompt();
    const { outcome } = await aviso.userChoice;
    medir('instalar_app_aviso', { resultado: outcome === 'accepted' ? 'acepto' : 'rechazo' });
    set({ aviso: null });
    return outcome === 'accepted';
  },
}));
