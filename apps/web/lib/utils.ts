import { FOTOS } from './fotos.generated';

export function formatPrice(amount: number): string {
  return `$${amount.toLocaleString('es-AR')}`;
}

/* ===== Horario del local =====
   Siempre con la hora de Argentina (aunque el teléfono tenga otra zona). Martes a domingo, 19:30 a 23:30. */
const DIAS_ABIERTO = [0, 2, 3, 4, 5, 6]; // 0 = domingo
const ABRE = 19 * 60 + 30;
const CIERRA = 23 * 60 + 30;
export const DEMORA = '30–45 min';
const NOMBRES_DIA = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];

/** Día (0 = domingo) y minutos desde la medianoche, en Santa Fe. */
export function horaArgentina(ahora = new Date()) {
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Argentina/Buenos_Aires', weekday: 'short', hour: 'numeric', minute: 'numeric', hourCycle: 'h23',
  }).formatToParts(ahora).map((x) => [x.type, x.value]));
  const dia = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(p.weekday);
  return { dia, mins: Number(p.hour) * 60 + Number(p.minute) };
}

const duracion = (m: number) => {
  const h = Math.floor(m / 60), r = m % 60;
  return h ? (r ? `${h} h ${r} min` : `${h} h`) : `${r} min`;
};

export type EstadoLocal = { abierto: boolean; corto: string; detalle: string };

/** Estado en vivo: "Abierto · cierra 23:30" o "Abrimos en 2 h 15 min". */
export function estadoLocal(ahora = new Date()): EstadoLocal {
  const { dia, mins } = horaArgentina(ahora);
  if (DIAS_ABIERTO.includes(dia) && mins >= ABRE && mins < CIERRA) {
    const quedan = CIERRA - mins;
    const cierre = quedan <= 45 ? `cierra en ${duracion(quedan)}` : 'cierra 23:30';
    return { abierto: true, corto: `Abierto · ${cierre}`, detalle: `demora aprox. ${DEMORA}` };
  }
  // Minutos hasta la próxima apertura
  let espera = 0, d = dia, m = mins, dias = 0;
  while (!(DIAS_ABIERTO.includes(d) && m < ABRE)) { espera += 1440 - m; m = 0; d = (d + 1) % 7; dias++; }
  espera += ABRE - m;
  const corto = espera <= 12 * 60
    ? `Abrimos en ${duracion(espera)}`
    : dias === 0 ? 'Abrimos hoy 19:30' : dias === 1 ? 'Abrimos mañana 19:30' : `Abrimos el ${NOMBRES_DIA[d]} 19:30`;
  return { abierto: false, corto, detalle: 'Mirá el menú y armá tu pedido' };
}

export const isOpen = () => estadoLocal().abierto;
export const nextOpeningMsg = () => estadoLocal().corto;

export const DELIVERY_COSTS: Record<string, number> = {
  retiro: 0,
  '1km':  2000,
  '3km':  2500,
  '4km':  3500,
  '6km':  4500,
};

// Zonas de envío y medios de pago: la misma fuente para el inicio y el checkout
export const ZONAS = [
  { value: 'retiro', label: 'Retiro en el local', price: 0 },
  { value: '1km',    label: 'Hasta 1 km',         price: DELIVERY_COSTS['1km'] },
  { value: '3km',    label: '1 km a 3 km',        price: DELIVERY_COSTS['3km'] },
  { value: '4km',    label: '3 km a 4 km',        price: DELIVERY_COSTS['4km'] },
  { value: '6km',    label: '5 km a 6 km',        price: DELIVERY_COSTS['6km'] },
];

export const PAGOS = [
  { value: 'efectivo',      label: 'Efectivo' },
  { value: 'transferencia', label: 'Transferencia' },
];

export const HORARIOS = [
  { day: 'Lunes',     time: 'Cerrado',          open: false },
  { day: 'Martes',    time: '19:30 a 23:30',    open: true  },
  { day: 'Miércoles', time: '19:30 a 23:30',    open: true  },
  { day: 'Jueves',    time: '19:30 a 23:30',    open: true  },
  { day: 'Viernes',   time: '19:30 a 23:30',    open: true  },
  { day: 'Sábado',    time: '19:30 a 23:30',    open: true  },
  { day: 'Domingo',   time: '19:30 a 23:30',    open: true  },
];

export const WA_NUMBER = process.env.NEXT_PUBLIC_WA_NUMBER ?? '5493425039876';
export const INSTAGRAM_URL = 'https://www.instagram.com/fredysburger/';

/** Enlace a WhatsApp con mensaje prellenado; cada botón manda el suyo para saber desde dónde escriben. */
export const waLink = (msg: string) => `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(msg)}`;

/** Las imágenes vienen de la API como "img/...". Se sirve la versión WebP liviana (scripts/optimizar-fotos.mjs);
 *  si la foto no existe, va la de promo. "sm" (240 px) para miniaturas, "lg" (900 px) para fotos grandes. */
const FOTO_PROMO = 'img/promo';
export const imgSrc = (path?: string, tam: 'sm' | 'lg' = 'lg') => {
  if (path && path.startsWith('http')) return path;
  const clave = (path ?? '').replace(/^\//, '').replace(/\.(png|jpe?g|webp)$/i, '');
  const opt = FOTOS[clave] ?? FOTOS[FOTO_PROMO];
  return opt ? `${opt}.${tam}.webp` : path ? `/${path.replace(/^\//, '')}` : '';
};
