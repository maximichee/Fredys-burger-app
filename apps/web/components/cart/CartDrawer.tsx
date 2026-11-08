'use client';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useCart } from '@/lib/cart-store';
import { formatPrice, imgSrc } from '@/lib/utils';
import { IconoFlecha } from '@/components/fredys/Piezas';

export function CartDrawer() {
  const { isOpen, closeCart, items, removeItem, updateQuantity, subtotal, clearCart } = useCart();
  const router = useRouter();

  const handleCheckout = () => {
    closeCart();
    router.push('/checkout');
  };

  const verMenu = () => {
    closeCart();
    router.push('/#menu');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm" onClick={closeCart} />
          <motion.aside
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            transition={{ duration: 0.55, ease: [0.76, 0, 0.24, 1] }}
            className="cuadrille fixed bottom-0 right-0 top-0 z-50 flex w-full max-w-sm flex-col bg-dark-100 shadow-2xl"
            aria-label="Tu pedido" role="dialog" aria-modal="true"
          >
            <div className="flex items-center justify-between border-b border-[var(--line)] p-5">
              <h2 className="titulo text-3xl">Tu pedido</h2>
              <button onClick={closeCart} className="grid h-11 w-11 place-items-center rounded-full text-xl text-apagado transition-colors hover:text-crema" aria-label="Cerrar">✕</button>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto p-4" data-lenis-prevent>
              {items.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
                  <p className="titulo text-4xl text-cuero">Todavía nada</p>
                  <p className="text-apagado">Elegí tus burgers y aparecen acá.</p>
                  <button onClick={verMenu} className="btn-fredys">Armá tu pedido <IconoFlecha /></button>
                </div>
              ) : (
                items.map((item) => (
                  <motion.div
                    key={`${item.productId}-${item.priceLabel}`}
                    layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: 40 }}
                    className="vidrio flex gap-3 rounded-[var(--r-md)] p-3"
                  >
                    {item.image && (
                      <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-[var(--r-sm)]">
                        <Image src={imgSrc(item.image, 'sm')} alt={item.name} fill sizes="64px" className="object-cover" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold">{item.name}</p>
                      <p className="text-xs capitalize text-apagado">{item.priceLabel}</p>
                      <div className="mt-2 flex items-center gap-1">
                        <button onClick={() => updateQuantity(item.productId, item.priceLabel, item.quantity - 1)}
                          className="grid h-9 w-9 place-items-center rounded-full bg-dark-300 text-lg transition-colors hover:bg-brand/25" aria-label={`Quitar uno de ${item.name}`}>−</button>
                        <span className="w-6 text-center font-bold">{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.productId, item.priceLabel, item.quantity + 1)}
                          className="grid h-9 w-9 place-items-center rounded-full bg-dark-300 text-lg transition-colors hover:bg-brand/25" aria-label={`Sumar uno de ${item.name}`}>+</button>
                      </div>
                    </div>
                    <div className="flex flex-col items-end justify-between">
                      <button onClick={() => removeItem(item.productId, item.priceLabel)}
                        className="grid h-8 w-8 place-items-center text-sm text-apagado/60 transition-colors hover:text-red-400" aria-label={`Sacar ${item.name}`}>✕</button>
                      <span className="text-sm font-extrabold text-brand">{formatPrice(item.price * item.quantity)}</span>
                    </div>
                  </motion.div>
                ))
              )}
            </div>

            {items.length > 0 && (
              <div className="space-y-4 border-t border-[var(--line)] p-5">
                <div className="flex items-center justify-between">
                  <span className="text-apagado">Subtotal</span>
                  <span className="text-xl font-extrabold">{formatPrice(subtotal())}</span>
                </div>
                <button onClick={handleCheckout} className="btn-fredys w-full">Confirmar pedido <IconoFlecha /></button>
                <button onClick={clearCart} className="w-full py-2 text-center text-sm text-apagado/70 transition-colors hover:text-crema">
                  Vaciar pedido
                </button>
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
