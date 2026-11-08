// Piezas gráficas de la marca: la parrilla (cuadrillé de la gorra de Fredy) y las semillas del pan.

const LINEAS: { x1: number; y1: number; x2: number; y2: number }[] = [];
for (let k = -360; k <= 360; k += 40) {
  LINEAS.push({ x1: k, y1: 0, x2: k + 400, y2: 400 });
  LINEAS.push({ x1: k, y1: 400, x2: k + 400, y2: 0 });
}

export function Parrilla({ id, className = '', aro = true }: { id: string; className?: string; aro?: boolean }) {
  return (
    <svg className={`parrilla ${className}`} viewBox="0 0 400 400" aria-hidden="true" focusable="false">
      <defs><clipPath id={id}><circle cx="200" cy="200" r="188" /></clipPath></defs>
      <g clipPath={`url(#${id})`}>
        {LINEAS.map((l, i) => <line key={i} {...l} />)}
      </g>
      {aro && <circle className="aro" cx="200" cy="200" r="194" />}
    </svg>
  );
}

/* Cheddar que chorrea atado al scroll (MotionProvider, data-chorro).
   modo "baja": se estira hacia abajo al bajar y se recoge al subir. modo "mancha": la salpicadura se abre. */
export const CHEDDAR = {
  chorreado: { src: '/img/rediseno/cheddar-chorreado.webp', w: 849, h: 1429 },
  hilo: { src: '/img/rediseno/cheddar-hilo.webp', w: 185, h: 538 },
  gota: { src: '/img/rediseno/cheddar-gota.webp', w: 369, h: 559 },
  borde: { src: '/img/rediseno/cheddar-borde.webp', w: 1100, h: 707 },
  mancha: { src: '/img/rediseno/cheddar-mancha.webp', w: 900, h: 530 },
} as const;

export function Chorro({ pieza, className = '', modo = 'baja' }: { pieza: keyof typeof CHEDDAR; className?: string; modo?: 'baja' | 'mancha' }) {
  const p = CHEDDAR[pieza];
  return (
    <div className={`chorro ${className}`} data-chorro={modo} aria-hidden="true">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={p.src} alt="" width={p.w} height={p.h} loading="lazy" decoding="async" />
    </div>
  );
}

export type SemillaDef ={ x: string; y: string; r: number; s?: number; cheddar?: boolean };

export function Semillas({ items }: { items: SemillaDef[] }) {
  return (
    <>
      {items.map((d, i) => (
        <span
          key={i}
          className={`semilla${d.cheddar ? ' semilla--cheddar' : ''}`}
          style={{ '--x': d.x, '--y': d.y, '--r': `${d.r}deg`, ...(d.s ? { '--s': `${d.s}px` } : {}) } as React.CSSProperties}
          aria-hidden="true"
        >
          <i />
        </span>
      ))}
    </>
  );
}

export const SEMILLAS_PORTADA: SemillaDef[] = [
  { x: '14%', y: '22%', r: -30 }, { x: '24%', y: '9%', r: 20, s: 9 }, { x: '8%', y: '48%', r: 40, s: 8, cheddar: true },
  { x: '18%', y: '72%', r: -12 }, { x: '30%', y: '88%', r: 60, s: 9 }, { x: '38%', y: '4%', r: -50, s: 10 },
  { x: '63%', y: '6%', r: 15 }, { x: '78%', y: '14%', r: -20, s: 9, cheddar: true }, { x: '88%', y: '33%', r: 35, s: 12 },
  { x: '91%', y: '58%', r: -45, s: 9 }, { x: '80%', y: '80%', r: 10, s: 10, cheddar: true }, { x: '66%', y: '92%', r: -25, s: 8 },
  { x: '4%', y: '30%', r: 70, s: 7 }, { x: '95%', y: '12%', r: -60, s: 7 },
];

export const SEMILLAS_CHICAS: SemillaDef[] = [
  { x: '6%', y: '20%', r: -30 }, { x: '48%', y: '0%', r: 15 }, { x: '90%', y: '24%', r: 40, cheddar: true },
  { x: '2%', y: '76%', r: 25 }, { x: '52%', y: '96%', r: -55 }, { x: '94%', y: '78%', r: 10, cheddar: true },
];

export function IconoFlecha() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

export function IconoMas() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>;
}
