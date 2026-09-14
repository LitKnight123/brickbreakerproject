'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  id: number;
  username: string;
  role: string;
  score: number;
}

interface PlaytimeStats {
  userId: number;
  username: string;
  totalSessions: number;
  totalPlaytimeSeconds: number;
  totalPlaytimeFormatted: string;
  avgSessionSeconds: number;
  avgSessionFormatted: string;
  lastSession: string | null;
  totalScore: number;
}

export default function AdminPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [playtimeStats, setPlaytimeStats] = useState<PlaytimeStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  
  // Modals
  const [showEditUser, setShowEditUser] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editField, setEditField] = useState<'username' | 'password' | 'role'>('username');
  const [editValue, setEditValue] = useState('');
  const [editError, setEditError] = useState('');
  
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);

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
      const res = await fetch('/api/admin');
      const data = await res.json();
      
      if (data.success) {
        setUsers(data.users);
        setPlaytimeStats(data.playtimeStats);
      } else {
        setError(data.message || 'Gagal memuat data');
        if (data.message === 'Admin access required') {
          router.push('/dashboard');
        }
      }
    } catch {
      setError('Gagal menghubungi server');
    } finally {
      setLoading(false);
    }
  };

  const handleEditUser = (user: User, field: 'username' | 'password' | 'role') => {
    setEditingUser(user);
    setEditField(field);
    setEditValue(field === 'role' ? user.role : '');
    setEditError('');
    setShowEditUser(true);
  };

  const handleSaveEdit = async () => {
    if (!editingUser) return;
    
    if (editField === 'username' && editValue.length < 3) {
      setEditError('Username minimal 3 karakter');
      return;
    }
    if (editField === 'password' && editValue.length < 4) {
      setEditError('Password minimal 4 karakter');
      return;
    }
    
    setEditError('');
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUserId: editingUser.id, action: editField, value: editValue })
      });
      const data = await res.json();
      
      if (data.success) {
        setShowEditUser(false);
        setMessage({ text: data.message, type: 'success' });
        fetchData();
      } else {
        setEditError(data.message);
      }
    } catch {
      setEditError('Gagal menyimpan perubahan');
    }
  };

  const handleDeleteUser = async () => {
    if (!deletingUser) return;
    
    try {
      const res = await fetch('/api/admin/users', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUserId: deletingUser.id })
      });
      const data = await res.json();
      
      if (data.success) {
        setShowDeleteConfirm(false);
        setDeletingUser(null);
        setMessage({ text: 'User berhasil dihapus', type: 'success' });
        fetchData();
      } else {
        setMessage({ text: data.message, type: 'error' });
      }
    } catch {
      setMessage({ text: 'Gagal menghapus user', type: 'error' });
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-cyan-400">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm font-medium animate-pulse">Memuat panel admin...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">
      <StarsBackground />
      
      <div className="relative z-10 max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-300 to-red-300">
              Panel Admin
            </h1>
            <p className="text-slate-400 text-sm mt-1">Kelola pengguna dan statistik permainan</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => router.push('/dashboard')}
              className="bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-medium px-4 py-2 rounded-lg border border-slate-800 transition-colors"
            >
              Dashboard
            </button>
            <button
              onClick={handleLogout}
              className="bg-rose-950/40 hover:bg-rose-900/50 text-rose-300 text-xs font-medium px-4 py-2 rounded-lg border border-rose-900/40 transition-colors"
            >
              Keluar
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-rose-950/40 border border-rose-900/40 text-rose-300 px-4 py-3 rounded-xl mb-6 text-sm">
            {error}
          </div>
        )}

        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard label="Total Users" value={users.length} />
          <StatCard label="Admin" value={users.filter(u => u.role === 'admin').length} />
          <StatCard label="Total Games" value={playtimeStats.reduce((sum, p) => sum + p.totalSessions, 0)} />
          <StatCard label="Total Playtime" value={formatTotalPlaytime(playtimeStats)} />
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <PlaytimeBarChart data={playtimeStats} />
          <SessionsBarChart data={playtimeStats} />
          <RolePieChart users={users} />
          <ScoreBarChart data={playtimeStats} />
        </div>

        {/* Users Table */}
        <div className="bg-slate-900/80 backdrop-blur-md rounded-xl border border-slate-800 overflow-hidden shadow-xl mb-8">
          <div className="px-5 py-4 bg-slate-950/60 border-b border-slate-800">
            <h2 className="text-sm font-bold text-amber-400 uppercase tracking-wider">Daftar Pengguna</h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-slate-400 uppercase tracking-wider border-b border-slate-800">
                  <th className="px-5 py-3 text-left">ID</th>
                  <th className="px-5 py-3 text-left">Username</th>
                  <th className="px-5 py-3 text-left">Role</th>
                  <th className="px-5 py-3 text-right">Skor</th>
                  <th className="px-5 py-3 text-right">Total Sesi</th>
                  <th className="px-5 py-3 text-right">Total Waktu</th>
                  <th className="px-5 py-3 text-right">Rata-rata/Sesi</th>
                  <th className="px-5 py-3 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {users.map((user) => {
                  const stats = playtimeStats.find(p => p.userId === user.id);
                  return (
                    <tr key={user.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="px-5 py-3 font-mono text-slate-400">{user.id}</td>
                      <td className="px-5 py-3 font-medium text-white">{user.username}</td>
                      <td className="px-5 py-3">
                        <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                          user.role === 'admin' 
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' 
                            : 'bg-slate-800 text-slate-300 border border-slate-700'
                        }`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right font-mono text-cyan-300">{user.score}</td>
                      <td className="px-5 py-3 text-right font-mono text-slate-300">{stats?.totalSessions || 0}</td>
                      <td className="px-5 py-3 text-right font-mono text-slate-300">{stats?.totalPlaytimeFormatted || '0s'}</td>
                      <td className="px-5 py-3 text-right font-mono text-slate-300">{stats?.avgSessionFormatted || '0s'}</td>
                      <td className="px-5 py-3">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleEditUser(user, 'username')}
                            className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs px-2 py-1 rounded border border-slate-700 transition-colors"
                            title="Ubah Username"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => handleEditUser(user, 'password')}
                            className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs px-2 py-1 rounded border border-slate-700 transition-colors"
                            title="Ubah Password"
                          >
                            🔑
                          </button>
                          <button
                            onClick={() => handleEditUser(user, 'role')}
                            className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs px-2 py-1 rounded border border-slate-700 transition-colors"
                            title="Ubah Role"
                          >
                            👤
                          </button>
                          <button
                            onClick={() => { setDeletingUser(user); setShowDeleteConfirm(true); }}
                            className="bg-rose-950/40 hover:bg-rose-900/50 text-rose-300 text-xs px-2 py-1 rounded border border-rose-900/40 transition-colors"
                            title="Hapus User"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          
          {users.length === 0 && (
            <div className="px-5 py-10 text-center text-slate-500 text-sm">Tidak ada pengguna terdaftar</div>
          )}
        </div>

        {/* Playtime Details */}
        <div className="bg-slate-900/80 backdrop-blur-md rounded-xl border border-slate-800 overflow-hidden shadow-xl">
          <div className="px-5 py-4 bg-slate-950/60 border-b border-slate-800">
            <h2 className="text-sm font-bold text-amber-400 uppercase tracking-wider">Detail Waktu Bermain</h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-slate-400 uppercase tracking-wider border-b border-slate-800">
                  <th className="px-5 py-3 text-left">Pemain</th>
                  <th className="px-5 py-3 text-right">Total Sesi</th>
                  <th className="px-5 py-3 text-right">Total Waktu</th>
                  <th className="px-5 py-3 text-right">Rata-rata/Sesi</th>
                  <th className="px-5 py-3 text-right">Total Skor</th>
                  <th className="px-5 py-3 text-right">Sesi Terakhir</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {playtimeStats.map((stat) => (
                  <tr key={stat.userId} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-5 py-3 font-medium text-white">{stat.username}</td>
                    <td className="px-5 py-3 text-right font-mono text-slate-300">{stat.totalSessions}</td>
                    <td className="px-5 py-3 text-right font-mono text-cyan-300">{stat.totalPlaytimeFormatted}</td>
                    <td className="px-5 py-3 text-right font-mono text-slate-300">{stat.avgSessionFormatted}</td>
                    <td className="px-5 py-3 text-right font-mono text-amber-300">{stat.totalScore}</td>
                    <td className="px-5 py-3 text-right text-slate-400 text-xs">
                      {stat.lastSession ? new Date(stat.lastSession).toLocaleString('id-ID') : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {playtimeStats.length === 0 && (
            <div className="px-5 py-10 text-center text-slate-500 text-sm">Belum ada data waktu bermain</div>
          )}
        </div>
      </div>

      {/* Edit User Modal */}
      {showEditUser && editingUser && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 w-full max-w-sm shadow-2xl">
            <h2 className="text-base font-bold text-white mb-4">
              {editField === 'username' && `Ubah Username: ${editingUser.username}`}
              {editField === 'password' && `Ubah Password: ${editingUser.username}`}
              {editField === 'role' && `Ubah Role: ${editingUser.username}`}
            </h2>
            
            {editField === 'role' ? (
              <div className="flex gap-2">
                <button
                  onClick={() => setEditValue('user')}
                  className={`flex-1 py-2.5 rounded-lg font-medium text-sm transition-all ${
                    editValue === 'user' 
                      ? 'bg-cyan-600 text-white' 
                      : 'bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700'
                  }`}
                >
                  User
                </button>
                <button
                  onClick={() => setEditValue('admin')}
                  className={`flex-1 py-2.5 rounded-lg font-medium text-sm transition-all ${
                    editValue === 'admin' 
                      ? 'bg-amber-600 text-white' 
                      : 'bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700'
                  }`}
                >
                  Admin
                </button>
              </div>
            ) : (
              <input
                type={editField === 'password' ? 'password' : 'text'}
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSaveEdit(); if (e.key === 'Escape') setShowEditUser(false); }}
                className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 text-white placeholder-slate-500 border border-slate-800 focus:border-cyan-500 focus:outline-none text-sm mb-2 transition-colors"
                placeholder={editField === 'username' ? 'Username baru' : 'Password baru'}
                maxLength={editField === 'username' ? 15 : undefined}
                autoFocus
              />
            )}
            
            {editError && <p className="text-rose-400 text-xs mb-3">{editError}</p>}
            
            <div className="flex gap-2 mt-4">
              <button
                onClick={handleSaveEdit}
                className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white py-2.5 rounded-lg font-medium text-xs transition-colors active:scale-95"
              >
                Simpan
              </button>
              <button
                onClick={() => setShowEditUser(false)}
                className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 py-2.5 rounded-lg font-medium text-xs border border-slate-700 transition-colors active:scale-95"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {showDeleteConfirm && deletingUser && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 w-full max-w-sm shadow-2xl">
            <h2 className="text-base font-bold text-white mb-2">Hapus Pengguna</h2>
            <p className="text-slate-400 text-sm mb-5 leading-relaxed">
              Apakah kamu yakin ingin menghapus <span className="text-white font-medium">{deletingUser.username}</span>? 
              Semua data dan skor akan dihapus secara permanen.
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleDeleteUser}
                className="flex-1 bg-rose-600 hover:bg-rose-500 text-white py-2.5 rounded-lg font-medium text-xs transition-colors active:scale-95"
              >
                Ya, Hapus
              </button>
              <button
                onClick={() => { setShowDeleteConfirm(false); setDeletingUser(null); }}
                className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 py-2.5 rounded-lg font-medium text-xs border border-slate-700 transition-colors active:scale-95"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Message Toast */}
      {message && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 animate-fadeIn">
          <div className={`px-4 py-2.5 rounded-xl text-xs font-medium shadow-xl border backdrop-blur-md ${
            message.type === 'success' 
              ? 'bg-slate-900/90 border-emerald-500/40 text-emerald-300' 
              : 'bg-slate-900/90 border-rose-500/40 text-rose-300'
          }`}>
            {message.text}
          </div>
        </div>
      )}
    </div>
  );
}

function PlaytimeBarChart({ data }: { data: PlaytimeStats[] }) {
  const sorted = [...data].sort((a, b) => b.totalPlaytimeSeconds - a.totalPlaytimeSeconds).slice(0, 8);
  const maxVal = Math.max(...sorted.map(d => d.totalPlaytimeSeconds), 1);
  const barColors = ['#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316', '#eab308', '#22c55e'];

  return (
    <div className="bg-slate-900/80 backdrop-blur-md rounded-xl border border-slate-800 overflow-hidden shadow-xl">
      <div className="px-5 py-4 bg-slate-950/60 border-b border-slate-800">
        <h2 className="text-sm font-bold text-cyan-400 uppercase tracking-wider">Total Waktu Bermain per User</h2>
      </div>
      <div className="p-5">
        {sorted.length === 0 ? (
          <div className="text-center text-slate-500 text-sm py-8">Belum ada data</div>
        ) : (
          <div className="space-y-3">
            {sorted.map((item, i) => (
              <div key={item.userId} className="flex items-center gap-3">
                <span className="text-xs text-slate-400 w-20 truncate text-right font-medium" title={item.username}>{item.username}</span>
                <div className="flex-1 h-6 bg-slate-800/60 rounded-full overflow-hidden relative">
                  <div
                    className="h-full rounded-full transition-all duration-700 ease-out"
                    style={{
                      width: `${Math.max((item.totalPlaytimeSeconds / maxVal) * 100, 2)}%`,
                      backgroundColor: barColors[i % barColors.length]
                    }}
                  />
                </div>
                <span className="text-xs font-mono text-slate-300 w-16 text-right">{item.totalPlaytimeFormatted}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function SessionsBarChart({ data }: { data: PlaytimeStats[] }) {
  const sorted = [...data].sort((a, b) => b.totalSessions - a.totalSessions).slice(0, 8);
  const maxVal = Math.max(...sorted.map(d => d.totalSessions), 1);
  const barColors = ['#22c55e', '#14b8a6', '#06b6d4', '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#d946ef'];

  return (
    <div className="bg-slate-900/80 backdrop-blur-md rounded-xl border border-slate-800 overflow-hidden shadow-xl">
      <div className="px-5 py-4 bg-slate-950/60 border-b border-slate-800">
        <h2 className="text-sm font-bold text-emerald-400 uppercase tracking-wider">Total Sesi Bermain</h2>
      </div>
      <div className="p-5">
        {sorted.length === 0 ? (
          <div className="text-center text-slate-500 text-sm py-8">Belum ada data</div>
        ) : (
          <div className="space-y-3">
            {sorted.map((item, i) => (
              <div key={item.userId} className="flex items-center gap-3">
                <span className="text-xs text-slate-400 w-20 truncate text-right font-medium" title={item.username}>{item.username}</span>
                <div className="flex-1 h-6 bg-slate-800/60 rounded-full overflow-hidden relative">
                  <div
                    className="h-full rounded-full transition-all duration-700 ease-out"
                    style={{
                      width: `${Math.max((item.totalSessions / maxVal) * 100, 2)}%`,
                      backgroundColor: barColors[i % barColors.length]
                    }}
                  />
                </div>
                <span className="text-xs font-mono text-slate-300 w-16 text-right">{item.totalSessions} sesi</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ScoreBarChart({ data }: { data: PlaytimeStats[] }) {
  const sorted = [...data].sort((a, b) => b.totalScore - a.totalScore).slice(0, 8);
  const maxVal = Math.max(...sorted.map(d => d.totalScore), 1);
  const barColors = ['#f59e0b', '#f97316', '#ef4444', '#ec4899', '#d946ef', '#a855f7', '#6366f1', '#3b82f6'];

  return (
    <div className="bg-slate-900/80 backdrop-blur-md rounded-xl border border-slate-800 overflow-hidden shadow-xl">
      <div className="px-5 py-4 bg-slate-950/60 border-b border-slate-800">
        <h2 className="text-sm font-bold text-amber-400 uppercase tracking-wider">Total Skor per User</h2>
      </div>
      <div className="p-5">
        {sorted.length === 0 ? (
          <div className="text-center text-slate-500 text-sm py-8">Belum ada data</div>
        ) : (
          <div className="space-y-3">
            {sorted.map((item, i) => (
              <div key={item.userId} className="flex items-center gap-3">
                <span className="text-xs text-slate-400 w-20 truncate text-right font-medium" title={item.username}>{item.username}</span>
                <div className="flex-1 h-6 bg-slate-800/60 rounded-full overflow-hidden relative">
                  <div
                    className="h-full rounded-full transition-all duration-700 ease-out"
                    style={{
                      width: `${Math.max((item.totalScore / maxVal) * 100, 2)}%`,
                      backgroundColor: barColors[i % barColors.length]
                    }}
                  />
                </div>
                <span className="text-xs font-mono text-slate-300 w-16 text-right">{item.totalScore}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function RolePieChart({ users }: { users: User[] }) {
  const adminCount = users.filter(u => u.role === 'admin').length;
  const userCount = users.filter(u => u.role === 'user').length;
  const total = users.length;

  if (total === 0) {
    return (
      <div className="bg-slate-900/80 backdrop-blur-md rounded-xl border border-slate-800 overflow-hidden shadow-xl">
        <div className="px-5 py-4 bg-slate-950/60 border-b border-slate-800">
          <h2 className="text-sm font-bold text-rose-400 uppercase tracking-wider">Distribusi Role</h2>
        </div>
        <div className="p-5 text-center text-slate-500 text-sm py-8">Belum ada data</div>
      </div>
    );
  }

  const adminPercent = total > 0 ? (adminCount / total) * 100 : 0;
  const userPercent = total > 0 ? (userCount / total) * 100 : 0;

  // SVG Donut
  const size = 140;
  const strokeWidth = 28;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const adminDash = (adminPercent / 100) * circumference;
  const userDash = (userPercent / 100) * circumference;

  return (
    <div className="bg-slate-900/80 backdrop-blur-md rounded-xl border border-slate-800 overflow-hidden shadow-xl">
      <div className="px-5 py-4 bg-slate-950/60 border-b border-slate-800">
        <h2 className="text-sm font-bold text-rose-400 uppercase tracking-wider">Distribusi Role</h2>
      </div>
      <div className="p-5 flex flex-col items-center">
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
          {/* Background circle */}
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#1e293b" strokeWidth={strokeWidth} />
          {/* User arc */}
          <circle
            cx={size / 2} cy={size / 2} r={radius}
            fill="none" stroke="#06b6d4" strokeWidth={strokeWidth}
            strokeDasharray={`${userDash} ${circumference - userDash}`}
            strokeDashoffset={0}
            strokeLinecap="round"
            className="transition-all duration-700"
          />
          {/* Admin arc */}
          <circle
            cx={size / 2} cy={size / 2} r={radius}
            fill="none" stroke="#f59e0b" strokeWidth={strokeWidth}
            strokeDasharray={`${adminDash} ${circumference - adminDash}`}
            strokeDashoffset={-userDash}
            strokeLinecap="round"
            className="transition-all duration-700"
          />
        </svg>
        {/* Center text */}
        <div className="absolute mt-[55px]">
          <p className="text-2xl font-bold text-white text-center">{total}</p>
          <p className="text-[10px] text-slate-400 text-center uppercase">Total</p>
        </div>
        {/* Legend */}
        <div className="flex gap-6 mt-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-cyan-500" />
            <span className="text-xs text-slate-300">User ({userCount})</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-amber-500" />
            <span className="text-xs text-slate-300">Admin ({adminCount})</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-slate-900/60 backdrop-blur-md rounded-xl p-4 border border-slate-800/80 shadow-lg">
      <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-2">{label}</p>
      <p className="text-xl font-bold font-mono text-white">{value}</p>
    </div>
  );
}

function StarsBackground() {
  const [stars, setStars] = useState<Array<{ x: number; y: number; size: number; opacity: number; speed: number }>>([]);

  useEffect(() => {
    const initialStars = Array.from({ length: 30 }, () => ({
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

  if (stars.length === 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      {stars.map((star, i) => (
        <div
          key={i}
          className="absolute rounded-full bg-amber-200"
          style={{
            left: `${star.x}%`,
            top: `${star.y}%`,
            width: `${star.size}px`,
            height: `${star.size}px`,
            opacity: star.opacity,
            boxShadow: '0 0 4px rgba(245, 158, 11, 0.4)'
          }}
        />
      ))}
    </div>
  );
}

function formatTotalPlaytime(stats: PlaytimeStats[]): string {
  const totalSeconds = stats.reduce((sum, p) => sum + p.totalPlaytimeSeconds, 0);
  if (totalSeconds < 60) return `${totalSeconds}s`;
  if (totalSeconds < 3600) return `${Math.floor(totalSeconds / 60)}m ${totalSeconds % 60}s`;
  const hours = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  return `${hours}h ${mins}m`;
}
