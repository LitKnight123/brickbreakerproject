'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();

      if (data.success) {
        router.push('/dashboard');
        router.refresh();
      } else {
        setError(data.message || 'Login gagal');
      }
    } catch {
      setError('Terjadi kesalahan pada server');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex items-center justify-center relative overflow-hidden px-4">
      <StarsBackground />

      <div className="w-full max-w-md bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-2xl p-8 shadow-2xl relative z-10 animate-fadeIn">
        <div className="text-center mb-8">
          <h1 className="text-2xl md:text-3xl font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-200 to-indigo-300 mb-2 drop-shadow-[0_0_15px_rgba(6,182,212,0.3)]">
            Brick Breaker Pro
          </h1>
          <h2 className="text-cyan-400 font-bold text-lg tracking-wide">Login</h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Username"
              required
              className="w-full px-4 py-3 rounded-xl bg-slate-950 text-white placeholder-slate-500 border border-slate-800 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 outline-none text-sm transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                required
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

          {error && (
            <p className="text-rose-400 text-xs font-semibold text-center">{error}</p>
          )}
          <div className="flex justify-end mt-1 mb-2">
            <Link href="/forgot-password" className="text-xs text-slate-400 hover:text-cyan-400 transition-colors">
              Forgot password?
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] text-white font-bold py-3.5 rounded-xl text-sm transition-all shadow-lg shadow-emerald-950/40 mt-2 disabled:opacity-50"
          >
            {loading ? 'Memproses...' : 'Login'}
          </button>
        </form>

        <div className="mt-6 text-center space-y-3">
          <p className="text-xs text-slate-400">
            Don't have an account?{' '}
            <Link href="/register" className="text-cyan-400 hover:underline font-medium">
              Create account
            </Link>
          </p>
          <div>
            <Link href="/" className="text-xs text-slate-500 hover:text-slate-300 transition-colors inline-block">
              ← Back to Home
            </Link>
          </div>
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
      speed: Math.random() * 0.05 + 0.02
    }));
    setStars(initialStars);

    let animationId: number;
    const animate = () => {
      setStars(prev => prev.map(star => {
        let newY = star.y + star.speed;
        if (newY > 100) newY = 0;
        return { ...star, y: newY };
      }));
      animationId = requestAnimationFrame(animate);
    };
    animationId = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(animationId);
  }, []);

  // Server dan render pertama client sama-sama merender null, mencegah hydration mismatch
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
            boxShadow: '0 0 4px rgba(6, 182, 212, 0.4)'
          }}
        />
      ))}
    </div>
  );
}