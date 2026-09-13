'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  createInitialState,
  updateGameState,
  GameState,
  WIDTH,
  HEIGHT,
  COLORS,
  BRICK_COLORS,
  PADDLE_WIDTH,
  PADDLE_HEIGHT,
  BALL_RADIUS,
  SKILL_DURATION
} from '@/lib/game';

export default function GamePage() {
  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [keys, setKeys] = useState<Set<string>>(new Set());
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);
  const [returnToMenu, setReturnToMenu] = useState(false);
  const [scoreSubmitted, setScoreSubmitted] = useState(false);
  const animationFrameRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  
  // Refs for input state and gameState to avoid recreating gameLoop
  const keysRef = useRef<Set<string>>(new Set());
  const mousePosRef = useRef<{ x: number; y: number } | null>(null);
  const mouseDownRef = useRef(false);
  const gameStateRef = useRef<GameState | null>(null);

  // Keep gameStateRef in sync
  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

// Initialize game and start loop
  useEffect(() => {
    const initialState = createInitialState();
    setGameState(initialState);
    setScoreSubmitted(false);
    gameStateRef.current = initialState;
    lastTimeRef.current = performance.now();
    animationFrameRef.current = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(animationFrameRef.current);
  }, []);

  // Handle keyboard input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowLeft', 'ArrowRight', ' ', 'p', 'P'].includes(e.key)) {
        e.preventDefault();
      }
      setKeys(prev => {
        const next = new Set(prev);
        next.add(e.key);
        keysRef.current = next;
        return next;
      });
      
      if (e.key === ' ' || e.key === 'p' || e.key === 'P') {
        setGameState(prev => prev ? { ...prev, paused: !prev.paused } : prev);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      setKeys(prev => {
        const next = new Set(prev);
        next.delete(e.key);
        keysRef.current = next;
        return next;
      });
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Handle mouse input
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      // Scale mouse coordinates from display size to internal 800x600
      const scaleX = WIDTH / rect.width;
      const scaleY = HEIGHT / rect.height;
      const pos = { 
        x: (e.clientX - rect.left) * scaleX, 
        y: (e.clientY - rect.top) * scaleY 
      };
      setMousePos(pos);
      mousePosRef.current = pos;
    };

    const handleMouseDown = (e: MouseEvent) => {
      handleMouseMove(e);
      mouseDownRef.current = true;
    };

    canvas.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mousedown', handleMouseDown);

    return () => {
      canvas.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousedown', handleMouseDown);
    };
  }, [gameState !== null]);

  // Submit score when game over
  useEffect(() => {
    if (gameState?.gameOver && !scoreSubmitted) {
      setScoreSubmitted(true);
      fetch('/api/scores/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ score: gameState.score })
      }).catch(console.error);
    }
  }, [gameState?.gameOver, scoreSubmitted]);

  useEffect(() => {
    if (gameState?.skillSound) playSkillSound(gameState.skillSound.type);
  }, [gameState?.skillSound?.id]);

  // Game loop
  const gameLoop = useCallback((currentTime: number) => {
    const currentState = gameStateRef.current;
    if (!currentState) return;

    const deltaTime = currentTime - lastTimeRef.current;

    // Target 60 FPS
    if (deltaTime < 16) {
      animationFrameRef.current = requestAnimationFrame(gameLoop);
      return;
    }

    lastTimeRef.current = currentTime;
    const mouseDown = mouseDownRef.current;
    mouseDownRef.current = false;

    setGameState(prev => {
      if (!prev) return prev;
      return updateGameState(prev, keysRef.current, mousePosRef.current, mouseDown);
    });

    animationFrameRef.current = requestAnimationFrame(gameLoop);
  }, []);

  // Handle return to menu
  useEffect(() => {
    if (gameState?.returnToMenu) {
      cancelAnimationFrame(animationFrameRef.current);
      router.push('/dashboard');
    }
  }, [gameState?.returnToMenu, router]);

  // Draw game
  const draw = useCallback((ctx: CanvasRenderingContext2D, state: GameState, currentMousePos: { x: number; y: number } | null) => {
    // Clear canvas
    ctx.fillStyle = COLORS.DARK_BG;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    // Draw gradient background
    const gradient = ctx.createLinearGradient(0, 0, 0, HEIGHT);
    gradient.addColorStop(0, '#0F1423');
    gradient.addColorStop(0.5, '#142038');
    gradient.addColorStop(1, '#0A1020');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    // Draw animated stars
    drawStars(ctx);

    // Draw score
    drawScore(ctx, state);

    // Draw pause button
    if (!state.gameOver) {
      drawPauseButton(ctx, state, currentMousePos);
    }

    if (state.gameOver) {
      drawGameOver(ctx, state, currentMousePos);
      return;
    }

    if (state.paused) {
      drawPauseScreen(ctx, state, currentMousePos);
      return;
    }

    if (state.levelCleared) {
      drawLevelTransition(ctx, state);
      return;
    }

    // Draw paddle
    drawPaddle(ctx, state.paddle, state.specialActive);

    // Draw balls
    state.balls.forEach((ball, i) => {
      drawBall(ctx, ball, state.specialActive);
    });

    drawFallingSkills(ctx, state.fallingSkills);

    // Draw bricks
    drawBricks(ctx, state.bricks);

    // Draw particles
    drawParticles(ctx, state.particles);
    drawParticles(ctx, state.brickParticles);
    drawParticles(ctx, state.specialEffectParticles);

    // Draw power-up indicator
    if (state.specialActive) {
      drawSpecialIndicator(ctx, state.specialActive, state.specialTimer);
    }
  }, []);

  // Render canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !gameState) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size for crisp rendering
    canvas.width = WIDTH;
    canvas.height = HEIGHT;

    draw(ctx, gameState, mousePos);
  }, [gameState, draw, mousePos]);

  if (!gameState) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#0F1423] to-[#1E2D50]">
        <div className="animate-pulse-slow text-cyan-400 text-2xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-[#0F1423] to-[#1E2D50] px-4 py-8 relative overflow-hidden">
      <StarsBackgroundGame />
      
      <div className="relative z-10">
        <canvas
          ref={canvasRef}
          width={WIDTH}
          height={HEIGHT}
          className="border-2 border-cyan-500/30 rounded-lg shadow-2xl bg-[#0F1423]"
          style={{ 
            maxWidth: '100vw', 
            maxHeight: 'calc(100vh - 2rem)',
            width: 'auto',
            height: 'auto'
          }}
        />
        
        <div className="mt-4 flex gap-4 text-center text-white">
          <button
            onClick={() => router.push('/dashboard')}
            className="bg-red-500 hover:bg-red-600 px-6 py-2 rounded-lg font-semibold transition-colors"
          >
            Back to Menu
          </button>
        </div>
      </div>

      <ControlsHint />
    </div>
  );
}

