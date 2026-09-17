'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    if (newPassword !== confirmPassword) {
      setError('Password dan Konfirmasi Password tidak cocok!');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setMessage('Password berhasil diperbarui! Mengalihkan ke login...');
        setTimeout(() => {
          router.push('/login');
        }, 2000);
      } else {
        setError(data.message || 'Gagal memperbarui password atau token kadaluwarsa.');
      }
    } catch {
      setError('Terjadi kesalahan pada server');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="text-center">
        <p className="text-rose-400 text-sm font-semibold mb-4">
          Token reset password tidak ditemukan atau tidak valid.
        </p>
        <Link href="/forgot-password" className="text-cyan-400 hover:underline text-xs font-medium">
          Minta link reset baru
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
          New Password
        </label>
        <div className="relative">
          <input
            type={showPassword ? 'text' : 'password'}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Masukkan password baru"
            required
            minLength={6}
            className="w-full px-4 py-3 rounded-xl bg-slate-950 text-white placeholder-slate-500 border border-slate-800 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 outline-none text-sm transition-all pr-10"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors"
            tabIndex={-1}
          >
            {showPassword ? (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
            )}
          </button>
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
          Confirm New Password
        </label>
        <input
          type={showPassword ? 'text' : 'password'}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Konfirmasi password baru"
          required
          minLength={6}
          className="w-full px-4 py-3 rounded-xl bg-slate-950 text-white placeholder-slate-500 border border-slate-800 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 outline-none text-sm transition-all"
        />
      </div>

      {error && (
        <p className="text-rose-400 text-xs font-semibold text-center">{error}</p>
      )}

      {message && (
        <p className="text-emerald-400 text-xs font-semibold text-center">{message}</p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-cyan-600 hover:bg-cyan-500 active:scale-[0.98] text-white font-bold py-3.5 rounded-xl text-sm transition-all shadow-lg shadow-cyan-950/40 mt-2 disabled:opacity-50"
      >
        {loading ? 'Updating Password...' : 'Reset Password'}
      </button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex items-center justify-center relative overflow-hidden px-4">
      <StarsBackground />

      <div className="w-full max-w-md bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-2xl p-8 shadow-2xl relative z-10 animate-fadeIn">
        <div className="text-center mb-8">
          <h1 className="text-2xl md:text-3xl font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-200 to-indigo-300 mb-2 drop-shadow-[0_0_15px_rgba(6,182,212,0.3)]">
            Brick Breaker Pro
          </h1>
          <h2 className="text-cyan-400 font-bold text-lg tracking-wide">Set New Password</h2>
          <p className="text-xs text-slate-400 mt-1">
            Buat password baru untuk akun kamu
          </p>
        </div>

        <Suspense fallback={<p className="text-center text-xs text-slate-400">Loading...</p>}>
          <ResetPasswordForm />
        </Suspense>

        <div className="mt-6 text-center space-y-3">
          <p className="text-xs text-slate-400">
            Back to{' '}
            <Link href="/login" className="text-cyan-400 hover:underline font-medium">
              Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

function StarsBackground() {
  const [stars, setStars] = useState<Array<{ x: number; y: number; size: number; opacity: number; speed: number }>>([]);

  useEffect(() => {
    const initialStars = Array.from({ length: 40 }, () => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 1.5 + 1,
      opacity: Math.random() * 0.4 + 0.2,
      speed: Math.random() * 0.05 + 0.02,
    }));
    setStars(initialStars);

    let animationId: number;
    const animate = () => {
      setStars((prev) =>
        prev.map((star) => {
          let newY = star.y + star.speed;
          if (newY > 100) newY = 0;
          return { ...star, y: newY };
        })
      );
      animationId = requestAnimationFrame(animate);
    };
    animationId = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(animationId);
  }, []);

  if (stars.length === 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      {stars.map((star, i) => (
        <div
          key={i}
          className="absolute rounded-full bg-cyan-200"
          style={{
            left: `${star.x}%`,
            top: `${star.y}%`,
            width: `${star.size}px`,
            height: `${star.size}px`,
            opacity: star.opacity,
            boxShadow: '0 0 4px rgba(6, 182, 212, 0.4)',
          }}
        />
      ))}
    </div>
  );
}