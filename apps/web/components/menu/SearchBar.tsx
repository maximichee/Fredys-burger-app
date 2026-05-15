'use client';
import { useState, useTransition } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';

export function SearchBar() {
  const router     = useRouter();
  const pathname   = usePathname();
  const params     = useSearchParams();
  const [query, setQuery] = useState(params.get('q') ?? '');
  const [, startTransition] = useTransition();

  const handleChange = (val: string) => {
    setQuery(val);
    startTransition(() => {
      const sp = new URLSearchParams(params.toString());
      if (val) sp.set('q', val); else sp.delete('q');
      router.replace(`${pathname}?${sp.toString()}`, { scroll: false });
    });
  };

  return (
    <div className="bg-dark-100 rounded-2xl border border-white/5 flex items-center gap-3 px-4 py-3 shadow-xl focus-within:border-brand/40 transition-colors">
      <svg className="w-4 h-4 text-white/30 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
      <input
        value={query}
        onChange={(e) => handleChange(e.target.value)}
        type="search"
        placeholder="Buscar hamburguesas, combos..."
        className="flex-1 bg-transparent outline-none text-sm text-white placeholder:text-white/25"
      />
      {query && (
        <button onClick={() => handleChange('')} className="text-white/30 hover:text-white transition-colors text-lg leading-none">
          ×
        </button>
      )}
    </div>
  );
}
