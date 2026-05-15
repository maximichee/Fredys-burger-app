'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export const dynamic = 'force-dynamic';
import { motion } from 'framer-motion';
import { useCart } from '@/lib/cart-store';
import { createOrder } from '@/lib/api';
import { formatPrice, DELIVERY_COSTS } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Navbar } from '@/components/Navbar';

const ZONAS = [
  { value: 'retiro', label: 'Retiro en el local', icon: '🏠', price: 0, tag: 'Gratis' },
  { value: '1km',   label: 'Hasta 1 km',          icon: '🛵', price: 2000 },
  { value: '3km',   label: '1 km – 3 km',          icon: '🛵', price: 2500 },
  { value: '4km',   label: '3 km – 4 km',          icon: '🛵', price: 3500 },
  { value: '6km',   label: '5 km – 6 km',          icon: '🛵', price: 4500 },
];

const PAGOS = [
  { value: 'efectivo',      label: 'Efectivo',      icon: '💵' },
  { value: 'transferencia', label: 'Transferencia', icon: '📲' },
];

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
  const [orderCode, setOrderCode] = useState('');

  useEffect(() => {
    if (items.length === 0 && !done) router.push('/');
  }, [items.length, done, router]);

  const deliveryCost = DELIVERY_COSTS[zona] ?? 0;
  const total = subtotal() + deliveryCost;
  const isDelivery = zona !== 'retiro';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre || !telefono) return;
    if (isDelivery && !address) return;
    if (items.length === 0) return;

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

      // También manda a WhatsApp (canal principal)
      const productos = items.map((i) => `• ${i.name} (${i.priceLabel}) x${i.quantity} — ${formatPrice(i.price * i.quantity)}`).join('\n');
      const msg = encodeURIComponent(
        `🍔 *NUEVO PEDIDO - Fredys Burger*\nN° ${order.code}\n\n📦 *PRODUCTOS:*\n${productos}\n\n💰 Subtotal: ${formatPrice(subtotal())}\n💰 Envío: ${deliveryCost > 0 ? formatPrice(deliveryCost) : 'Retiro en local'}\n💵 *TOTAL: ${formatPrice(total)}*\n\n👤 ${nombre}\n📱 ${telefono}\n📍 ${isDelivery ? address : 'Retiro en local'}\n💳 ${pago}${notas ? `\n📝 ${notas}` : ''}`
      );
      window.open(`https://wa.me/${process.env.NEXT_PUBLIC_WA_NUMBER}?text=${msg}`, '_blank');

      setOrderCode(order.code);
      clearCart();
      setDone(true);
    } catch (err) {
      console.error(err);
      alert('Error al enviar el pedido. Intentá de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          className="bg-dark-100 rounded-3xl p-8 max-w-sm w-full text-center border border-white/5"
        >
          <div className="text-5xl mb-4">✅</div>
          <h2 className="text-2xl font-extrabold mb-2">¡Pedido enviado!</h2>
          <p className="text-white/50 text-sm mb-1">N° {orderCode}</p>
          <p className="text-white/50 text-sm mb-6">Te enviamos el pedido por WhatsApp. ⏳ Tiempo estimado: 30–45 min</p>
          <Button variant="primary" className="w-full" onClick={() => router.push('/')}>Volver al menú</Button>
        </motion.div>
      </div>
    );
  }

  if (items.length === 0 && !done) return null;

  return (
    <>
      <Navbar />
      <div className="min-h-screen pt-24 pb-10 px-4">
        <div className="max-w-4xl mx-auto grid lg:grid-cols-[1fr_320px] gap-6">

          {/* Formulario */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <h1 className="text-2xl font-extrabold">Datos de entrega</h1>

            <Field label="👤 Nombre completo">
              <input value={nombre} onChange={(e) => setNombre(e.target.value)} required
                placeholder="¿A quién le llevamos?" className={inputCls} />
            </Field>

            <Field label="📱 WhatsApp">
              <input value={telefono} onChange={(e) => setTelefono(e.target.value)} required type="tel"
                placeholder="Ej: 342 503-9876" className={inputCls} />
            </Field>

            <Field label="🛵 Forma de envío">
              <div className="space-y-2">
                {ZONAS.map((z) => (
                  <label key={z.value}
                    className={`flex items-center gap-3 px-4 py-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                      zona === z.value ? 'border-brand bg-brand/8 text-brand' : 'border-white/8 bg-dark-200 hover:border-white/15'
                    }`}
                  >
                    <input type="radio" name="zona" value={z.value} checked={zona === z.value}
                      onChange={() => setZona(z.value)} className="hidden" />
                    <span className="text-xl">{z.icon}</span>
                    <span className="flex-1 font-semibold text-sm">{z.label}</span>
                    <span className={`text-sm font-bold ${z.tag ? 'text-green-400' : ''}`}>
                      {z.tag ?? `+${formatPrice(z.price)}`}
                    </span>
                  </label>
                ))}
              </div>
            </Field>

            {isDelivery && (
              <Field label="📍 Dirección">
                <input value={address} onChange={(e) => setAddress(e.target.value)} required
                  placeholder="Calle, número y entre calles" className={inputCls} />
              </Field>
            )}

            <Field label="💳 Medio de pago">
              <div className="grid grid-cols-2 gap-3">
                {PAGOS.map((p) => (
                  <label key={p.value}
                    className={`flex flex-col items-center gap-2 py-4 rounded-xl border-2 cursor-pointer transition-all ${
                      pago === p.value ? 'border-brand bg-brand/8 text-brand' : 'border-white/8 bg-dark-200 hover:border-white/15'
                    }`}
                  >
                    <input type="radio" name="pago" value={p.value} checked={pago === p.value}
                      onChange={() => setPago(p.value)} className="hidden" />
                    <span className="text-2xl">{p.icon}</span>
                    <span className="text-sm font-bold">{p.label}</span>
                  </label>
                ))}
              </div>
            </Field>

            <Field label="📝 Observaciones" optional>
              <textarea value={notas} onChange={(e) => setNotas(e.target.value)} rows={3}
                placeholder="Sin cebolla, extra salsa, instrucciones de acceso..."
                className={`${inputCls} resize-none`} />
            </Field>

            <Button type="submit" variant="primary" size="lg" className="w-full lg:hidden" loading={loading}>
              Confirmar pedido
            </Button>
          </form>

          {/* Resumen sticky */}
          <div className="lg:sticky lg:top-24 h-fit">
            <div className="bg-dark-100 border border-white/7 rounded-2xl p-5 space-y-4">
              <h2 className="font-extrabold">Tu pedido</h2>
              <div className="space-y-3">
                {items.map((item) => (
                  <div key={`${item.productId}-${item.priceLabel}`}
                    className="flex justify-between items-center text-sm gap-2">
                    <div>
                      <p className="font-semibold">{item.name}</p>
                      <p className="text-white/40 text-xs capitalize">{item.priceLabel} · x{item.quantity}</p>
                    </div>
                    <span className="text-brand font-bold flex-shrink-0">{formatPrice(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>
              <div className="border-t border-white/5 pt-4 space-y-2 text-sm">
                <div className="flex justify-between text-white/50">
                  <span>Subtotal</span><span>{formatPrice(subtotal())}</span>
                </div>
                <div className="flex justify-between text-white/50">
                  <span>Envío</span><span>{deliveryCost > 0 ? formatPrice(deliveryCost) : 'Gratis'}</span>
                </div>
                <div className="flex justify-between font-extrabold text-base pt-2 border-t border-white/5">
                  <span>Total</span><span className="text-brand">{formatPrice(total)}</span>
                </div>
              </div>
              <Button type="submit" form="checkoutForm" variant="primary" size="lg" className="w-full hidden lg:flex" loading={loading}>
                Confirmar pedido
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

const inputCls = 'w-full bg-dark-200 border border-white/8 rounded-xl px-4 py-3.5 text-sm placeholder:text-white/22 focus:outline-none focus:border-brand transition-colors';

function Field({ label, children, optional }: { label: string; children: React.ReactNode; optional?: boolean }) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-bold text-white/80 flex items-center gap-1">
        {label}
        {optional && <span className="text-white/30 font-normal">(opcional)</span>}
      </label>
      {children}
    </div>
  );
}
