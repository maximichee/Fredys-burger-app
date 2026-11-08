import { ImageResponse } from 'next/og';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { getProduct } from '@/lib/api';
import { formatPrice, imgSrc } from '@/lib/utils';
import { SITE_URL } from '@/lib/sitio';

/* Imagen al compartir una ficha (WhatsApp, Instagram, Facebook): la foto de esa burger,
   el nombre con la letra de la marca y "desde $8.100". 1200 × 630. */

export const alt = "Burger de Fredy's Burger";
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export const revalidate = 3600;

const C = { bg: '#0f0b09', brand: '#fb8500', crema: '#fff3e0', apagado: '#c9b3a1', choco: '#3a1f1a', cuero: '#5a3a33' };

const raiz = process.cwd();
const leer = (...p: string[]) => readFile(join(raiz, ...p));
const dataUrl = (buf: Buffer, tipo: string) => `data:${tipo};base64,${buf.toString('base64')}`;

/** Foto en PNG con bordes transparentes (el generador no lee WebP): la versión ".og.png" de scripts/optimizar-fotos.mjs */
async function foto(ruta?: string) {
  const src = imgSrc(ruta);
  if (src.startsWith('http')) return src;
  const og = src.replace(/\.(lg|sm)\.webp$/, '.og.png');
  try { return dataUrl(await leer('public', og), 'image/png'); } catch { return `${SITE_URL}${og}`; }
}

export default async function Imagen({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  let p: Awaited<ReturnType<typeof getProduct>> | null = null;
  try { p = await getProduct(slug); } catch { /* sin API: tarjeta de la marca */ }

  const [anton, poppins, poppinsSemi, logo, img] = await Promise.all([
    leer('assets', 'fonts', 'Anton-Regular.ttf'),
    leer('assets', 'fonts', 'Poppins-ExtraBold.ttf'),
    leer('assets', 'fonts', 'Poppins-SemiBold.ttf'),
    leer('public', 'logo.png').then((b) => dataUrl(b, 'image/png')).catch(() => null),
    foto(p?.images[0]),
  ]);

  const nombre = (p?.name ?? "Fredy's Burger").toUpperCase();
  const tam = nombre.length > 34 ? 64 : nombre.length > 20 ? 80 : 104;
  const precios = p?.prices ?? [];
  const desde = precios.length ? Math.min(...precios.map((x) => x.price)) : null;

  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', position: 'relative', background: C.bg, fontFamily: 'Poppins' }}>
        {/* Brasa detrás de la foto */}
        <div style={{ position: 'absolute', right: -120, top: 15, width: 760, height: 600, borderRadius: 600, background: 'radial-gradient(circle, rgba(251,133,0,.28), rgba(251,133,0,0) 68%)' }} />
        {/* Aro de la parrilla */}
        <div style={{ position: 'absolute', right: 55, top: 25, width: 580, height: 580, borderRadius: 580, border: `3px solid rgba(251,133,0,.35)` }} />

        {/* Foto */}
        <div style={{ position: 'absolute', right: 40, top: 0, width: 610, height: 630, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {/* eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text */}
          <img src={img} width={610} height={630} style={{ objectFit: 'contain', width: 610, height: 630 }} />
        </div>
        {/* Fundido de la foto hacia el texto */}
        <div style={{ position: 'absolute', left: 470, top: 0, width: 240, height: 630, background: `linear-gradient(to right, ${C.bg}, rgba(15,11,9,0))` }} />

        {/* Texto */}
        <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', width: 640, height: '100%', padding: '56px 0 56px 72px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            {/* eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text */}
            {logo && <img src={logo} width={120} height={120} />}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', fontFamily: 'Anton', fontSize: tam, lineHeight: 1, color: C.crema, textShadow: `3px 3px 0 ${C.brand}, 8px 8px 0 ${C.choco}`, letterSpacing: 1 }}>
              {nombre}
            </div>
            {desde !== null && (
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, marginTop: 28 }}>
                {precios.length > 1 && <span style={{ fontFamily: 'Poppins Semi', fontSize: 30, color: C.apagado }}>desde</span>}
                <span style={{ fontSize: 60, color: C.brand }}>{formatPrice(desde)}</span>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', fontFamily: 'Poppins Semi', fontSize: 26, color: C.apagado }}>
            Pedí online · Santa Fe
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: 'Anton', data: anton, weight: 400, style: 'normal' },
        { name: 'Poppins', data: poppins, weight: 800, style: 'normal' },
        { name: 'Poppins Semi', data: poppinsSemi, weight: 600, style: 'normal' },
      ],
    },
  );
}
