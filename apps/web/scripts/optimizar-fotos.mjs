// Pasa las fotos de public/img a WebP livianas (y un PNG para compartir) en public/img/opt y escribe el índice lib/fotos.generated.ts.
// Las rutas de la base de datos ("img/b/b1.1.png") no cambian: imgSrc() usa el índice para servir la versión liviana.
// Correr de nuevo cada vez que se agreguen fotos:  node scripts/optimizar-fotos.mjs
import { createRequire } from 'node:module';
import { readdirSync, statSync, mkdirSync, writeFileSync, existsSync, realpathSync } from 'node:fs';
import { join, dirname, relative, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(realpathSync(join(raiz, 'node_modules', 'next', 'package.json'))); // sharp viene con Next
let sharp;
try { sharp = require('sharp'); } catch {
  console.warn('optimizar-fotos: sharp no está disponible; se usa el índice que ya existe.');
  process.exit(0);
}

const ORIGEN = join(raiz, 'public', 'img');
const DESTINO = join(ORIGEN, 'opt');
const SALTEAR = ['opt', 'rediseno'];
const TAMANOS = { lg: 900, sm: 240 };
const FOTO = /\.(png|jpe?g|webp)$/i;

const recorrer = (dir) => readdirSync(dir).flatMap((n) => {
  const p = join(dir, n);
  if (statSync(p).isDirectory()) return SALTEAR.includes(n) && dir === ORIGEN ? [] : recorrer(p);
  return [p];
});

// clave = ruta sin extensión ("img/la-palta/crispy"); nombre de salida sin espacios ni paréntesis
const indice = {};
let antes = 0, despues = 0;
for (const archivo of recorrer(ORIGEN)) {
  const rel = relative(ORIGEN, archivo).replaceAll('\\', '/');
  const ext = extname(rel);
  if (ext && !FOTO.test(ext)) continue;
  const base = ext ? rel.slice(0, -ext.length) : rel;
  const limpio = base.toLowerCase().replace(/[^a-z0-9/.-]+/g, '-').replace(/-+/g, '-').replace(/-(?=\/|$)/g, '');
  try { await sharp(archivo).metadata(); } catch { continue; } // no es imagen
  mkdirSync(dirname(join(DESTINO, limpio)), { recursive: true });
  for (const [t, ancho] of Object.entries(TAMANOS)) {
    const salida = join(DESTINO, `${limpio}.${t}.webp`);
    if (!existsSync(salida) || statSync(salida).mtimeMs < statSync(archivo).mtimeMs) {
      await sharp(archivo).rotate().resize({ width: ancho, withoutEnlargement: true }).webp({ quality: t === 'sm' ? 72 : 78, alphaQuality: 90 }).toFile(salida);
    }
    despues += statSync(salida).size;
  }
  // PNG con bordes transparentes para la imagen al compartir (el generador de imágenes no lee WebP)
  const og = join(DESTINO, `${limpio}.og.png`);
  if (!existsSync(og) || statSync(og).mtimeMs < statSync(archivo).mtimeMs) {
    // Bordes que se desvanecen (transparentes), para que la foto se funda con la tarjeta
    const base = await sharp(archivo).rotate().resize({ width: 640, height: 640, fit: 'inside', withoutEnlargement: true }).ensureAlpha().toBuffer({ resolveWithObject: true });
    const { width: w, height: h } = base.info;
    const mascara = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><defs><radialGradient id="g" cx="50%" cy="50%" r="50%"><stop offset="58%" stop-color="#fff"/><stop offset="100%" stop-color="#fff" stop-opacity="0"/></radialGradient></defs><rect width="100%" height="100%" fill="url(#g)"/></svg>`);
    await sharp(base.data).composite([{ input: mascara, blend: 'dest-in' }]).png({ compressionLevel: 9, effort: 8 }).toFile(og);
  }
  antes += statSync(archivo).size;
  indice[`img/${base}`] = `/img/opt/${limpio}`;
}

const ts = `// Generado por scripts/optimizar-fotos.mjs. No editar a mano.\nexport const FOTOS: Record<string, string> = ${JSON.stringify(indice, null, 2)};\n`;
writeFileSync(join(raiz, 'lib', 'fotos.generated.ts'), ts);
const mb = (b) => (b / 1048576).toFixed(1) + ' MB';
console.log(`${Object.keys(indice).length} fotos · originales ${mb(antes)} → optimizadas (2 tamaños) ${mb(despues)}`);
