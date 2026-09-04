'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

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
    const timer = setTimeout(() => setMessage(null), 3000);
    return () => clearTimeout(timer);
  }, [username]);

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
      setEditError('Username must be at least 3 characters');
      return;
    }
    if (editUsername.length > 15) {
      setEditError('Username must be at most 15 characters');
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
      setEditError('Failed to update username');
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
      setMessage({ text: 'Failed to delete account', type: 'error' });
    }
    setShowDeleteConfirm(false);
  };

  const startGame = () => {
    router.push('/game');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#0F1423] to-[#1E2D50]">
        <div className="animate-pulse-slow text-cyan-400 text-2xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0F1423] to-[#1E2D50] relative overflow-hidden">
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
          title="Confirm Delete"
          message="Are you sure you want to delete your account? This cannot be undone."
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
  const [stars, setStars] = useState<Array<{ x: number; y: number; size: number; brightness: number; speed: number }>>([]);

  useEffect(() => {
    const initialStars = Array.from({ length: 100 }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      size: Math.random() * 2 + 0.5,
      brightness: Math.random() * 100 + 100,
      speed: Math.random() * 0.3 + 0.1
    }));
    setStars(initialStars);

    const animate = () => {
      setStars(prev => prev.map(star => {
        let newY = star.y + star.speed;
        if (newY > window.innerHeight) {
          newY = 0;
          return { ...star, y: newY, x: Math.random() * window.innerWidth };
        }
        return { ...star, y: newY };
      }));
      requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      {stars.map((star, i) => (
        <div
          key={i}
          className="fixed rounded-full"
          style={{
            left: star.x,
            top: star.y,
            width: star.size,
            height: star.size,
            backgroundColor: `rgb(${star.brightness}, ${star.brightness}, ${star.brightness})`,
            opacity: 0.8
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
  const [menuAnim, setMenuAnim] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setMenuAnim(prev => (prev + 1) % 10000), 16);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-20 relative z-10">
      <div className="text-center mb-12 animate-fade-in">
        <h1 className="text-5xl font-bold text-white mb-4" style={{ 
          textShadow: `0 0 ${20 + Math.sin(menuAnim / 30) * 10}px rgba(80, 200, 230, 0.8)` 
        }}>
          BRICK BREAKER
        </h1>
        <p className="text-cyan-300 text-xl">Welcome, {username}!</p>
      </div>

      <div className="w-full max-w-md space-y-4 mb-12 animate-fade-in">
        <button
          onClick={onPlay}
          className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-4 px-6 rounded-xl text-lg transition-all shadow-lg hover:shadow-green-500/30"
        >
          Play Game
        </button>
        <button
          onClick={onLeaderboard}
          className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-4 px-6 rounded-xl text-lg transition-all shadow-lg hover:shadow-blue-500/30"
        >
          Leaderboard
        </button>
        <button
          onClick={onProfile}
          className="w-full bg-purple-500 hover:bg-purple-600 text-white font-semibold py-4 px-6 rounded-xl text-lg transition-all shadow-lg hover:shadow-purple-500/30"
        >
          My Profile
        </button>
        <button
          onClick={onLogout}
          className="w-full bg-red-500 hover:bg-red-600 text-white font-semibold py-4 px-6 rounded-xl text-lg transition-all shadow-lg hover:shadow-red-500/30"
        >
          Logout
        </button>
      </div>

      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in">
        {userStats && (
          <StatCard title="Your Stats" icon="📊" items={[
            `Highest Score: ${userStats.highest_score}`,
            `Average Score: ${userStats.average_score}`,
            `Games Played: ${userStats.games_played}`
          ]} />
        )}
        {globalStats && (
          <StatCard title="Global Stats" icon="🌍" items={[
            `Top Score: ${globalStats.highest_score}`,
            `By: ${globalStats.highest_player}`,
            `Total Games: ${globalStats.total_games}`
          ]} />
        )}
      </div>
    </div>
  );
}

function StatCard({ title, icon, items }: { title: string; icon: string; items: string[] }) {
  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-2xl">{icon}</span>
        <h3 className="text-xl font-semibold text-cyan-300">{title}</h3>
      </div>
      <div className="space-y-3">
        {items.map((item, i) => (
          <div key={i} className="flex justify-between text-gray-200">
            <span>{item.split(': ')[0]}</span>
            <span className="font-mono font-bold text-white">{item.split(': ')[1]}</span>
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
    <div className="min-h-screen flex flex-col items-center px-4 py-20 relative z-10">
      <div className="w-full max-w-3xl animate-fade-in">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold text-white" style={{ textShadow: '0 0 20px rgba(80, 200, 230, 0.8)' }}>
            LEADERBOARD
          </h1>
          <button
            onClick={onBack}
            className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-xl transition-colors"
          >
            Back
          </button>
        </div>

        <div className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 overflow-hidden">
          <div className="grid grid-cols-[80px_1fr_100px] px-6 py-4 bg-white/5 border-b border-white/10">
            <span className="text-cyan-300 font-bold">Rank</span>
            <span className="text-cyan-300 font-bold">Player</span>
            <span className="text-cyan-300 font-bold text-right">Score</span>
          </div>
          
          {loading ? (
            <div className="px-6 py-12 text-center text-gray-400">Loading...</div>
          ) : scores.length === 0 ? (
            <div className="px-6 py-12 text-center text-gray-400">No scores yet!</div>
          ) : (
            <div className="divide-y divide-white/10">
              {scores.map((entry, i) => (
                <div key={i} className="grid grid-cols-[80px_1fr_100px] px-6 py-4 items-center transition-colors hover:bg-white/5" style={{ backgroundColor: i % 2 === 0 ? 'rgba(48, 80, 160, 0.1)' : 'transparent' }}>
                  <span className="font-bold text-lg" style={{ color: i === 0 ? '#FFD700' : i === 1 ? '#C0C0C0' : i === 2 ? '#CD7F32' : 'white' }}>
                    {i + 1}
                  </span>
                  <span className="text-white truncate pr-4">{entry.username}</span>
                  <span className="font-mono font-bold text-right text-white">{entry.score}</span>
                </div>
              ))}
            </div>
          )}
        </div>
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
    <div className="min-h-screen flex flex-col items-center px-4 py-20 relative z-10">
      <div className="w-full max-w-3xl animate-fade-in">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold text-white" style={{ textShadow: '0 0 20px rgba(80, 200, 230, 0.8)' }}>
            Player Profile
          </h1>
          <button
            onClick={onBack}
            className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-xl transition-colors"
          >
            Back
          </button>
        </div>

        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20 space-y-8">
          <div className="flex items-center justify-between">
            <h2 className="text-3xl font-bold text-cyan-300">{username}</h2>
            <div className="flex gap-2">
              <button
                onClick={onEditUsername}
                className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg text-sm transition-colors"
              >
                Edit Username
              </button>
              <button
                onClick={onDeleteAccount}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm transition-colors"
              >
                Delete Account
              </button>
            </div>
          </div>

          {userStats && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <StatBox label="Highest Score" value={userStats.highest_score} color="text-yellow-400" />
              <StatBox label="Average Score" value={userStats.average_score} color="text-blue-400" />
              <StatBox label="Total Games" value={userStats.games_played} color="text-green-400" />
              <StatBox label="Recent Games" value={userStats.recent_scores.length} color="text-purple-400" />
            </div>
          )}

          {userStats?.recent_scores.length && userStats.recent_scores.length > 1 && (
            <div className="bg-white/5 rounded-xl p-6 border border-white/10">
              <h3 className="text-lg font-semibold text-cyan-300 mb-4">Score Trend (Last 5 Games)</h3>
              <ScoreChart scores={userStats.recent_scores} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatBox({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="bg-white/5 rounded-xl p-6 border border-white/10 text-center">
      <p className="text-gray-400 text-sm mb-1">{label}</p>
      <p className={`text-3xl font-bold font-mono ${color}`}>{value}</p>
    </div>
  );
}

function ScoreChart({ scores }: { scores: number[] }) {
  const maxScore = Math.max(...scores, 1);
  const chartWidth = 100;
  const chartHeight = 100;

  return (
    <div className="relative h-40 bg-white/5 rounded-lg border border-white/10 overflow-hidden">
      <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-full">
        <polyline
          fill="none"
          stroke="#5AA0BE"
          strokeWidth="2"
          points={scores.map((score, i) => {
            const x = (i / (scores.length - 1)) * chartWidth;
            const y = chartHeight - (score / maxScore) * chartHeight * 0.8;
            return `${x},${y}`;
          }).join(' ')}
        />
        {scores.map((score, i) => (
          <circle
            key={i}
            cx={(i / (scores.length - 1)) * chartWidth}
            cy={chartHeight - (score / maxScore) * chartHeight * 0.8}
            r="4"
            fill="#FFFFFF"
          />
        ))}
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
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 animate-fade-in">
      <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20 w-full max-w-md">
        <h2 className="text-2xl font-bold text-white mb-6 text-center">Edit Username</h2>
        <input
          type="text"
          value={username}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') onSave(); if (e.key === 'Escape') onCancel(); }}
          className="w-full px-4 py-3 rounded-lg text-black placeholder-gray-500 border-2 border-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none mb-4"
          maxLength={15}
          autoFocus
        />
        {error && <p className="text-red-400 text-sm mb-4 text-center">{error}</p>}
        <div className="flex gap-4">
          <button
            onClick={onSave}
            className="flex-1 bg-green-500 hover:bg-green-600 text-white py-3 rounded-lg font-semibold transition-colors"
          >
            Save
          </button>
          <button
            onClick={onCancel}
            className="flex-1 bg-red-500 hover:bg-red-600 text-white py-3 rounded-lg font-semibold transition-colors"
          >
            Cancel
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
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 animate-fade-in">
      <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20 w-full max-w-md">
        <h2 className="text-2xl font-bold text-white mb-4 text-center">{title}</h2>
        <p className="text-gray-300 mb-6 text-center">{message}</p>
        <div className="flex gap-4">
          <button
            onClick={onConfirm}
            className="flex-1 bg-red-500 hover:bg-red-600 text-white py-3 rounded-lg font-semibold transition-colors"
          >
            Yes, Delete
          </button>
          <button
            onClick={onCancel}
            className="flex-1 bg-green-500 hover:bg-green-600 text-white py-3 rounded-lg font-semibold transition-colors"
          >
            No, Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

function MessageToast({ message, type }: { message: string; type: 'success' | 'error' }) {
  useEffect(() => {
    const timer = setTimeout(() => {}, 3000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 animate-fade-in">
      <div className={`px-6 py-3 rounded-xl text-white font-medium shadow-2xl ${type === 'success' ? 'bg-green-500' : 'bg-red-500'}`}>
        {message}
      </div>
    </div>
  );
}