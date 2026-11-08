// Íconos de la app (instalar en el celular, pestaña, iPhone) a partir del logo.
// Hoy el logo más grande es public/img/logo-slide.png (884×441, sobre negro). Con el logo original,
// cambiar LOGO y correr:  node scripts/iconos.mjs
import { createRequire } from 'node:module';
import { realpathSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(realpathSync(join(raiz, 'node_modules', 'next', 'package.json')));
const sharp = require('sharp');

const LOGO = join(raiz, 'public', 'img', 'logo-slide.png');
const RECORTE = { left: 0, top: 0, width: 884, height: 412 };         // sin el punto azul de abajo
const HAMBURGUESA = { left: 0, top: 40, width: 250, height: 372 };    // solo la burger, para los íconos chicos
const FONDO = '#0f0b09';
const SALIDA = join(raiz, 'public', 'iconos');
mkdirSync(SALIDA, { recursive: true });

// El negro del logo se funde con el carbón de la marca (mezcla "aclarar") y el borde izquierdo cortado se desvanece
const pieza = async (zona, ancho) => {
  const m = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${zona.width}" height="${zona.height}"><defs><linearGradient id="g"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".06" stop-color="#fff"/></linearGradient></defs><rect width="100%" height="100%" fill="url(#g)"/></svg>`);
  const recortada = await sharp(LOGO).extract(zona).ensureAlpha().composite([{ input: m, blend: 'dest-in' }]).png().toBuffer();
  return sharp(recortada).resize({ width: ancho, height: ancho, fit: 'inside' }).png().toBuffer();
};

// Aro de la parrilla (cuadrillé de la gorra) con un plato oscuro al centro: la cuadrícula no pasa por las letras
const aro = (lado) => Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${lado}" height="${lado}" viewBox="0 0 400 400">
  <defs><clipPath id="c"><circle cx="200" cy="200" r="170"/></clipPath>
  <radialGradient id="b"><stop offset="0" stop-color="#fb8500" stop-opacity=".16"/><stop offset="1" stop-color="#fb8500" stop-opacity="0"/></radialGradient>
  <radialGradient id="p"><stop offset=".72" stop-color="${FONDO}"/><stop offset="1" stop-color="${FONDO}" stop-opacity="0"/></radialGradient></defs>
  <rect width="400" height="400" fill="${FONDO}"/>
  <g clip-path="url(#c)" stroke="#5a3a33" stroke-width="3" opacity=".55">
    ${Array.from({ length: 19 }, (_, i) => -360 + i * 40).map((k) => `<line x1="${k}" y1="0" x2="${k + 400}" y2="400"/><line x1="${k}" y1="400" x2="${k + 400}" y2="0"/>`).join('')}
  </g>
  <circle cx="200" cy="200" r="158" fill="url(#p)"/>
  <circle cx="200" cy="200" r="170" fill="url(#b)"/>
  <circle cx="200" cy="200" r="176" fill="none" stroke="#fb8500" stroke-opacity=".45" stroke-width="3"/>
</svg>`);

async function icono(nombre, lado, { anchoLogo, zona = RECORTE, conAro = true }) {
  const base = conAro ? sharp(aro(lado)).resize(lado, lado) : sharp({ create: { width: lado, height: lado, channels: 4, background: FONDO } });
  const logo = await pieza(zona, Math.round(lado * anchoLogo));
  const meta = await sharp(logo).metadata();
  await base.composite([{ input: logo, blend: 'lighten', left: Math.round((lado - meta.width) / 2), top: Math.round((lado - meta.height) / 2) }])
    .png({ compressionLevel: 9 }).toFile(join(SALIDA, nombre));
  console.log('✓', nombre);
}

await icono('icono-512.png', 512, { anchoLogo: 0.84 });
await icono('icono-192.png', 192, { anchoLogo: 0.84 });
await icono('icono-maskable-512.png', 512, { anchoLogo: 0.66 });            // zona segura del 80 % (Android recorta en círculo)
await icono('apple-touch-icon.png', 180, { anchoLogo: 0.8 });
await icono('favicon-48.png', 48, { anchoLogo: 0.78, zona: HAMBURGUESA, conAro: false });