function StarsBackgroundGame() {
  const [stars, setStars] = useState<Array<{ x: number; y: number; size: number; brightness: number; speed: number }>>([]);

  useEffect(() => {
    const initialStars = Array.from({ length: 100 }, () => ({
      x: Math.random() * WIDTH,
      y: Math.random() * HEIGHT,
      size: Math.random() * 2 + 0.5,
      brightness: Math.random() * 100 + 100,
      speed: Math.random() * 0.3 + 0.1
    }));
    setStars(initialStars);

    const animate = () => {
      setStars(prev => prev.map(star => {
        let newY = star.y + star.speed;
        if (newY > HEIGHT) {
          newY = 0;
          return { ...star, y: newY, x: Math.random() * WIDTH };
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
            opacity: 0.6
          }}
        />
      ))}
    </div>
  );
}

function ControlsHint() {
  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 text-gray-400 text-sm flex gap-6">
      <span>← → Move Paddle</span>
      <span>Space / P Pause</span>
      <span>Click Pause Button</span>
    </div>
  );
}

function drawStars(ctx: CanvasRenderingContext2D) {
  const time = Date.now() / 100;
  for (let i = 0; i < 50; i++) {
    const x = (i * 37 + time * 0.5) % WIDTH;
    const y = (i * 23 + time * 0.3) % HEIGHT;
    const size = Math.max(0.5, 1 + Math.sin(time + i) * 1.5);
    const brightness = 100 + Math.sin(time * 0.5 + i * 0.3) * 50;
    ctx.fillStyle = `rgb(${brightness}, ${brightness}, ${brightness})`;
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();
  }
}

function playSkillSound(type: 'drop' | 'catch' | 'miss') {
  const audio = new AudioContext();
  const oscillator = audio.createOscillator();
  const gain = audio.createGain();
  oscillator.frequency.value = type === 'catch' ? 880 : type === 'drop' ? 660 : 180;
  gain.gain.setValueAtTime(0.06, audio.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + 0.12);
  oscillator.connect(gain).connect(audio.destination);
  oscillator.start();
  oscillator.stop(audio.currentTime + 0.12);
}

