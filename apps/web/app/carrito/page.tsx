'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { medirItems } from '@/lib/medir';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { useCart } from '@/lib/cart-store';
import { formatPrice, imgSrc } from '@/lib/utils';
import { Navbar } from '@/components/Navbar';
import { IconoFlecha } from '@/components/fredys/Piezas';

export default function CarritoPage() {
  const { items, removeItem, updateQuantity, clearCart, subtotal } = useCart();
  const router = useRouter();
  // Embudo: abrió la página del pedido (el panel lateral se mide en openCart)
  useEffect(() => { const t = setTimeout(() => { const its = useCart.getState().items; if (its.length) medirItems('view_cart', its, { desde: 'pagina' }); }, 600); return () => clearTimeout(t); }, []);

  return (
    <>
      <Navbar />
      <div className="mx-auto min-h-screen max-w-2xl px-[var(--gutter)] pb-16 pt-[calc(var(--nav-h,92px)+24px)]">
        <div className="mb-6 flex items-end justify-between">
          <h1 className="titulo text-[clamp(2.6rem,10vw,4rem)]">Tu pedido</h1>
          {items.length > 0 && (
            <button onClick={clearCart} className="min-h-[44px] text-sm text-apagado transition-colors hover:text-red-400">Vaciar</button>
          )}
        </div>

        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
            <p className="titulo text-4xl text-cuero">Todavía nada</p>
            <p className="text-apagado">Elegí tus burgers y aparecen acá.</p>
            <button className="btn-fredys" onClick={() => router.push('/#menu')}>Armá tu pedido <IconoFlecha /></button>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              <AnimatePresence>
                {items.map((item) => (
                  <motion.div
                    key={`${item.productId}-${item.priceLabel}`}
                    layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: 40 }}
                    className="vidrio flex gap-4 rounded-[var(--r-md)] p-4"
                  >
                    {item.image && (
                      <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-[var(--r-sm)]">
                        <Image src={imgSrc(item.image, 'sm')} alt={item.name} fill sizes="80px" className="object-cover" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold">{item.name}</p>
                      <p className="text-sm capitalize text-apagado">{item.priceLabel}</p>
                      {item.comment && <p className="mt-0.5 text-xs italic text-apagado">{item.comment}</p>}
                      <div className="mt-3 flex items-center gap-1">
                        <button onClick={() => updateQuantity(item.productId, item.priceLabel, item.quantity - 1)} aria-label={`Quitar uno de ${item.name}`}
                          className="grid h-10 w-10 place-items-center rounded-full bg-dark-300 transition-colors hover:bg-brand/25">−</button>
                        <span className="w-6 text-center font-bold">{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.productId, item.priceLabel, item.quantity + 1)} aria-label={`Sumar uno de ${item.name}`}
                          className="grid h-10 w-10 place-items-center rounded-full bg-dark-300 transition-colors hover:bg-brand/25">+</button>
                      </div>
                    </div>
                    <div className="flex flex-col items-end justify-between">
                      <button onClick={() => removeItem(item.productId, item.priceLabel)} aria-label={`Sacar ${item.name}`}
                        className="grid h-9 w-9 place-items-center text-apagado/60 transition-colors hover:text-red-400">✕</button>
                      <span className="font-extrabold text-brand">{formatPrice(item.price * item.quantity)}</span>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            <div className="vidrio mt-6 space-y-4 rounded-[var(--r-lg)] p-5">
              <div className="flex justify-between text-lg font-extrabold">
                <span>Subtotal</span>
                <span className="text-brand">{formatPrice(subtotal())}</span>
              </div>
              <button className="btn-fredys w-full" onClick={() => router.push('/checkout')}>Confirmar pedido <IconoFlecha /></button>
            </div>
          </>
        )}
      </div>
    </>
  );
}
