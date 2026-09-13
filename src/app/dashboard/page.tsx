'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface UserStats {
  username: string;
  highest_score: number;
  average_score: number;
  games_played: number;
  recent_scores: number[];
}

interface GlobalStats {
  highest_player: string;
  highest_score: number;
  average_score: number;
  total_games: number;
}

export default function DashboardPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [globalStats, setGlobalStats] = useState<GlobalStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'main' | 'leaderboard' | 'profile'>('main');
  const [showEditUsername, setShowEditUsername] = useState(false);
  const [editUsername, setEditUsername] = useState('');
  const [editError, setEditError] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => setMessage(null), 3000);
    return () => clearTimeout(timer);
  }, [message]);

  const fetchData = async () => {
    try {
      const [userRes, statsRes, globalRes] = await Promise.all([
        fetch('/api/user'),
        fetch('/api/scores?type=playerStats'),
        fetch('/api/scores?type=globalStats')
      ]);

      const userData = await userRes.json();
      if (userData.success) {
        setUsername(userData.username);
      } else {
        router.push('/login');
        return;
      }

      const statsData = await statsRes.json();
      if (statsData.success) {
        setUserStats(statsData.stats);
      }

      const globalData = await globalRes.json();
      if (globalData.success) {
        setGlobalStats(globalData.stats);
      }
    } catch {
      console.error('Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  };

  const handleEditUsername = async () => {
    if (editUsername.length < 3) {
      setEditError('Username minimal 3 karakter');
      return;
    }
    if (editUsername.length > 15) {
      setEditError('Username maksimal 15 karakter');
      return;
    }

    setEditError('');
    try {
      const res = await fetch('/api/user', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: editUsername })
      });
      const data = await res.json();
      if (data.success) {
        setUsername(editUsername);
        if (userStats) setUserStats({ ...userStats, username: editUsername });
        setShowEditUsername(false);
        setMessage({ text: data.message, type: 'success' });
      } else {
        setEditError(data.message);
      }
    } catch {
      setEditError('Gagal memperbarui username');
    }
  };

  const handleDeleteAccount = async () => {
    try {
      const res = await fetch('/api/user', { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        router.push('/login');
        router.refresh();
      } else {
        setMessage({ text: data.message, type: 'error' });
      }
    } catch {
      setMessage({ text: 'Gagal menghapus akun', type: 'error' });
    }
    setShowDeleteConfirm(false);
  };

  const startGame = () => {
    router.push('/game');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-cyan-400 font-sans">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm font-medium animate-pulse">Memuat dashboard...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans relative overflow-x-hidden selection:bg-cyan-500 selection:text-white">
      <StarsBackground />
      
      {activeTab === 'main' && (
        <MainMenu 
          username={username}
          userStats={userStats}
          globalStats={globalStats}
          onPlay={startGame}
          onLeaderboard={() => setActiveTab('leaderboard')}
          onProfile={() => setActiveTab('profile')}
          onLogout={handleLogout}
        />
      )}

      {activeTab === 'leaderboard' && (
        <LeaderboardTab onBack={() => setActiveTab('main')} />
      )}

      {activeTab === 'profile' && (
        <ProfileTab
          username={username}
          userStats={userStats}
          onBack={() => setActiveTab('main')}
          onEditUsername={() => { setShowEditUsername(true); setEditUsername(username); setEditError(''); }}
          onDeleteAccount={() => setShowDeleteConfirm(true)}
        />
      )}

      {showEditUsername && (
        <EditUsernameModal
          username={editUsername}
          onChange={setEditUsername}
          onSave={handleEditUsername}
          onCancel={() => setShowEditUsername(false)}
          error={editError}
        />
      )}

      {showDeleteConfirm && (
        <ConfirmModal
          title="Hapus Akun"
          message="Apakah kamu yakin ingin menghapus akun? Tindakan ini tidak dapat dibatalkan."
          onConfirm={handleDeleteAccount}
          onCancel={() => setShowDeleteConfirm(false)}
        />
      )}

      {message && (
        <MessageToast message={message.text} type={message.type} />
      )}
    </div>
  );
}

