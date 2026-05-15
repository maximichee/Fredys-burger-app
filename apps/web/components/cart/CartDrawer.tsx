'use client';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '@/lib/cart-store';
import { formatPrice } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { useRouter } from 'next/navigation';

export function CartDrawer() {
  const { isOpen, closeCart, items, removeItem, updateQuantity, subtotal, clearCart } = useCart();
  const router = useRouter();

  const handleCheckout = () => {
    closeCart();
    router.push('/checkout');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 z-50 backdrop-blur-sm"
            onClick={closeCart}
          />
          <motion.aside
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 35 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-sm bg-dark-100 z-50 flex flex-col shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-white/5">
              <h2 className="font-bold text-lg">Tu pedido</h2>
              <button onClick={closeCart} className="p-1 text-white/50 hover:text-white transition-colors text-xl">✕</button>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center gap-4 text-white/40">
                  <span className="text-5xl">🛒</span>
                  <p className="font-semibold">Tu carrito está vacío</p>
                  <Button variant="ghost" size="sm" onClick={closeCart}>Ver el menú</Button>
                </div>
              ) : (
                items.map((item) => (
                  <motion.div
                    key={`${item.productId}-${item.priceLabel}`}
                    layout
                    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: 40 }}
                    className="flex gap-3 bg-dark-200 rounded-2xl p-3"
                  >
                    {item.image && (
                      <img src={item.image} alt={item.name} className="w-16 h-16 rounded-xl object-cover flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">{item.name}</p>
                      <p className="text-white/40 text-xs capitalize">{item.priceLabel}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <button
                          onClick={() => updateQuantity(item.productId, item.priceLabel, item.quantity - 1)}
                          className="w-6 h-6 rounded-full bg-dark-300 flex items-center justify-center text-sm hover:bg-brand/20 transition-colors"
                        >−</button>
                        <span className="text-sm font-bold w-4 text-center">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.productId, item.priceLabel, item.quantity + 1)}
                          className="w-6 h-6 rounded-full bg-dark-300 flex items-center justify-center text-sm hover:bg-brand/20 transition-colors"
                        >+</button>
                      </div>
                    </div>
                    <div className="flex flex-col items-end justify-between">
                      <button
                        onClick={() => removeItem(item.productId, item.priceLabel)}
                        className="text-white/25 hover:text-red-400 transition-colors text-sm"
                      >✕</button>
                      <span className="text-brand font-bold text-sm">{formatPrice(item.price * item.quantity)}</span>
                    </div>
                  </motion.div>
                ))
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="p-5 border-t border-white/5 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-white/60 text-sm">Subtotal</span>
                  <span className="font-bold text-lg">{formatPrice(subtotal())}</span>
                </div>
                <Button variant="primary" size="lg" className="w-full" onClick={handleCheckout}>
                  Confirmar pedido →
                </Button>
                <button onClick={clearCart} className="w-full text-center text-xs text-white/30 hover:text-white/60 transition-colors">
                  Vaciar carrito
                </button>
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
