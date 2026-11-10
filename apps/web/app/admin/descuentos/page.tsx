'use client';
import { useEffect, useState } from 'react';
import { adminFetch } from '@/lib/api';
import { formatPrice } from '@/lib/utils';
import { Interruptor, useAviso, token, campo } from '@/components/admin/Controles';

/* Códigos de descuento: se arman acá y el cliente los usa en el checkout. */

type Codigo = {
  id: string; code: string; type: 'PERCENT' | 'FIXED'; value: number; active: boolean;
  minTotal: number | null; maxUses: number | null; uses: number; expiresAt: string | null; createdAt: string;
};

const etiqueta = (c: Pick<Codigo, 'type' | 'value'>) => (c.type === 'PERCENT' ? `${c.value}%` : formatPrice(c.value));
const fecha = (f: string) => new Date(f).toLocaleDateString('es-AR', { day: 'numeric', month: 'short', timeZone: 'America/Argentina/Buenos_Aires' });

/** Estado del código para mostrar: activo, pausado, vencido o agotado */
function estadoDe(c: Codigo) {
  if (c.expiresAt && new Date(c.expiresAt).getTime() < Date.now()) return { texto: 'Vencido', clase: 'bg-white/10 text-white/50', vivo: false };
  if (c.maxUses != null && c.uses >= c.maxUses) return { texto: 'Sin usos', clase: 'bg-white/10 text-white/50', vivo: false };
  if (!c.active) return { texto: 'Pausado', clase: 'bg-white/10 text-white/60', vivo: false };
  return { texto: 'Activo', clase: 'bg-green-400 text-black', vivo: true };
}

/** Código al azar fácil de dictar: FREDY + 2 dígitos + letra (sin letras confusas) */
const generar = () => `FREDY${Math.floor(10 + Math.random() * 90)}${'ABCDEFGHJKMNPQRSTUVWXYZ'[Math.floor(Math.random() * 23)]}`;

/** Fecha de hoy + días, en formato del input date (AAAA-MM-DD) */
const enDias = (n: number) => new Date(Date.now() + n * 864e5).toLocaleDateString('en-CA', { timeZone: 'America/Argentina/Buenos_Aires' });