function StarsBackground() {
  const [stars, setStars] = useState<Array<{ x: number; y: number; size: number; opacity: number; speed: number }>>([]);

  useEffect(() => {
    const initialStars = Array.from({ length: 25 }, () => ({
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

function MainMenu({ username, userStats, globalStats, onPlay, onLeaderboard, onProfile, onLogout }: {
  username: string;
  userStats: UserStats | null;
  globalStats: GlobalStats | null;
  onPlay: () => void;
  onLeaderboard: () => void;
  onProfile: () => void;
  onLogout: () => void;
}) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12 relative z-10 max-w-4xl mx-auto animate-fadeIn">
      <div className="text-center mb-10">
        <h1 className="text-4xl md:text-5xl font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-200 to-indigo-300 mb-2">
          BRICK BREAKER
        </h1>
        <p className="text-slate-400 text-sm">
          Welcome Back , <span className="text-cyan-300 font-medium">{username}</span>
        </p>
      </div>

      {/* Tombol Menu Utama */}
      <div className="w-full max-w-xs space-y-3 mb-12">
        <button
          onClick={onPlay}
          className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold py-3 px-4 rounded-xl text-sm transition-all duration-200 shadow-lg shadow-emerald-950/30 hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
          Mulai Permainan
        </button>
        <button
          onClick={onLeaderboard}
          className="w-full bg-slate-900/80 hover:bg-slate-800 text-slate-200 font-medium py-3 px-4 rounded-xl text-sm transition-all duration-200 border border-slate-800 hover:border-slate-700 hover:-translate-y-0.5 active:translate-y-0 shadow-sm flex items-center justify-center gap-2"
        >
          <svg className="w-4 h-4 text-cyan-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M18 20V10M12 20V4M6 20v-6"></path></svg>
          Papan Skor
        </button>
        <button
          onClick={onProfile}
          className="w-full bg-slate-900/80 hover:bg-slate-800 text-slate-200 font-medium py-3 px-4 rounded-xl text-sm transition-all duration-200 border border-slate-800 hover:border-slate-700 hover:-translate-y-0.5 active:translate-y-0 shadow-sm flex items-center justify-center gap-2"
        >
          <svg className="w-4 h-4 text-cyan-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
          Profil Saya
        </button>
        <button
          onClick={onLogout}
          className="w-full bg-transparent hover:bg-rose-950/20 text-rose-400 font-medium py-3 px-4 rounded-xl text-sm transition-all duration-200 border border-rose-950/40 hover:border-rose-900/60 flex items-center justify-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
          Keluar
        </button>
      </div>

      {/* Kartu Statistik */}
      <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4">
        {userStats && (
          <StatCard title="Statistik Kamu" items={[
            { label: 'Skor Tertinggi', value: userStats.highest_score },
            { label: 'Rata-rata Skor', value: userStats.average_score },
            { label: 'Total Permainan', value: userStats.games_played }
          ]} />
        )}
        {globalStats && (
          <StatCard title="Statistik Global" items={[
            { label: 'Skor Tertinggi', value: globalStats.highest_score },
            { label: 'Pemain Terbaik', value: globalStats.highest_player },
            { label: 'Total Permainan Global', value: globalStats.total_games }
          ]} />
        )}
      </div>
    </div>
  );
}

function StatCard({ title, items }: { title: string; items: Array<{ label: string; value: string | number }> }) {
  return (
    <div className="bg-slate-900/60 backdrop-blur-md rounded-xl p-5 border border-slate-800/80 shadow-lg shadow-black/20 transition-all hover:border-slate-700">
      <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-400 mb-4 pb-2 border-b border-slate-800">{title}</h3>
      <div className="space-y-3">
        {items.map((item, i) => (
          <div key={i} className="flex justify-between items-center text-sm">
            <span className="text-slate-400">{item.label}</span>
            <span className="font-mono font-semibold text-slate-100 bg-slate-950/40 px-2 py-0.5 rounded border border-slate-800/60">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function LeaderboardTab({ onBack }: { onBack: () => void }) {
  const [scores, setScores] = useState<Array<{ username: string; score: number }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/scores?type=leaderboard&limit=10')
      .then(res => res.json())
      .then(data => {
        if (data.success) setScores(data.scores);
        setLoading(false);
      });
  }, []);

  return (
    <div className="min-h-screen px-4 py-10 relative z-10 max-w-2xl mx-auto animate-fadeIn">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-white tracking-wide">Papan Skor</h1>
        <button
          onClick={onBack}
          className="text-xs font-medium bg-slate-900 hover:bg-slate-800 text-slate-300 px-3.5 py-2 rounded-lg border border-slate-800 transition-colors shadow-sm active:scale-95"
        >
          Kembali
        </button>
      </div>

      <div className="bg-slate-900/80 backdrop-blur-md rounded-xl border border-slate-800 overflow-hidden shadow-xl">
        <div className="grid grid-cols-[60px_1fr_100px] px-5 py-3 bg-slate-950/60 border-b border-slate-800 text-xs font-semibold text-cyan-400">
          <span>Peringkat</span>
          <span>Pemain</span>
          <span className="text-right">Skor</span>
        </div>
        
        {loading ? (
          <div className="px-5 py-10 text-center text-slate-500 text-sm">Memuat data...</div>
        ) : scores.length === 0 ? (
          <div className="px-5 py-10 text-center text-slate-500 text-sm">Belum ada skor tercatat</div>
        ) : (
          <div className="divide-y divide-slate-800/50">
            {scores.map((entry, i) => (
              <div key={i} className="grid grid-cols-[60px_1fr_100px] px-5 py-3.5 items-center text-sm transition-colors hover:bg-slate-800/30">
                <span className={`font-mono font-bold ${i === 0 ? 'text-amber-400' : i === 1 ? 'text-slate-300' : i === 2 ? 'text-amber-600' : 'text-slate-500'}`}>
                  #{i + 1}
                </span>
                <span className="text-slate-200 font-medium truncate pr-4">{entry.username}</span>
                <span className="font-mono font-semibold text-right text-cyan-300">{entry.score}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ProfileTab({ username, userStats, onBack, onEditUsername, onDeleteAccount }: {
  username: string;
  userStats: UserStats | null;
  onBack: () => void;
  onEditUsername: () => void;
  onDeleteAccount: () => void;
}) {
  return (
    <div className="min-h-screen px-4 py-10 relative z-10 max-w-2xl mx-auto animate-fadeIn">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-white tracking-wide">Profil Pemain</h1>
        <button
          onClick={onBack}
          className="text-xs font-medium bg-slate-900 hover:bg-slate-800 text-slate-300 px-3.5 py-2 rounded-lg border border-slate-800 transition-colors shadow-sm active:scale-95"
        >
          Kembali
        </button>
      </div>

      <div className="bg-slate-900/80 backdrop-blur-md rounded-xl p-6 border border-slate-800 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div>
            <span className="text-xs text-cyan-400 uppercase tracking-wider font-semibold">Username</span>
            <h2 className="text-xl font-bold text-white mt-0.5">{username}</h2>
          </div>
          <div className="flex gap-2">
            <button
              onClick={onEditUsername}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium px-3 py-2 rounded-lg border border-slate-700 transition-colors active:scale-95"
            >
              Ubah Username
            </button>
            <button
              onClick={onDeleteAccount}
              className="bg-rose-950/40 hover:bg-rose-900/50 text-rose-300 text-xs font-medium px-3 py-2 rounded-lg border border-rose-900/40 transition-colors active:scale-95"
            >
              Hapus Akun
            </button>
          </div>
        </div>

        {userStats && (
          <div className="grid grid-cols-2 gap-3">
            <StatBox label="Skor Tertinggi" value={userStats.highest_score} />
            <StatBox label="Rata-rata Skor" value={userStats.average_score} />
            <StatBox label="Permainan Selesai" value={userStats.games_played} />
            <StatBox label="Sesi Terakhir" value={userStats.recent_scores.length} />
          </div>
        )}

        {userStats?.recent_scores.length && userStats.recent_scores.length > 1 ? (
          <div className="pt-2">
            <h3 className="text-xs font-bold text-cyan-400 uppercase tracking-wider mb-3">Tren Skor (5 Game Terakhir)</h3>
            <ScoreChart scores={userStats.recent_scores} />
          </div>
        ) : null}
      </div>
    </div>
  );
}

function StatBox({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-slate-950/50 rounded-xl p-3.5 border border-slate-800/80 text-center">
      <p className="text-slate-400 text-xs mb-1">{label}</p>
      <p className="text-lg font-bold font-mono text-white">{value}</p>
    </div>
  );
}

function ScoreChart({ scores }: { scores: number[] }) {
  const maxScore = Math.max(...scores, 1);
  const chartWidth = 100;
  const chartHeight = 60;

  const points = scores.map((score, i) => {
    const x = (i / (scores.length - 1)) * chartWidth;
    const y = chartHeight - (score / maxScore) * (chartHeight - 12) - 6;
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className="h-28 bg-slate-950/60 rounded-xl border border-slate-800 p-3 relative overflow-hidden">
      <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-full">
        <defs>
          <linearGradient id="chartFade" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#06b6d4" stopOpacity="0" />
          </linearGradient>
        </defs>
        <polygon
          fill="url(#chartFade)"
          points={`0,${chartHeight} ${points} ${chartWidth},${chartHeight}`}
        />
        <polyline
          fill="none"
          stroke="#06b6d4"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={points}
        />
        {scores.map((score, i) => {
          const x = (i / (scores.length - 1)) * chartWidth;
          const y = chartHeight - (score / maxScore) * (chartHeight - 12) - 6;
          return (
            <circle
              key={i}
              cx={x}
              cy={y}
              r="2.5"
              className="fill-slate-900 stroke-cyan-400 stroke-2"
            />
          );
        })}
      </svg>
    </div>
  );
}

function EditUsernameModal({ username, onChange, onSave, onCancel, error }: {
  username: string;
  onChange: (value: string) => void;
  onSave: () => void;
  onCancel: () => void;
  error: string;
}) {
  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 w-full max-w-sm shadow-2xl">
        <h2 className="text-base font-bold text-white mb-4">Ubah Username</h2>
        
        <input
          type="text"
          value={username}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') onSave(); if (e.key === 'Escape') onCancel(); }}
          className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 text-white placeholder-slate-500 border border-slate-800 focus:border-cyan-500 focus:outline-none text-sm mb-2 transition-colors"
          maxLength={15}
          autoFocus
        />
        
        {error && <p className="text-rose-400 text-xs mb-3">{error}</p>}
        
        <div className="flex gap-2 mt-4">
          <button
            onClick={onSave}
            className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white py-2.5 rounded-lg font-medium text-xs transition-colors active:scale-95"
          >
            Simpan
          </button>
          <button
            onClick={onCancel}
            className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 py-2.5 rounded-lg font-medium text-xs transition-colors border border-slate-700 active:scale-95"
          >
            Batal
          </button>
        </div>
      </div>
    </div>
  );
}

function ConfirmModal({ title, message, onConfirm, onCancel }: {
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 w-full max-w-sm shadow-2xl">
        <h2 className="text-base font-bold text-white mb-2">{title}</h2>
        <p className="text-slate-400 text-sm mb-5 leading-relaxed">{message}</p>
        <div className="flex gap-2">
          <button
            onClick={onConfirm}
            className="flex-1 bg-rose-600 hover:bg-rose-500 text-white py-2.5 rounded-lg font-medium text-xs transition-colors active:scale-95"
          >
            Ya, Hapus
          </button>
          <button
            onClick={onCancel}
            className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 py-2.5 rounded-lg font-medium text-xs transition-colors border border-slate-700 active:scale-95"
          >
            Batal
          </button>
        </div>
      </div>
    </div>
  );
}

function MessageToast({ message, type }: { message: string; type: 'success' | 'error' }) {
  return (
    <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 animate-fadeIn">
      <div className={`px-4 py-2.5 rounded-xl text-xs font-medium shadow-xl border backdrop-blur-md ${
        type === 'success' 
          ? 'bg-slate-900/90 border-emerald-500/40 text-emerald-300' 
          : 'bg-slate-900/90 border-rose-500/40 text-rose-300'
      }`}>
        {message}
      </div>
    </div>
  );
}