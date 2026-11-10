'use client';
import { useRef, useState } from 'react';

interface ImageUploadProps {
  value?: string;
  onChange: (url: string) => void;
  token: string;
}

export function ImageUpload({ value, onChange, token }: ImageUploadProps) {
  const inputRef  = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState(value ?? '');

  const handleFile = async (file: File) => {
    setLoading(true);
    const form = new FormData();
    form.append('file', file);
    try {
      const res = await fetch('/api/upload/image', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });
      const { url, message } = await res.json();
      if (!res.ok || !url) throw new Error(message);
      setPreview(url);
      onChange(url);
    } catch (err) {
      console.error(err);
      alert(`No se pudo subir la imagen${(err as Error).message ? `: ${(err as Error).message}` : ''}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      onClick={() => inputRef.current?.click()}
      className="relative border-2 border-dashed border-white/10 rounded-2xl overflow-hidden cursor-pointer hover:border-brand/40 transition-colors h-full w-full flex items-center justify-center bg-dark-200"
      title="JPG, PNG o WebP · máx 5 MB"
    >
      {preview ? (
        <img src={preview} alt="preview" className="w-full h-full object-cover absolute inset-0" />
      ) : (
        <div className="text-center text-white/30 p-2">
          <p className="text-2xl">📷</p>
          <p className="text-[11px] leading-tight">Subir foto</p>
        </div>
      )}
      {loading && (
        <div className="absolute inset-0 bg-dark/70 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin" />
        </div>
      )}
      {preview && !loading && (
        <div className="absolute inset-x-0 bottom-0 bg-black/70 py-0.5 text-center text-[10px] text-white/70">
          Cambiar
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
      />
    </div>
  );
}
