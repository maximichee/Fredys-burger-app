'use client';
import { useEffect } from 'react';
import Script from 'next/script';
import { GA_ID, medir } from '@/lib/medir';

/** Carga Google Analytics 4 (solo con NEXT_PUBLIC_GA_ID) y mide los clics a WhatsApp e Instagram de toda la web.
 *  Las páginas vistas las cuenta GA solo (también al navegar sin recargar). */
export function Analitica() {
  useEffect(() => {
    const alClic = (e: MouseEvent) => {
      const a = (e.target as Element | null)?.closest?.('a[href]') as HTMLAnchorElement | null;
      if (!a) return;
      const donde = a.closest('[aria-label], section[id], footer, nav')?.getAttribute('aria-label')
        ?? a.closest('section[id]')?.id ?? (a.closest('footer') ? 'pie' : a.closest('nav') ? 'menu-lateral' : 'otro');
      if (a.href.startsWith('https://wa.me')) medir('clic_whatsapp', { ubicacion: donde, texto: a.textContent?.trim().slice(0, 40) });
      else if (a.href.includes('instagram.com')) medir('clic_instagram', { ubicacion: donde });
    };
    document.addEventListener('click', alClic, { capture: true });
    return () => document.removeEventListener('click', alClic, { capture: true });
  }, []);

  if (!GA_ID) return null;
  return (
    <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
      <Script id="ga4" strategy="afterInteractive">
        {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}window.gtag=gtag;gtag('js',new Date());gtag('config','${GA_ID}',{anonymize_ip:true});`}
      </Script>
    </>
  );
}
