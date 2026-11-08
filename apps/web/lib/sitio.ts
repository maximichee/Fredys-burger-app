/** Dirección pública de la web: una sola fuente para metadatos, sitemap, robots y datos para Google.
 *  Al tener el dominio final, cargar NEXT_PUBLIC_SITE_URL en Vercel (sin barra al final). */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://fredys-burger-app-web.vercel.app').replace(/\/$/, '');
