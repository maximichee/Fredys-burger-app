'use client';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import type { Product } from '@fredys/types';
import { formatPrice } from '@/lib/utils';

export function ProductCard({ product }: { product: Product }) {
  const router = useRouter();
  const mainPrice = product.prices[0];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.4 }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      onClick={() => router.push(`/producto/${product.slug}`)}
      className="bg-dark-200 rounded-2xl overflow-hidden border border-white/5 hover:border-brand/20 transition-colors cursor-pointer group"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-dark-300">
        {product.images[0] ? (
          <Image
            src={`/${product.images[0]}`}
            alt={product.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            sizes="(max-width: 768px) 50vw, 33vw"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-4xl">🍔</div>
        )}
        {product.featured && (
          <span className="absolute top-2 left-2 bg-brand text-black text-xs font-bold px-2 py-0.5 rounded-full">
            Destacado
          </span>
        )}
      </div>

      <div className="p-4">
        <h3 className="font-bold text-sm leading-snug mb-1">{product.name}</h3>
        {product.description && (
          <p className="text-white/45 text-xs leading-relaxed line-clamp-2 mb-3">{product.description}</p>
        )}
        <div className="flex items-center justify-between">
          <span className="text-brand font-bold text-base">
            {mainPrice ? formatPrice(mainPrice.price) : '—'}
          </span>
          {product.prices.length > 1 && (
            <span className="text-white/30 text-xs">+{product.prices.length - 1} opciones</span>
          )}
        </div>
      </div>
    </motion.div>
  );
}
