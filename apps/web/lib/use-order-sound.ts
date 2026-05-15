'use client';
import { useRef, useCallback } from 'react';

export function useOrderSound() {
  const ctxRef = useRef<AudioContext | null>(null);

  const play = useCallback(() => {
    try {
      if (!ctxRef.current) {
        ctxRef.current = new AudioContext();
      }
      const ctx = ctxRef.current;

      // Secuencia de 3 beeps ascendentes
      const notes = [523, 659, 784]; // Do, Mi, Sol
      notes.forEach((freq, i) => {
        const osc  = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.type      = 'sine';
        osc.frequency.value = freq;

        const start = ctx.currentTime + i * 0.18;
        gain.gain.setValueAtTime(0, start);
        gain.gain.linearRampToValueAtTime(0.4, start + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.18);

        osc.start(start);
        osc.stop(start + 0.18);
      });

      // Vibración en mobile
      if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
    } catch {
      // AudioContext bloqueado hasta interacción del usuario — silencio
    }
  }, []);

  return play;
}
