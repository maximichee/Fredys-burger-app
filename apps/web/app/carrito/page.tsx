'use client';
import { useCart } from '@/lib/cart-store';
import { formatPrice } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Navbar } from '@/components/Navbar';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';

export default function CarritoPage() {
  const { items, removeItem, updateQuantity, clearCart, subtotal } = useCart();
  const router = useRouter();

  return (
    <>
      <Navbar />
      <div className="min-h-screen pt-24 pb-10 px-4 max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-extrabold">Tu carrito</h1>
          {items.length > 0 && (
            <button onClick={clearCart} className="text-white/35 hover:text-red-400 text-sm transition-colors">
              Vaciar
            </button>
          )}
        </div>

        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
            <span className="text-6xl">🛒</span>
            <p className="font-bold text-xl">Tu carrito está vacío</p>
            <Button variant="primary" onClick={() => router.push('/')}>Ver el menú</Button>
          </div>
        ) : (
          <>
            <AnimatePresence>
              <div className="space-y-3">
                {items.map((item) => (
                  <motion.div
                    key={`${item.productId}-${item.priceLabel}`}
                    layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: 40 }}
                    className="flex gap-4 bg-dark-100 rounded-2xl p-4 border border-white/5"
                  >
                    {item.image && (
                      <div className="relative w-20 h-20 flex-shrink-0 rounded-xl overflow-hidden">
                        <Image src={`/${item.image}`} alt={item.name} fill className="object-cover" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-bold truncate">{item.name}</p>
                      <p className="text-white/40 text-sm capitalize">{item.priceLabel}</p>
                      {item.comment && <p className="text-white/30 text-xs mt-0.5 italic">{item.comment}</p>}
                      <div className="flex items-center gap-2 mt-3">
                        <button onClick={() => updateQuantity(item.productId, item.priceLabel, item.quantity - 1)}
                          className="w-7 h-7 rounded-full bg-dark-300 flex items-center justify-center hover:bg-brand/20 transition-colors">−</button>
                        <span className="font-bold w-5 text-center">{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.productId, item.priceLabel, item.quantity + 1)}
                          className="w-7 h-7 rounded-full bg-dark-300 flex items-center justify-center hover:bg-brand/20 transition-colors">+</button>
                      </div>
                    </div>
                    <div className="flex flex-col items-end justify-between">
                      <button onClick={() => removeItem(item.productId, item.priceLabel)}
                        className="text-white/20 hover:text-red-400 transition-colors">✕</button>
                      <span className="text-brand font-bold">{formatPrice(item.price * item.quantity)}</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </AnimatePresence>

            <div className="mt-6 bg-dark-100 rounded-2xl p-5 border border-white/5 space-y-4">
              <div className="flex justify-between font-extrabold text-lg">
                <span>Subtotal</span>
                <span className="text-brand">{formatPrice(subtotal())}</span>
              </div>
              <Button variant="primary" size="lg" className="w-full" onClick={() => router.push('/checkout')}>
                Confirmar pedido →
              </Button>
            </div>
          </>
        )}
      </div>
    </>
  );
}
