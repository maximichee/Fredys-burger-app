'use client';
import { use, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { getProduct } from '@/lib/api';
import { useCart } from '@/lib/cart-store';
import { useSugerencia } from '@/lib/sugerencia';
import { medir } from '@/lib/medir';
import { formatPrice, imgSrc } from '@/lib/utils';
import { Navbar } from '@/components/Navbar';
import { Parrilla, Semillas, SEMILLAS_CHICAS } from '@/components/fredys/Piezas';
import { volarAlCarrito, prefersReducedMotion, getLenis } from '@/lib/motion';
import type { Product, ProductPrice } from '@fredys/types';

export default function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const router = useRouter();
  const addItem = useCart((s) => s.addItem);
  const ofrecer = useSugerencia((s) => s.ofrecer);

  const [product, setProduct] = useState<Product | null>(null);
  const [selected, setSelected] = useState<ProductPrice | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [activeImg, setActiveImg] = useState(0);
  const [added, setAdded] = useState(false);
  const pista = useRef<HTMLDivElement>(null);
  // Forma de cada foto (se sabe al cargar): 'alta' = vertical, 'redonda' = cuadrada o ancha
  const [formas, setFormas] = useState<Record<number, 'alta' | 'redonda'>>({});
  const marcarForma = (i: number, f: 'alta' | 'redonda') => setFormas((s) => (s[i] === f ? s : { ...s, [i]: f }));
  // Respaldo: fotos que ya estaban en caché antes de hidratar (onLoad no llega) o que fallan
  useEffect(() => {
    if (!product) return;
    const id = setTimeout(() => {
      pista.current?.querySelectorAll('img').forEach((im, i) => {
        if (im.complete) marcarForma(i, im.naturalHeight > im.naturalWidth * 1.15 ? 'alta' : 'redonda');
      });
    }, 1500);
    return () => clearTimeout(id);
  }, [product]);

  useEffect(() => {
    getProduct(slug).then((p) => {
      const ordenado = { ...p, prices: [...p.prices].sort((a, b) => a.order - b.order) };
      setProduct(ordenado);
      setSelected(ordenado.prices[0] ?? null);
      const base = ordenado.prices[0];
      if (base) medir('view_item', { currency: 'ARS', value: base.price, items: [{ item_id: p.slug, item_name: p.name, price: base.price }] });
    }).catch(() => router.push('/'));
  }, [slug, router]);

  // Galería: la foto activa sale de cuánto se deslizó la pista
  const alDeslizar = () => {
    const el = pista.current;
    if (el && el.clientWidth) setActiveImg(Math.round(el.scrollLeft / el.clientWidth));
  };
  const irA = (i: number) => {
    const el = pista.current;
    if (el) el.scrollTo({ left: i * el.clientWidth, behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
  };

  if (!product) {
    return (
      <>
        <Navbar />
        <div className="flex min-h-screen items-center justify-center" role="status" aria-label="Cargando">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand border-t-transparent" />
        </div>
      </>
    );
  }

  const fotos = product.images.length ? product.images : ['']; // sin fotos: la de promo (imgSrc)

  // Ingredientes: si la descripción es una lista ("Pan de papa, 110gr carne, cheddar..."), va en un desplegable
  const ingredientes = (product.description ?? '').split(',').map((s) => s.trim()).filter(Boolean)
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1));
  const esLista = ingredientes.length >= 3;
  // La última foto de las burgers es la desarmada con los nombres de cada capa
  const verDesarmada = () => {
    irA(fotos.length - 1);
    const caja = pista.current?.parentElement;
    if (!caja) return;
    const lenis = getLenis();
    if (lenis) lenis.scrollTo(caja, { offset: -110 });
    else caja.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'center' });
  };

  const handleAdd = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!selected) return;
    addItem({
      productId: product.id,
      productSlug: product.slug,
      name: product.name,
      image: product.images[0] ?? '',
      priceLabel: selected.label,
      price: selected.price,
      quantity,
    }, false, 'ficha');
    volarAlCarrito(e.currentTarget);
    ofrecer(product.id);
    setAdded(true);
    setTimeout(() => setAdded(false), 1400);
  };

  return (
    <>
      <Navbar />
      <div className="min-h-screen pb-36 pt-[calc(var(--nav-h,92px)+8px)] lg:pb-20">
        <div className="mx-auto max-w-6xl px-[var(--gutter)]">
          <button onClick={() => router.back()} className="mb-4 inline-flex min-h-[44px] items-center gap-2 text-sm font-semibold text-apagado transition-colors hover:text-crema">
            ← Volver al menú
          </button>

          <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:items-center">
            {/* ===== FOTO ===== */}
            <div>
              <div className="foto-parrilla relative mx-auto aspect-square w-full max-w-[560px]" data-burst>
                <Parrilla id="plato-ficha" className="absolute inset-0 h-full w-full" />
                {/* Plato oscuro: la parrilla queda de borde y no se transparenta sobre la comida */}
                <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle,var(--bg)_58%,transparent_74%)]" aria-hidden="true" />
                {/* Fotos que se pasan deslizando (scroll con imán), cada una según su forma:
                    vertical → entera en una tarjeta fundida (las infografías tienen texto);
                    cuadrada o ancha → recortada en un plato redondo de borde difuminado. */}
                <div ref={pista} onScroll={alDeslizar} aria-roledescription="carrusel" aria-label={`Fotos de ${product.name}`}
                  className="no-scrollbar absolute inset-0 flex snap-x snap-mandatory overflow-x-auto overscroll-x-contain">
                  {fotos.map((img, i) => {
                    const redonda = formas[i] === 'redonda';
                    return (
                      <div key={i} className="relative h-full w-full flex-shrink-0 snap-center" aria-roledescription="foto" aria-label={`${i + 1} de ${fotos.length}`}>
                        <div className={redonda ? 'foto-plato absolute inset-[7%]' : 'foto-fundida absolute inset-x-[16%] inset-y-0'}>
                          <Image src={imgSrc(img)} alt={i === 0 ? product.name : `${product.name}, foto ${i + 1}`} fill
                            className={`transition-opacity duration-300 ${formas[i] ? 'opacity-100' : 'opacity-0'} ${redonda ? 'object-cover' : 'object-contain'}`} sizes="(max-width: 1024px) 90vw, 520px" priority={i === 0}
                            onLoad={(e) => { const im = e.currentTarget; marcarForma(i, im.naturalHeight > im.naturalWidth * 1.15 ? 'alta' : 'redonda'); }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
                <Semillas items={SEMILLAS_CHICAS} />
                {/* Celular: puntitos dentro del plato (las miniaturas quedaban tapadas por el botón fijo) */}
                {fotos.length > 1 && (
                  <div className="absolute inset-x-0 bottom-[3%] z-[2] flex justify-center lg:hidden">
                    {fotos.map((_, i) => (
                      <button key={i} type="button" onClick={() => irA(i)} aria-label={`Ver foto ${i + 1}`} aria-current={activeImg === i}
                        className="grid h-9 w-7 place-items-center">
                        <span className={`block h-2 rounded-full transition-all duration-300 ${activeImg === i ? 'w-5 bg-brand' : 'w-2 bg-crema/40'}`} />
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {fotos.length > 1 && (
                <div className="mt-4 hidden justify-center gap-2 lg:flex">
                  {fotos.map((img, i) => (
                    <button key={i} type="button" onClick={() => irA(i)} aria-label={`Ver foto ${i + 1}`} aria-pressed={activeImg === i}
                      className={`relative h-16 w-16 overflow-hidden rounded-[var(--r-sm)] border-2 transition-colors ${activeImg === i ? 'border-brand' : 'border-transparent opacity-70 hover:opacity-100'}`}>
                      <Image src={imgSrc(img, 'sm')} alt="" fill sizes="64px" className="object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* ===== DATOS ===== */}
            <div className="space-y-7">
              <div>
                <h1 className="titulo sticker text-[clamp(2.8rem,11vw,5.2rem)] leading-[.95]">{product.name}</h1>
                {product.description && !esLista && <p className="mt-4 text-lg leading-relaxed text-apagado">{product.description}</p>}
                {/* Descripción con ingredientes: desplegable (la ficha queda corta en el celular) */}
                {esLista && (
                  <details className="group vidrio mt-5 rounded-[var(--r-md)]">
                    <summary className="flex min-h-[56px] cursor-pointer list-none items-center gap-3 px-4 py-3 [&::-webkit-details-marker]:hidden">
                      <span className="min-w-0 flex-1">
                        <span className="font-semibold">Ingredientes</span> <span className="text-sm text-apagado">· {ingredientes.length}</span>
                        <span className="block truncate text-sm text-apagado group-open:hidden">{product.description}</span>
                      </span>
                      <span className="grid h-8 w-8 flex-shrink-0 place-items-center rounded-full bg-dark-300 text-apagado transition-transform duration-300 group-open:rotate-180" aria-hidden="true">▾</span>
                    </summary>
                    <div className="px-4 pb-4">
                      <ul className="flex flex-wrap gap-2">
                        {ingredientes.map((ing) => (
                          <li key={ing} className="rounded-full border border-[var(--line)] bg-dark-300/60 px-3 py-1.5 text-sm">{ing}</li>
                        ))}
                      </ul>
                      {fotos.length >= 3 && (
                        <button type="button" onClick={verDesarmada} className="mt-3 inline-flex min-h-[44px] items-center gap-2 text-sm font-semibold text-brand underline-offset-4 hover:underline">
                          Ver cómo se arma <span aria-hidden="true">↑</span>
                        </button>
                      )}
                    </div>
                  </details>
                )}
              </div>

              {product.prices.length > 1 && (
                <fieldset>
                  <legend className="mb-3 text-sm font-semibold uppercase tracking-[.14em] text-brand">Tamaño</legend>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {product.prices.map((price) => (
                      <button key={price.id} type="button" onClick={() => setSelected(price)} aria-pressed={selected?.id === price.id}
                        className="ficha flex-col !items-start !justify-center gap-0.5">
                        <span className="text-sm font-semibold capitalize">{price.label}</span>
                        <span className="font-extrabold text-brand">{formatPrice(price.price)}</span>
                      </button>
                    ))}
                  </div>
                </fieldset>
              )}

              <div>
                <p className="mb-3 text-sm font-semibold uppercase tracking-[.14em] text-brand">Cantidad</p>
                <div className="inline-flex items-center gap-2 rounded-full border border-[var(--line)] p-1">
                  <button onClick={() => setQuantity(Math.max(1, quantity - 1))} aria-label="Una menos"
                    className="grid h-11 w-11 place-items-center rounded-full bg-dark-300 text-xl font-bold transition-colors hover:bg-brand/25">−</button>
                  <span className="w-8 text-center text-xl font-extrabold" aria-live="polite">{quantity}</span>
                  <button onClick={() => setQuantity(quantity + 1)} aria-label="Una más"
                    className="grid h-11 w-11 place-items-center rounded-full bg-dark-300 text-xl font-bold transition-colors hover:bg-brand/25">+</button>
                </div>
              </div>

              <div className="hidden lg:block">
                <button onClick={handleAdd} disabled={!selected} className="btn-fredys w-full max-w-md justify-between">
                  <span>{added ? 'Sumada a tu pedido' : 'Sumar al pedido'}</span>
                  <span>{selected ? formatPrice(selected.price * quantity) : ''}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Barra fija del celular */}
        <div className="fixed inset-x-0 bottom-0 z-40 p-3 pb-[max(12px,env(safe-area-inset-bottom))] lg:hidden">
          <button onClick={handleAdd} disabled={!selected} className="btn-fredys w-full justify-between">
            <span>{added ? 'Sumada a tu pedido' : 'Sumar al pedido'}</span>
            <span>{selected ? formatPrice(selected.price * quantity) : ''}</span>
          </button>
        </div>
      </div>
    </>
  );
}
