'use client';
import { useEffect, useState } from 'react';
import { adminFetch } from '@/lib/api';
import type { Category } from '@fredys/types';

export default function AdminCategoriasPage() {
  const [cats, setCats] = useState<Category[]>([]);
  const token = typeof window !== 'undefined' ? localStorage.getItem('admin_token') ?? '' : '';

  const load = () => adminFetch<Category[]>('/categories', token).then(setCats).catch(console.error);
  useEffect(() => { load(); }, [token]);

  const toggle = async (cat: Category) => {
    await adminFetch(`/categories/${cat.id}`, token, {
      method: 'PATCH',
      body: JSON.stringify({ active: !cat.active }),
    });
    load();
  };

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-extrabold">Categorías</h1>
      <div className="bg-dark-100 border border-white/5 rounded-2xl overflow-hidden">
        <div className="divide-y divide-white/5">
          {cats.map((cat) => (
            <div key={cat.id} className="flex items-center justify-between px-5 py-4">
              <div>
                <p className="font-semibold">{cat.name}</p>
                <p className="text-white/35 text-xs">/{cat.slug} · orden {cat.order}</p>
              </div>
              <button onClick={() => toggle(cat)}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-colors ${
                  cat.active
                    ? 'bg-green-500/15 text-green-400 hover:bg-red-500/15 hover:text-red-400'
                    : 'bg-red-500/15 text-red-400 hover:bg-green-500/15 hover:text-green-400'
                }`}>
                {cat.active ? 'Activa' : 'Inactiva'}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
