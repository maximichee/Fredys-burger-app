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
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/upload/image`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });
      const { url } = await res.json();
      setPreview(url);
      onChange(url);
    } catch (err) {
      console.error(err);
      alert('Error al subir la imagen');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      onClick={() => inputRef.current?.click()}
      className="relative border-2 border-dashed border-white/10 rounded-2xl overflow-hidden cursor-pointer hover:border-brand/40 transition-colors aspect-video flex items-center justify-center bg-dark-200"
    >
      {preview ? (
        <img src={preview} alt="preview" className="w-full h-full object-cover absolute inset-0" />
      ) : (
        <div className="text-center text-white/30 p-4">
          <p className="text-3xl mb-2">📷</p>
          <p className="text-sm">Click para subir imagen</p>
          <p className="text-xs mt-1">JPG, PNG, WebP · máx 5MB</p>
        </div>
      )}
      {loading && (
        <div className="absolute inset-0 bg-dark/70 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin" />
        </div>
      )}
      {preview && !loading && (
        <div className="absolute bottom-2 right-2 bg-dark/80 text-xs text-white/60 px-2 py-1 rounded-lg">
          Click para cambiar
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
