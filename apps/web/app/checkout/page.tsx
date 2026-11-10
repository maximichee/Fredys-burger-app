'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

export const dynamic = 'force-dynamic';
import { motion } from 'framer-motion';
import { useCart } from '@/lib/cart-store';
import { createOrder } from '@/lib/api';
import { guardarUltimoPedido } from '@/lib/ultimo-pedido';
import { BotonInstalar } from '@/components/fredys/App';
import { medirItems } from '@/lib/medir';
import { formatPrice, DELIVERY_COSTS, ZONAS, PAGOS } from '@/lib/utils';
import { telefonoValido } from '@/lib/mensajes-wa';
import { Navbar } from '@/components/Navbar';
import { IconoFlecha } from '@/components/fredys/Piezas';

/* Checkout en calma: nada se mueve mientras se llenan los datos. */
export default function CheckoutPage() {
  const router = useRouter();
  const { items, subtotal, clearCart } = useCart();

  const [zona,    setZona]    = useState('retiro');
  const [pago,    setPago]    = useState('efectivo');
  const [nombre,  setNombre]  = useState('');
  const [telefono,setTelefono]= useState('');
  const [address, setAddress] = useState('');
  const [notas,   setNotas]   = useState('');
  const [loading, setLoading] = useState(false);
  const [done,    setDone]    = useState(false);
  const [error,   setError]   = useState('');
  const [orderCode, setOrderCode] = useState('');
  const [telefonoEnviado, setTelefonoEnviado] = useState('');

  // Espera a que el carrito se lea del navegador antes de decidir que está vacío
  // (si no, al recargar el checkout siempre mandaba al inicio)
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    const p = useCart.persist;
    if (p.hasHydrated()) setHydrated(true);
    return p.onFinishHydration(() => setHydrated(true));
  }, []);

  useEffect(() => {
    if (hydrated && items.length === 0 && !done) router.push('/');
  }, [hydrated, items.length, done, router]);

  // Embudo: llegó al checkout con productos (una vez por visita a la página)
  const empezo = useRef(false);
  useEffect(() => {
    if (!hydrated || empezo.current || items.length === 0) return;
    empezo.current = true;
    medirItems('begin_checkout', items);
  }, [hydrated, items]);

  const deliveryCost = DELIVERY_COSTS[zona] ?? 0;
  const total = subtotal() + deliveryCost;
  const isDelivery = zona !== 'retiro';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre || !telefono) return;
    if (isDelivery && !address) return;
    if (items.length === 0) return;
    setError('');
    if (!telefonoValido(telefono)) {
      setError('Poné tu WhatsApp con código de área (ej: 342 503-9876), así te confirmamos el pedido.');
      return;
    }

    setLoading(true);
    try {
      const order = await createOrder({
        deliveryMethod: isDelivery ? 'DELIVERY' : 'PICKUP',
        paymentMethod:  pago === 'efectivo' ? 'CASH' : 'TRANSFER',
        customerName:   nombre,
        customerPhone:  telefono,
        address:        isDelivery ? address : undefined,
        zone:           zona,
        deliveryCost,
        notes:          notas || undefined,
        items: items.map((i) => ({
          productId:   i.productId,
          productName: i.name,
          priceLabel:  i.priceLabel,
          unitPrice:   i.price,
          quantity:    i.quantity,
        })),
      });

      // El pedido llega al panel del local; desde ahí le escriben al cliente por WhatsApp
      setOrderCode(order.code);
      setTelefonoEnviado(telefono);
      guardarUltimoPedido(items); // para "¿Lo mismo que la otra vez?" en el menú
      // Venta: el pedido se registró y se abrió WhatsApp con el detalle (sin datos personales)
      medirItems('purchase', items, {
        transaction_id: order.code, value: total, shipping: deliveryCost,
        entrega: isDelivery ? 'envio' : 'retiro', pago, zona,
      });
      clearCart();
      setDone(true);
    } catch (err) {
      console.error(err);
      setError('No pudimos enviar el pedido. Probá de nuevo o escribinos por WhatsApp.');
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className="cuadrille flex min-h-screen items-center justify-center p-4">
        <motion.div initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.6, ease: [0.34, 1.75, 0.68, 1] }}
          className="vidrio w-full max-w-sm rounded-[var(--r-xl)] p-8 text-center">
          <p className="titulo sticker text-6xl">¡Listo!</p>
          <p className="mt-4 text-sm text-apagado">Pedido N° <b className="text-crema">{orderCode}</b></p>
          <p className="mt-2 text-apagado">
            Ya nos llegó tu pedido. En unos minutos te escribimos al <b className="text-crema">{telefonoEnviado}</b> por WhatsApp para confirmarlo.
          </p>
          <button className="btn-fredys mt-8 w-full" onClick={() => router.push('/')}>Volver al menú</button>
          {/* El mejor momento para ofrecer la app: acaba de pedir */}
          <BotonInstalar className="mt-4" />
        </motion.div>
      </div>
    );
  }

  if (items.length === 0 && !done) return null;

  return (
    <>
      <Navbar />
      <div className="min-h-screen px-[var(--gutter)] pb-16 pt-[calc(var(--nav-h,92px)+24px)]">
        <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-[1fr_340px]">

          <form id="checkoutForm" onSubmit={handleSubmit} className="space-y-7">
            <h1 className="titulo text-[clamp(2.6rem,10vw,4.2rem)]">Datos de entrega</h1>

            <Field label="Nombre" htmlFor="nombre">
              <input id="nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} required autoComplete="name"
                placeholder="¿A nombre de quién?" className="campo" />
            </Field>

            <Field label="WhatsApp" htmlFor="tel">
              <input id="tel" value={telefono} onChange={(e) => setTelefono(e.target.value)} required type="tel" autoComplete="tel"
                placeholder="Ej: 342 503-9876" className="campo" />
              <p className="text-xs text-apagado">Con código de área. Te escribimos ahí para confirmar el pedido.</p>
            </Field>

            <fieldset className="space-y-2">
              <legend className="mb-2 text-sm font-semibold">Retiro o envío</legend>
              {ZONAS.map((z) => (
                <label key={z.value} className="ficha">
                  <input type="radio" name="zona" value={z.value} checked={zona === z.value} onChange={() => setZona(z.value)} className="sr-only" />
                  <span className="font-semibold">{z.label}</span>
                  <span className={`text-sm font-extrabold ${z.price === 0 ? 'text-cheddar' : 'text-brand'}`}>
                    {z.price === 0 ? 'Gratis' : `+${formatPrice(z.price)}`}
                  </span>
                </label>
              ))}
              {!isDelivery && <p className="pt-1 text-sm text-apagado">Te pasamos la dirección para retirar por WhatsApp.</p>}
            </fieldset>

            {isDelivery && (
              <Field label="Dirección" htmlFor="dir">
                <input id="dir" value={address} onChange={(e) => setAddress(e.target.value)} required autoComplete="street-address"
                  placeholder="Calle, número y entre calles" className="campo" />
              </Field>
            )}

            <fieldset>
              <legend className="mb-2 text-sm font-semibold">Medio de pago</legend>
              <div className="grid grid-cols-2 gap-2">
                {PAGOS.map((p) => (
                  <label key={p.value} className="ficha !justify-center">
                    <input type="radio" name="pago" value={p.value} checked={pago === p.value} onChange={() => setPago(p.value)} className="sr-only" />
                    <span className="font-semibold">{p.label}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            <Field label="Aclaraciones" htmlFor="notas" optional>
              <textarea id="notas" value={notas} onChange={(e) => setNotas(e.target.value)} rows={3}
                placeholder="Sin cebolla, extra salsa, timbre que no anda..." className="campo resize-none" />
            </Field>

            {error && <p className="rounded-[var(--r-md)] border border-red-400/40 bg-red-500/10 p-4 text-sm" role="alert">{error}</p>}

            <button type="submit" className="btn-fredys w-full lg:hidden" disabled={loading}>
              {loading ? 'Enviando...' : <>Hacer pedido <IconoFlecha /></>}
            </button>
          </form>

          {/* Resumen */}
          <aside className="h-fit lg:sticky lg:top-24">
            <div className="vidrio space-y-4 rounded-[var(--r-lg)] p-5">
              <h2 className="titulo text-2xl">Tu pedido</h2>
              <ul className="space-y-3">
                {items.map((item) => (
                  <li key={`${item.productId}-${item.priceLabel}`} className="flex items-center justify-between gap-2 text-sm">
                    <div>
                      <p className="font-semibold">{item.name}</p>
                      <p className="text-xs capitalize text-apagado">{item.priceLabel} · x{item.quantity}</p>
                    </div>
                    <span className="flex-shrink-0 font-extrabold text-brand">{formatPrice(item.price * item.quantity)}</span>
                  </li>
                ))}
              </ul>
              <div className="space-y-2 border-t border-[var(--line)] pt-4 text-sm">
                <div className="flex justify-between text-apagado"><span>Subtotal</span><span>{formatPrice(subtotal())}</span></div>
                <div className="flex justify-between text-apagado"><span>Envío</span><span>{deliveryCost > 0 ? formatPrice(deliveryCost) : 'Gratis'}</span></div>
                <div className="flex justify-between border-t border-[var(--line)] pt-2 text-lg font-extrabold">
                  <span>Total</span><span className="text-brand">{formatPrice(total)}</span>
                </div>
              </div>
              <button type="submit" form="checkoutForm" className="btn-fredys hidden w-full lg:flex" disabled={loading}>
                {loading ? 'Enviando...' : 'Hacer pedido'}
              </button>
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}

function Field({ label, htmlFor, children, optional }: { label: string; htmlFor: string; children: React.ReactNode; optional?: boolean }) {
  return (
    <div className="space-y-2">
      <label htmlFor={htmlFor} className="flex items-center gap-1 text-sm font-semibold">
        {label}
        {optional && <span className="font-normal text-apagado">(opcional)</span>}
      </label>
      {children}
    </div>
  );
}