export default function AdminDescuentosPage() {
  const [lista, setLista] = useState<Codigo[] | null>(null);
  const [code, setCode] = useState('');
  const [type, setType] = useState<'PERCENT' | 'FIXED'>('PERCENT');
  const [value, setValue] = useState('10');
  const [minTotal, setMinTotal] = useState('');
  const [maxUses, setMaxUses] = useState('');
  const [vence, setVence] = useState('');
  const [guardando, setGuardando] = useState(false);
  const { avisar, Aviso } = useAviso();

  const cargar = () => adminFetch<Codigo[]>('/discounts', token()).then(setLista).catch((e) => avisar(e.message, true));
  useEffect(() => { cargar(); setCode(generar()); }, []);

  const crear = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuardando(true);
    try {
      const c = await adminFetch<Codigo>('/discounts', token(), {
        method: 'POST',
        body: JSON.stringify({
          code, type, value: Number(value), minTotal: minTotal ? Number(minTotal) : null, maxUses: maxUses ? Number(maxUses) : null,
          // Vence al final del día elegido (hora de Argentina)
          expiresAt: vence ? `${vence}T23:59:59-03:00` : null,
        }),
      });
      avisar(`Código ${c.code} creado`);
      setCode(generar()); setMinTotal(''); setMaxUses(''); setVence('');
      cargar();
    } catch (err) { avisar((err as Error).message, true); }
    setGuardando(false);
  };

  const pausar = async (c: Codigo) => {
    try {
      await adminFetch(`/discounts/${c.id}`, token(), { method: 'PATCH', body: JSON.stringify({ active: !c.active }) });
      setLista((l) => l?.map((x) => (x.id === c.id ? { ...x, active: !c.active } : x)) ?? null);
      avisar(c.active ? `${c.code} pausado: ya no se puede usar` : `${c.code} activo otra vez`);
    } catch (e) { avisar((e as Error).message, true); }
  };

  const borrar = async (c: Codigo) => {
    if (!confirm(`¿Borrar el código ${c.code}?\nLos pedidos que ya lo usaron no cambian.`)) return;
    try {
      await adminFetch(`/discounts/${c.id}`, token(), { method: 'DELETE' });
      setLista((l) => l?.filter((x) => x.id !== c.id) ?? null);
      avisar(`${c.code} borrado`);
    } catch (e) { avisar((e as Error).message, true); }
  };

  /** Texto listo para pegar en Instagram o WhatsApp */
  const copiar = async (c: Codigo) => {
    const condiciones = [
      c.minTotal ? `en compras desde ${formatPrice(c.minTotal)}` : '',
      c.expiresAt ? `hasta el ${fecha(c.expiresAt)}` : '',
    ].filter(Boolean).join(' ');
    const texto = `🍔 ¡Promo Fredy's! Usá el código *${c.code}* y tenés ${etiqueta(c)} de descuento${condiciones ? ` ${condiciones}` : ''}. Pedí en ${window.location.origin}`;
    try { await navigator.clipboard.writeText(texto); avisar('Texto copiado: pegalo en WhatsApp o Instagram'); }
    catch { prompt('Copiá este texto:', texto); }
  };

  const ejemplo = 20000;
  const descEjemplo = type === 'PERCENT' ? Math.round((ejemplo * (Number(value) || 0)) / 100) : Math.min(ejemplo, Number(value) || 0);

  return (
    <div className="mx-auto max-w-[1300px] space-y-5 p-4 sm:p-6">
      <div>
        <h1 className="text-2xl font-extrabold">Descuentos</h1>
        <p className="mt-1 text-sm text-white/45">Armá un código, pasáselo a tus clientes y lo usan en el checkout: el descuento se resta solo del total.</p>
      </div>

      <div className="grid gap-5 xl:grid-cols-[400px_1fr]">
        {/* Crear */}
        <form onSubmit={crear} className="h-fit space-y-4 rounded-[28px] bg-[#232323] p-5 xl:sticky xl:top-6">
          <h2 className="text-lg font-extrabold">Nuevo código</h2>

          <label className="block space-y-1.5 text-xs font-bold text-white/50">
            Código
            <div className="flex gap-2">
              <input value={code} onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, ''))} maxLength={20}
                className={`${campo} font-mono text-base font-bold tracking-wider text-white`} />
              <button type="button" onClick={() => setCode(generar())} title="Generar otro"
                className="shrink-0 rounded-2xl bg-white/[0.07] px-3 text-sm text-white/70 hover:text-white">🎲</button>
            </div>
          </label>

          <div className="space-y-1.5 text-xs font-bold text-white/50">
            Tipo de descuento
            <div className="grid grid-cols-2 gap-2">
              {([['PERCENT', 'Porcentaje %'], ['FIXED', 'Monto fijo $']] as const).map(([t, l]) => (
                <button key={t} type="button" onClick={() => { setType(t); setValue(t === 'PERCENT' ? '10' : '2000'); }}
                  className={`rounded-2xl py-2.5 text-sm font-bold ${type === t ? 'bg-brand text-black' : 'bg-white/[0.06] text-white/60 hover:text-white'}`}>{l}</button>
              ))}
            </div>
          </div>

          <label className="block space-y-1.5 text-xs font-bold text-white/50">
            {type === 'PERCENT' ? '¿Qué porcentaje?' : '¿Cuántos pesos?'}
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-white/40">{type === 'PERCENT' ? '%' : '$'}</span>
              <input value={value} onChange={(e) => setValue(e.target.value.replace(/\D/g, ''))} inputMode="numeric" className={`${campo} pl-8 text-white`} />
            </div>
            {type === 'PERCENT' && (
              <div className="flex gap-1.5 pt-1">
                {[5, 10, 15, 20, 25].map((n) => (
                  <button key={n} type="button" onClick={() => setValue(String(n))}
                    className={`flex-1 rounded-xl py-1.5 text-xs ${value === String(n) ? 'bg-white text-black' : 'bg-white/[0.05] text-white/55'}`}>{n}%</button>
                ))}
              </div>
            )}
          </label>

          <details className="group rounded-2xl bg-white/[0.03] p-3">
            <summary className="cursor-pointer list-none text-xs font-bold text-white/60">
              Condiciones (opcional) <span className="text-white/30 group-open:hidden">· vencimiento, usos, compra mínima</span>
            </summary>
            <div className="mt-3 space-y-3">
              <label className="block space-y-1.5 text-xs font-bold text-white/50">
                Vence el
                <input type="date" value={vence} min={enDias(0)} onChange={(e) => setVence(e.target.value)} className={`${campo} text-white [color-scheme:dark]`} />
                <span className="flex gap-1.5">
                  {[['Hoy', 0], ['1 semana', 7], ['1 mes', 30]].map(([l, n]) => (
                    <button key={l} type="button" onClick={() => setVence(enDias(n as number))} className="rounded-lg bg-white/[0.05] px-2 py-1 font-normal text-white/55 hover:text-white">{l}</button>
                  ))}
                  {vence && <button type="button" onClick={() => setVence('')} className="px-2 py-1 font-normal text-white/35">sin vencimiento</button>}
                </span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                <label className="block space-y-1.5 text-xs font-bold text-white/50">
                  Usos máximos
                  <input value={maxUses} onChange={(e) => setMaxUses(e.target.value.replace(/\D/g, ''))} inputMode="numeric" placeholder="Sin tope" className={`${campo} text-white`} />
                </label>
                <label className="block space-y-1.5 text-xs font-bold text-white/50">
                  Compra mínima $
                  <input value={minTotal} onChange={(e) => setMinTotal(e.target.value.replace(/\D/g, ''))} inputMode="numeric" placeholder="Sin mínimo" className={`${campo} text-white`} />
                </label>
              </div>
            </div>
          </details>

          <p className="rounded-2xl bg-brand/10 px-3 py-2.5 text-xs text-brand">
            Ejemplo: en un pedido de {formatPrice(ejemplo)} descuenta <b>{formatPrice(descEjemplo)}</b> → paga {formatPrice(ejemplo - descEjemplo)}
          </p>

          <button disabled={guardando || !code || !value}
            className="w-full rounded-full bg-brand py-3.5 font-bold text-black hover:bg-brand-strong disabled:opacity-40">
            {guardando ? 'Creando…' : 'Crear código'}
          </button>
        </form>

        {/* Lista */}
        <div className="space-y-3">
          {lista === null && <p className="py-16 text-center text-sm text-white/30">Cargando…</p>}
          {lista?.length === 0 && (
            <div className="rounded-[28px] bg-[#1c1c1c] px-6 py-16 text-center">
              <p className="text-3xl">🏷️</p>
              <p className="mt-2 font-bold">Todavía no hay códigos</p>
              <p className="mt-1 text-sm text-white/40">Creá el primero con el formulario de la izquierda.</p>
            </div>
          )}
          <div className="grid gap-3 2xl:grid-cols-2">
            {lista?.map((c) => {
              const e = estadoDe(c);
              return (
                <article key={c.id} className={`relative overflow-hidden rounded-[26px] bg-[#232323] ${e.vivo ? '' : 'opacity-60'}`}>
                  <div className="flex items-stretch">
                    {/* Talón tipo cupón */}
                    <div className={`flex w-28 shrink-0 flex-col items-center justify-center p-4 ${e.vivo ? 'bg-brand text-black' : 'bg-white/[0.06] text-white/60'}`}>
                      <p className="text-3xl font-extrabold leading-none">{etiqueta(c)}</p>
                      <p className="mt-1 text-[10px] font-bold uppercase tracking-widest opacity-70">off</p>
                    </div>
                    <div className="relative min-w-0 flex-1 border-l-2 border-dashed border-white/10 p-4">
                      <span className="absolute -left-3 -top-3 h-6 w-6 rounded-full bg-[#0a0a0a]" />
                      <span className="absolute -bottom-3 -left-3 h-6 w-6 rounded-full bg-[#0a0a0a]" />
                      <div className="flex items-start justify-between gap-2">
                        <p className="truncate font-mono text-lg font-extrabold tracking-wider">{c.code}</p>
                        <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold ${e.clase}`}>{e.texto}</span>
                      </div>
                      <p className="mt-1 text-xs text-white/45">
                        Usado <b className="text-white/80">{c.uses}</b>{c.maxUses != null ? ` de ${c.maxUses}` : ''} {c.uses === 1 ? 'vez' : 'veces'}
                        {c.minTotal ? ` · desde ${formatPrice(c.minTotal)}` : ''}
                        {c.expiresAt ? ` · vence ${fecha(c.expiresAt)}` : ' · sin vencimiento'}
                      </p>
                      {c.maxUses != null && (
                        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/5">
                          <div className="h-full rounded-full bg-brand" style={{ width: `${Math.min(100, (c.uses / c.maxUses) * 100)}%` }} />
                        </div>
                      )}
                      <div className="mt-3 flex items-center justify-between gap-2">
                        <Interruptor prendido={c.active} onCambio={() => pausar(c)} si="Activo" no="Pausado" />
                        <div className="flex gap-1">
                          <button onClick={() => copiar(c)} title="Copiar texto para compartir"
                            className="rounded-full bg-white/[0.07] px-3 py-1.5 text-xs font-bold text-white/75 hover:bg-white/[0.12]">Copiar promo</button>
                          <button onClick={() => borrar(c)} title="Borrar" aria-label="Borrar"
                            className="flex h-8 w-8 items-center justify-center rounded-full bg-white/[0.06] text-white/50 hover:text-red-400">🗑</button>
                        </div>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </div>
      {Aviso}
    </div>
  );
}