function drawScore(ctx: CanvasRenderingContext2D, state: GameState) {
  ctx.fillStyle = 'rgba(48, 48, 96, 0.8)';
  roundRect(ctx, 50, 10, 140, 35, 8, true);
  ctx.strokeStyle = COLORS.WHITE;
  ctx.lineWidth = 1;
  roundRect(ctx, 50, 10, 140, 35, 8, false);
  
  ctx.fillStyle = COLORS.WHITE;
  ctx.font = 'bold 20px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(`Score: ${state.score}`, 120, 33);
  
  ctx.font = '16px monospace';
  ctx.fillText(`Level: ${state.level}`, 120, 55);
}

function drawPauseButton(ctx: CanvasRenderingContext2D, state: GameState, mousePos: { x: number; y: number } | null) {
  const btn = state.pauseButton;
  const isHovered = mousePos && 
    mousePos.x >= btn.x && mousePos.x <= btn.x + btn.width &&
    mousePos.y >= btn.y && mousePos.y <= btn.y + btn.height;
  
  ctx.fillStyle = isHovered ? COLORS.GREEN : (state.paused ? COLORS.RED : COLORS.GREEN);
  roundRect(ctx, btn.x, btn.y, btn.width, btn.height, 8, true);
  ctx.strokeStyle = COLORS.WHITE;
  ctx.lineWidth = 1;
  roundRect(ctx, btn.x, btn.y, btn.width, btn.height, 8, false);
  
  ctx.fillStyle = COLORS.WHITE;
  ctx.font = 'bold 18px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(state.paused ? 'RESUME' : 'PAUSE', btn.x + btn.width / 2, btn.y + 22);
}

function drawPaddle(ctx: CanvasRenderingContext2D, paddle: { x: number; y: number; width: number; height: number }, specialActive: string | null) {
  // Glow effect
  const glowColor = specialActive === 'explosive' ? '#FFB05A' : specialActive ? '#64C8FF' : '#78DCFF';
  for (let i = 0; i < 3; i++) {
    ctx.fillStyle = hexToRgba(glowColor, (100 - i * 30) / 255);
    roundRect(ctx, paddle.x - 5 + i, paddle.y - 5 + i, paddle.width + 10 - i * 2, paddle.height + 10 - i * 2, 8, true);
  }

  // Main paddle
  ctx.fillStyle = COLORS.PADDLE_COLOR;
  roundRect(ctx, paddle.x, paddle.y, paddle.width, paddle.height, 7, true);

  // Shine effect
  const shineHeight = paddle.height / 2;
  const shineGradient = ctx.createLinearGradient(paddle.x, paddle.y, paddle.x, paddle.y + shineHeight);
  shineGradient.addColorStop(0, 'rgba(255, 255, 255, 0.4)');
  shineGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
  ctx.fillStyle = shineGradient;
  roundRect(ctx, paddle.x, paddle.y, paddle.width, shineHeight, 7, true);
}

function drawBall(ctx: CanvasRenderingContext2D, ball: { x: number; y: number; radius: number; dx: number; dy: number }, specialActive: string | null) {
  // Glow
  const glowRadius = ball.radius * 1.5;
  for (let i = 0; i < 3; i++) {
    ctx.fillStyle = hexToRgba(COLORS.BALL_GLOW, (150 - i * 40) / 255);
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, glowRadius - i, 0, Math.PI * 2);
    ctx.fill();
  }

  // Main ball
  ctx.fillStyle = specialActive === 'explosive' ? '#FF8A3D' : COLORS.BALL_COLOR;
  ctx.beginPath();
  ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
  ctx.fill();

  // Shine
  ctx.fillStyle = COLORS.WHITE;
  ctx.beginPath();
  ctx.arc(ball.x - ball.radius / 3, ball.y - ball.radius / 3, ball.radius / 3, 0, Math.PI * 2);
  ctx.fill();
}

