'use client';
import { useEffect, useState } from 'react';
import { useInstalar } from '@/lib/instalar';

/** Registra el service worker (solo en producción) y escucha el aviso de instalación del navegador. */
export function RegistrarApp() {
  const iniciar = useInstalar((s) => s.iniciar);
  useEffect(() => {
    const fin = iniciar();
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      navigator.serviceWorker.register('/sw.js').catch(() => { /* sin service worker la web funciona igual */ });
    }
    return fin;
  }, [iniciar]);
  return null;
}

/** "Instalá la app": en Android/computadora abre el aviso del navegador; en iPhone muestra cómo hacerlo.
 *  No se muestra si ya está instalada o si el navegador no lo permite. */
export function BotonInstalar({ className = '' }: { className?: string }) {
  const { aviso, esIOS, instalada, instalar } = useInstalar();
  const [pasos, setPasos] = useState(false);

  if (instalada || (!aviso && !esIOS)) return null;

  return (
    <div className={className}>
      <button type="button" onClick={() => (aviso ? instalar() : setPasos((v) => !v))} aria-expanded={esIOS && !aviso ? pasos : undefined}
        className="flex min-h-[52px] w-full items-center gap-3 rounded-[var(--r-md)] border border-[var(--line)] bg-dark-300/60 px-4 py-2.5 text-left transition-colors hover:border-brand/50">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/iconos/icono-192.png" alt="" width={36} height={36} className="h-9 w-9 flex-shrink-0 rounded-[10px]" />
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-bold">Instalá Fredy&apos;s en tu celu</span>
          <span className="block text-xs text-apagado">Abrí el menú con un toque, como una app</span>
        </span>
        <span className="text-brand" aria-hidden="true">↓</span>
      </button>
      {pasos && (
        <p className="mt-2 rounded-[var(--r-sm)] bg-dark-300/60 px-4 py-3 text-sm text-apagado" role="status">
          En el iPhone: tocá <b className="text-crema">Compartir</b> <span aria-hidden="true">(el cuadrado con la flecha)</span> y después <b className="text-crema">Agregar a inicio</b>.
        </p>
      )}
    </div>
  );
}
