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
    <div className="vidrio flex min-h-[52px] items-center gap-3 rounded-full px-5 transition-colors focus-within:border-brand/60">
      <svg className="h-4 w-4 flex-shrink-0 text-apagado" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
      <input
        value={query}
        onChange={(e) => handleChange(e.target.value)}
        type="search"
        placeholder="Buscá tu burger, papas, salsas..."
        aria-label="Buscar en el menú"
        className="flex-1 bg-transparent text-base text-crema outline-none placeholder:text-apagado/60"
      />
      {query && (
        <button onClick={() => handleChange('')} className="grid h-10 w-10 place-items-center text-lg leading-none text-apagado transition-colors hover:text-crema" aria-label="Borrar búsqueda">
          ×
        </button>
      )}
    </div>
  );
}
