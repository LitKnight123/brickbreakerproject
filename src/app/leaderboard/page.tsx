'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface ScoreEntry {
  username: string;
  score: number;
}

export default function LeaderboardPage() {
  const [scores, setScores] = useState<ScoreEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/scores?type=leaderboard&limit=20')
      .then(res => res.json())
      .then(data => {
        if (data.success) setScores(data.scores);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center bg-gradient-to-b from-[#0F1423] to-[#1E2D50] px-4 py-20 relative overflow-hidden">
      <StarsBackground />
      
      <div className="w-full max-w-3xl relative z-10 animate-fade-in">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold text-white" style={{ textShadow: '0 0 20px rgba(80, 200, 230, 0.8)' }}>
            LEADERBOARD
          </h1>
          <Link
            href="/dashboard"
            className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-xl transition-colors"
          >
            Back to Menu
          </Link>
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
            <div className="px-6 py-12 text-center text-gray-400">No scores yet! Be the first to play.</div>
          ) : (
            <div className="divide-y divide-white/10">
              {scores.map((entry, i) => (
                <div key={i} className="grid grid-cols-[80px_1fr_100px] px-6 py-4 items-center transition-colors hover:bg-white/5" style={{ backgroundColor: i % 2 === 0 ? 'rgba(48, 80, 160, 0.1)' : 'transparent' }}>
                  <span className="font-bold text-lg" style={{ color: getRankColor(i) }}>
                    {getRankDisplay(i)}
                  </span>
                  <span className="text-white truncate pr-4">{entry.username}</span>
                  <span className="font-mono font-bold text-right text-white">{entry.score}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <p className="mt-8 text-center text-gray-500">
          Play the game to get on the leaderboard!
        </p>
      </div>
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

function getRankColor(index: number): string {
  if (index === 0) return '#FFD700';
  if (index === 1) return '#C0C0C0';
  if (index === 2) return '#CD7F32';
  return 'white';
}

function getRankDisplay(index: number): string {
  if (index === 0) return '🥇 1';
  if (index === 1) return '🥈 2';
  if (index === 2) return '🥉 3';
  return `${index + 1}`;
}