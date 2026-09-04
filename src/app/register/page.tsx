'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function RegisterPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [activeField, setActiveField] = useState<'username' | 'password' | 'confirm' | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirm) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 4) {
      setError('Password must be at least 4 characters');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await res.json();

      if (data.success) {
        router.push('/login');
        router.refresh();
      } else {
        setError(data.message);
      }
    } catch {
      setError('Connection error');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (activeField === 'username') {
        setActiveField('password');
      } else if (activeField === 'password') {
        setActiveField('confirm');
      } else if (activeField === 'confirm') {
        handleSubmit(e as unknown as React.FormEvent);
      }
    } else if (e.key === 'Tab') {
      e.preventDefault();
      if (activeField === 'username') setActiveField('password');
      else if (activeField === 'password') setActiveField('confirm');
      else setActiveField('username');
    } else if (e.key === 'Escape') {
      router.push('/login');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#0F1423] to-[#1E2D50] px-4">
      <div className="w-full max-w-md">
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20 shadow-2xl animate-fade-in">
          <h1 className="text-4xl font-bold text-center text-white mb-8" style={{ textShadow: '0 0 20px rgba(80, 200, 230, 0.5)' }}>
            Brick Breaker Pro
          </h1>
          <h2 className="text-2xl font-semibold text-center text-cyan-300 mb-6">Register</h2>

          {error && (
            <div className="bg-red-500/20 border border-red-500/50 text-red-300 px-4 py-3 rounded-lg mb-6 text-center animate-fade-in">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-300 mb-2">
                Username
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onFocus={() => setActiveField('username')}
                onBlur={() => setActiveField(null)}
                onKeyDown={handleKeyDown}
                placeholder="Username"
                className={`w-full px-4 py-3 rounded-lg text-black placeholder-gray-500 transition-all ${
                  activeField === 'username' ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-gray-500'
                }`}
                autoComplete="username"
                maxLength={15}
                disabled={loading}
              />
            </div>

            <div className="relative">
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setActiveField('password')}
                  onBlur={() => setActiveField(null)}
                  onKeyDown={handleKeyDown}
                  placeholder="Password"
                  className={`w-full px-4 py-3 rounded-lg text-black placeholder-gray-500 transition-all pr-12 ${
                    activeField === 'password' ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-gray-500'
                  }`}
                  autoComplete="new-password"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <div className="relative">
              <label htmlFor="confirm" className="block text-sm font-medium text-gray-300 mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  id="confirm"
                  type={showConfirm ? 'text' : 'password'}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  onFocus={() => setActiveField('confirm')}
                  onBlur={() => setActiveField(null)}
                  onKeyDown={handleKeyDown}
                  placeholder="Confirm Password"
                  className={`w-full px-4 py-3 rounded-lg text-black placeholder-gray-500 transition-all pr-12 ${
                    activeField === 'confirm' ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-gray-500'
                  }`}
                  autoComplete="new-password"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
                  aria-label={showConfirm ? 'Hide password' : 'Show password'}
                >
                  {showConfirm ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Registering...' : 'Register'}
            </button>
          </form>

          <p className="mt-6 text-center text-gray-400">
            Already have an account?{' '}
            <Link href="/login" className="text-cyan-400 hover:text-cyan-300 font-medium transition-colors">
              Login
            </Link>
          </p>

          <Link
            href="/"
            className="mt-4 block text-center text-gray-500 hover:text-gray-300 transition-colors"
          >
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}