function drawFallingSkills(ctx: CanvasRenderingContext2D, skills: GameState['fallingSkills']) {
  skills.forEach(skill => {
    const color = skill.type === 'multi_ball' ? '#64C8FF' : '#FF9A45';
    const glow = ctx.createRadialGradient(skill.x, skill.y, 2, skill.x, skill.y, skill.radius * 2);
    glow.addColorStop(0, color);
    glow.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(skill.x, skill.y, skill.radius * 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(skill.x, skill.y, skill.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = COLORS.WHITE;
    ctx.font = 'bold 15px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(skill.type === 'multi_ball' ? '...' : '*', skill.x, skill.y + 5);
  });
}

function drawBricks(ctx: CanvasRenderingContext2D, bricks: Array<{ x: number; y: number; width: number; height: number }>) {
  bricks.forEach((brick, i) => {
    const row = Math.floor(i / 10);
    const color = BRICK_COLORS[row % BRICK_COLORS.length];
    
    // Main brick
    ctx.fillStyle = color;
    roundRect(ctx, brick.x, brick.y, brick.width, brick.height, 4, true);
    
    // Highlight
    const highlightGradient = ctx.createLinearGradient(brick.x, brick.y, brick.x, brick.y + 5);
    highlightGradient.addColorStop(0, 'rgba(255, 255, 255, 0.4)');
    highlightGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = highlightGradient;
    roundRect(ctx, brick.x, brick.y, brick.width, 5, 4, true);
    
    // Shadow
    const shadowGradient = ctx.createLinearGradient(brick.x, brick.y + brick.height - 5, brick.x, brick.y + brick.height);
    shadowGradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
    shadowGradient.addColorStop(1, 'rgba(0, 0, 0, 0.4)');
    ctx.fillStyle = shadowGradient;
    roundRect(ctx, brick.x, brick.y + brick.height - 5, brick.width, 5, 4, true);
  });
}

function drawParticles(ctx: CanvasRenderingContext2D, particles: Array<{ x: number; y: number; size: number; color: string; life: number }>) {
  particles.forEach(p => {
    const alpha = Math.min(1, p.life / 30);
    ctx.fillStyle = hexToRgba(p.color, alpha);
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
  });
}

function drawSpecialIndicator(ctx: CanvasRenderingContext2D, specialActive: string, specialTimer: number) {
  const currentTime = Date.now();
  const elapsed = currentTime - specialTimer;
  const remaining = Math.max(0, SKILL_DURATION - elapsed);
  const progress = remaining / SKILL_DURATION;

  const indicatorWidth = 150;
  const indicatorHeight = 25;
  const x = WIDTH - indicatorWidth - 10;
  const y = 50;

  // Background
  ctx.fillStyle = 'rgba(80, 80, 112, 0.8)';
  roundRect(ctx, x, y, indicatorWidth, indicatorHeight, 5, true);

  // Progress bar
  const barColor = specialActive === 'explosive' ? '#FF9A45' : '#64C8FF';

  ctx.fillStyle = barColor;
  roundRect(ctx, x, y, indicatorWidth * progress, indicatorHeight, 5, true);

  // Border
  ctx.strokeStyle = COLORS.WHITE;
  ctx.lineWidth = 1;
  roundRect(ctx, x, y, indicatorWidth, indicatorHeight, 5, false);

  // Text
  ctx.fillStyle = COLORS.WHITE;
  ctx.font = 'bold 16px monospace';
  ctx.textAlign = 'center';
  const displayName = specialActive === 'multi_ball' ? 'Multiball' : 'Explosive';
  ctx.fillText(displayName, x + indicatorWidth / 2, y + 18);
}

function drawGameOver(ctx: CanvasRenderingContext2D, state: GameState, mousePos: { x: number; y: number } | null) {
  // Overlay
  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // Card
  const cardX = WIDTH / 2 - 200;
  const cardY = HEIGHT / 2 - 200;
  const cardW = 400;
  const cardH = 400;

  ctx.fillStyle = 'rgba(48, 48, 96, 0.95)';
  roundRect(ctx, cardX, cardY, cardW, cardH, 15, true);
  ctx.strokeStyle = '#DC3C3C';
  ctx.lineWidth = 2;
  roundRect(ctx, cardX, cardY, cardW, cardH, 15, false);

  // Text
  ctx.fillStyle = COLORS.RED;
  ctx.font = 'bold 42px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('GAME OVER', WIDTH / 2, cardY + 60);

  ctx.fillStyle = COLORS.WHITE;
  ctx.font = '24px monospace';
  ctx.fillText(`Final Score: ${state.score}`, WIDTH / 2, cardY + 110);

  // Buttons
  drawButton(ctx, state.playAgainButton, 'Play Again', COLORS.GREEN, mousePos);
  drawButton(ctx, state.restartButton, 'Restart', COLORS.BLUE, mousePos);
  drawButton(ctx, state.backButton, 'Back to Menu', COLORS.RED, mousePos);
}

function drawPauseScreen(ctx: CanvasRenderingContext2D, state: GameState, mousePos: { x: number; y: number } | null) {
  // Overlay
  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // Card
  const cardX = WIDTH / 2 - 200;
  const cardY = HEIGHT / 2 - 200;
  const cardW = 400;
  const cardH = 400;

  ctx.fillStyle = 'rgba(48, 48, 96, 0.95)';
  roundRect(ctx, cardX, cardY, cardW, cardH, 15, true);
  ctx.strokeStyle = '#3C64C8';
  ctx.lineWidth = 2;
  roundRect(ctx, cardX, cardY, cardW, cardH, 15, false);

  // Text
  ctx.fillStyle = COLORS.WHITE;
  ctx.font = 'bold 42px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('GAME PAUSED', WIDTH / 2, cardY + 60);

  // Buttons
  drawButton(ctx, { ...state.playAgainButton, y: state.playAgainButton.y - 50 }, 'Continue', COLORS.GREEN, mousePos);
  drawButton(ctx, { ...state.restartButton, y: state.restartButton.y - 50 }, 'Restart', COLORS.BLUE, mousePos);
  drawButton(ctx, { ...state.backButton, y: state.backButton.y - 50 }, 'Back to Menu', COLORS.RED, mousePos);
}

function drawLevelTransition(ctx: CanvasRenderingContext2D, state: GameState) {
  const currentTime = Date.now();
  
  // Message
  if (currentTime < state.levelTransitionMessageTime) {
    const msgX = WIDTH / 2 - 200;
    const msgY = HEIGHT / 2 - 50;
    ctx.fillStyle = 'rgba(48, 48, 96, 0.8)';
    roundRect(ctx, msgX, msgY, 400, 100, 15, true);
    ctx.strokeStyle = '#3CD864';
    ctx.lineWidth = 2;
    roundRect(ctx, msgX, msgY, 400, 100, 15, false);

    ctx.fillStyle = '#3CD864';
    ctx.font = 'bold 30px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`LEVEL ${state.level - 1} COMPLETED!`, WIDTH / 2, msgY + 35);

    ctx.fillStyle = COLORS.WHITE;
    ctx.font = '22px monospace';
    ctx.fillText(`Level ${state.level} starting...`, WIDTH / 2, msgY + 75);
  }

  // Draw paddle
  drawPaddle(ctx, state.paddle, state.specialActive);

  // Draw balls (stationary)
  state.balls.forEach(ball => {
    drawBall(ctx, ball, state.specialActive);
  });

  // Draw bricks
  drawBricks(ctx, state.bricks);

  // Draw particles
  drawParticles(ctx, state.particles);
  drawParticles(ctx, state.brickParticles);
  drawParticles(ctx, state.specialEffectParticles);

  // Draw power-up indicator
  if (state.specialActive) {
    drawSpecialIndicator(ctx, state.specialActive, state.specialTimer);
  }
}

function drawButton(ctx: CanvasRenderingContext2D, btn: { x: number; y: number; width: number; height: number }, text: string, color: string, mousePos: { x: number; y: number } | null) {
  const isHovered = mousePos && 
    mousePos.x >= btn.x && mousePos.x <= btn.x + btn.width &&
    mousePos.y >= btn.y && mousePos.y <= btn.y + btn.height;

  ctx.fillStyle = isHovered ? lightenColor(color) : color;
  roundRect(ctx, btn.x, btn.y, btn.width, btn.height, 8, true);
  
  // Gradient overlay
  const gradient = ctx.createLinearGradient(btn.x, btn.y, btn.x, btn.y + btn.height);
  gradient.addColorStop(0, 'rgba(255, 255, 255, 0.1)');
  gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
  ctx.fillStyle = gradient;
  roundRect(ctx, btn.x, btn.y, btn.width, btn.height, 8, true);

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
  ctx.lineWidth = 2;
  roundRect(ctx, btn.x, btn.y, btn.width, btn.height, 8, false);

  ctx.fillStyle = COLORS.WHITE;
  ctx.font = 'bold 20px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(text, btn.x + btn.width / 2, btn.y + btn.height / 2 + 7);
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number, fill: boolean) {
  if (w < 2 * r) r = w / 2;
  if (h < 2 * r) r = h / 2;
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
  if (fill) ctx.fill();
  else ctx.stroke();
}

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function lightenColor(hex: string): string {
  const r = Math.min(255, parseInt(hex.slice(1, 3), 16) + 30);
  const g = Math.min(255, parseInt(hex.slice(3, 5), 16) + 30);
  const b = Math.min(255, parseInt(hex.slice(5, 7), 16) + 30);
  return `rgb(${r}, ${g}, ${b})`;
}
