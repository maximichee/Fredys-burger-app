'use client';
import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { getProduct } from '@/lib/api';
import { useCart } from '@/lib/cart-store';
import { formatPrice } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import type { Product, ProductPrice } from '@fredys/types';

export default function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const router = useRouter();
  const addItem = useCart((s) => s.addItem);

  const [product, setProduct] = useState<Product | null>(null);
  const [selected, setSelected] = useState<ProductPrice | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [activeImg, setActiveImg] = useState(0);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    getProduct(slug).then((p) => {
      setProduct(p);
      setSelected(p.prices[0]);
    }).catch(() => router.push('/'));
  }, [slug, router]);

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const handleAdd = () => {
    if (!selected) return;
    setAdding(true);
    addItem({
      productId: product.id,
      productSlug: product.slug,
      name: product.name,
      image: product.images[0] ?? '',
      priceLabel: selected.label,
      price: selected.price,
      quantity,
    });
    setTimeout(() => setAdding(false), 600);
  };

  return (
    <div className="min-h-screen pt-20 pb-36 sm:pb-20">
      <div className="max-w-5xl mx-auto px-4">
        {/* Back */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-white/40 hover:text-white text-sm font-semibold transition-colors mb-6"
        >
          ← Volver
        </button>

        <div className="grid lg:grid-cols-2 gap-10">
          {/* Galería */}
          <div className="space-y-3">
            <motion.div
              key={activeImg}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="aspect-square rounded-2xl overflow-hidden bg-dark-200 relative"
            >
              {product.images[activeImg] ? (
                <Image
                  src={`/${product.images[activeImg]}`}
                  alt={product.name}
                  fill className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  priority
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-8xl">🍔</div>
              )}
            </motion.div>
            {product.images.length > 1 && (
              <div className="flex gap-2">
                {product.images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImg(i)}
                    className={`w-16 h-16 rounded-xl overflow-hidden border-2 transition-colors ${
                      activeImg === i ? 'border-brand' : 'border-transparent'
                    }`}
                  >
                    <Image src={`/${img}`} alt="" width={64} height={64} className="object-cover w-full h-full" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-brand">{product.name}</h1>
              {product.description && (
                <p className="text-white/55 mt-2 leading-relaxed">{product.description}</p>
              )}
            </div>

            {/* Tamaños */}
            <div>
              <p className="text-sm font-bold text-white/60 mb-3">TAMAÑO</p>
              <div className="space-y-2">
                {product.prices.map((price) => (
                  <button
                    key={price.id}
                    onClick={() => setSelected(price)}
                    className={`w-full flex items-center justify-between px-4 py-3.5 rounded-xl border-2 transition-all ${
                      selected?.id === price.id
                        ? 'border-brand bg-brand/10 text-brand'
                        : 'border-white/8 bg-dark-200 text-white/70 hover:border-white/20'
                    }`}
                  >
                    <span className="font-semibold capitalize">{price.label}</span>
                    <span className="font-bold">{formatPrice(price.price)}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Cantidad */}
            <div>
              <p className="text-sm font-bold text-white/60 mb-3">CANTIDAD</p>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-10 h-10 rounded-full bg-dark-300 flex items-center justify-center text-lg font-bold hover:bg-brand/20 transition-colors"
                >−</button>
                <span className="text-xl font-bold w-8 text-center">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-10 h-10 rounded-full bg-dark-300 flex items-center justify-center text-lg font-bold hover:bg-brand/20 transition-colors"
                >+</button>
              </div>
            </div>

            {selected && (
              <div className="text-white/40 text-sm">
                Total: <span className="text-white font-bold text-lg">{formatPrice(selected.price * quantity)}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="fixed bottom-0 inset-x-0 bg-dark-100/95 backdrop-blur-md border-t border-white/5 p-4 z-40">
        <div className="max-w-lg mx-auto">
          <Button
            variant="primary" size="lg" className="w-full"
            onClick={handleAdd} loading={adding} disabled={!selected}
          >
            {adding ? 'Agregado ✓' : `Agregar al carrito — ${selected ? formatPrice(selected.price * quantity) : ''}`}
          </Button>
        </div>
      </div>
    </div>
  );
}
