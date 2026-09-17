'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const [username, setUsername] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setMessage(data.message || 'Link reset password telah dikirim.');
        setUsername('');
      } else {
        setError(data.message || data.error || 'Gagal mereset password');
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
          <h2 className="text-cyan-400 font-bold text-lg tracking-wide">Forgot Password</h2>
          <p className="text-xs text-slate-400 mt-1">
            Masukkan username kamu untuk menerima link reset password
          </p>
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
            {loading ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>

        <div className="mt-6 text-center space-y-3">
          <p className="text-xs text-slate-400">
            Remembered your password?{' '}
            <Link href="/login" className="text-cyan-400 hover:underline font-medium">
              Back to Login
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