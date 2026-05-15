'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { adminLogin } from '@/lib/api';
import { Button } from '@/components/ui/Button';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const { accessToken } = await adminLogin(email, password);
      localStorage.setItem('admin_token', accessToken);
      router.push('/admin');
    } catch {
      setError('Email o contraseña incorrectos');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="bg-dark-100 border border-white/5 rounded-3xl p-8 w-full max-w-sm"
      >
        <div className="text-center mb-8">
          <p className="text-3xl mb-2">🍔</p>
          <h1 className="text-xl font-extrabold">Fredys Admin</h1>
          <p className="text-white/40 text-sm mt-1">Panel de administración</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
            placeholder="Email" className="w-full bg-dark-200 border border-white/8 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand transition-colors placeholder:text-white/25" />
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required
            placeholder="Contraseña" className="w-full bg-dark-200 border border-white/8 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand transition-colors placeholder:text-white/25" />
          {error && <p className="text-red-400 text-sm text-center">{error}</p>}
          <Button type="submit" variant="primary" size="lg" className="w-full" loading={loading}>
            Ingresar
          </Button>
        </form>
      </motion.div>
    </div>
  );
}
