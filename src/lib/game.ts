// Game Constants (matching Python version exactly)
export const WIDTH = 800;
export const HEIGHT = 600;
export const FPS = 60;

export const PADDLE_WIDTH = 100;
export const PADDLE_HEIGHT = 15;
export const BALL_RADIUS = 8;
export const BRICK_WIDTH = 70;
export const BRICK_HEIGHT = 25;

// Colors (matching Python version)
export const COLORS = {
  WHITE: '#FFFFFF',
  BLACK: '#000000',
  RED: '#DC3232',
  BLUE: '#3264B4',
  GREEN: '#32B450',
  PURPLE: '#9646C8',
  CYAN: '#5AA0BE',
  ORANGE: '#E69632',
  DARK_BG: '#0F1423',
  PADDLE_COLOR: '#50C8E6',
  PADDLE_GLOW: '#78DCFF',
  BALL_COLOR: '#F0F0F0',
  BALL_GLOW: '#C8C8FF',
  GRAY: '#969696',
  LIGHT_BLUE: '#ADD8E6',
  DARK_BLUE: '#142850',
  TRANSPARENT_BLACK: 'rgba(0, 0, 0, 0.7)'
};

export const BRICK_COLORS = [
  '#DC3232', // Red
  '#DC7832', // Orange
  '#DCB432', // Yellow
  '#32B450', // Green
  '#3278B4', // Blue
];

// Particle system
export interface Particle {
  x: number;
  y: number;
  speed_x: number;
  speed_y: number;
  size: number;
  color: string;
  life: number;
}

export interface Ball {
  x: number;
  y: number;
  radius: number;
  dx: number;
  dy: number;
}

export interface Brick {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Paddle {
  x: number;
  y: number;
  width: number;
  height: number;
}

export type SpecialType = 'big_paddle' | 'score_boost' | 'multi_ball' | null;

export interface GameState {
  paddle: Paddle;
  balls: Ball[];
  bricks: Brick[];
  particles: Particle[];
  brickParticles: Particle[];
  specialEffectParticles: Particle[];
  score: number;
  level: number;
  gameOver: boolean;
  paused: boolean;
  levelCleared: boolean;
  specialActive: SpecialType;
  specialTimer: number;
  collisionCooldown: number;
  multiBallSpawned: boolean;
  returnToMenu: boolean;
  newBricks: Brick[];
  refillDelay: number;
  lastRefillTime: number;
  levelTransitionMessageTime: number;
  startingBallPos: { x: number; y: number };
  startingPaddlePos: number;
  pauseButton: { x: number; y: number; width: number; height: number };
  playAgainButton: { x: number; y: number; width: number; height: number };
  restartButton: { x: number; y: number; width: number; height: number };
  backButton: { x: number; y: number; width: number; height: number };
  buttonPressed: boolean;
}

export function createInitialState(): GameState {
  const paddle: Paddle = {
    x: WIDTH / 2 - PADDLE_WIDTH / 2,
    y: HEIGHT - 40,
    width: PADDLE_WIDTH,
    height: PADDLE_HEIGHT
  };

  const mainBall: Ball = {
    x: WIDTH / 2,
    y: HEIGHT / 2,
    radius: BALL_RADIUS,
    dx: 5,
    dy: -5
  };

  const bricks: Brick[] = [];
  for (let i = 0; i < 5; i++) {
    for (let j = 0; j < 10; j++) {
      bricks.push({
        x: j * (BRICK_WIDTH + 5) + 35,
        y: i * (BRICK_HEIGHT + 5) + 35,
        width: BRICK_WIDTH,
        height: BRICK_HEIGHT
      });
    }
  }

  return {
    paddle,
    balls: [mainBall],
    bricks,
    particles: [],
    brickParticles: [],
    specialEffectParticles: [],
    score: 0,
    level: 1,
    gameOver: false,
    paused: false,
    levelCleared: false,
    specialActive: null,
    specialTimer: 0,
    collisionCooldown: 0,
    multiBallSpawned: false,
    returnToMenu: false,
    newBricks: [],
    refillDelay: 100,
    lastRefillTime: 0,
    levelTransitionMessageTime: 0,
    startingBallPos: { x: WIDTH / 2, y: HEIGHT - 100 },
    startingPaddlePos: WIDTH / 2 - PADDLE_WIDTH / 2,
    pauseButton: { x: WIDTH - 120, y: 10, width: 110, height: 30 },
    playAgainButton: { x: WIDTH / 2 - 100, y: HEIGHT / 2 + 30, width: 200, height: 40 },
    restartButton: { x: WIDTH / 2 - 100, y: HEIGHT / 2 + 80, width: 200, height: 40 },
    backButton: { x: WIDTH / 2 - 100, y: HEIGHT / 2 + 130, width: 200, height: 40 },
    buttonPressed: false
  };
}

function randomFloat(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function applyBounceRandomness(dx: number, dy: number, randomness = 0.2): { dx: number; dy: number } {
  const speed = Math.sqrt(dx * dx + dy * dy);
  const angle = Math.atan2(dy, dx);
  const angleVariation = randomFloat(-randomness, randomness);
  const newAngle = angle + angleVariation;
  return {
    dx: Math.cos(newAngle) * speed,
    dy: Math.sin(newAngle) * speed
  };
}

function createParticle(x: number, y: number, color: string, speed = 1, size = 3, life = 30): Particle {
  const angle = randomFloat(0, Math.PI * 2);
  return {
    x,
    y,
    speed_x: Math.cos(angle) * speed,
    speed_y: Math.sin(angle) * speed,
    size,
    color,
    life
  };
}

function createBrickParticles(brick: Brick, level: number): Particle[] {
  const color = BRICK_COLORS[Math.floor((brick.y / BRICK_HEIGHT)) % BRICK_COLORS.length];
  const particles: Particle[] = [];
  for (let i = 0; i < 10; i++) {
    particles.push(createParticle(
      brick.x + brick.width / 2,
      brick.y + brick.height / 2,
      color,
      randomFloat(1, 3),
      randomFloat(2, 5),
      randomInt(20, 40)
    ));
  }
  return particles;
}

function createSpecialEffect(x: number, y: number, specialType: SpecialType): Particle[] {
  let color = '#DCDC78'; // Default yellow
  if (specialType === 'big_paddle') color = '#64DC64'; // Green
  else if (specialType === 'score_boost') color = '#DCB464'; // Orange
  else if (specialType === 'multi_ball') color = '#64B4DC'; // Blue

  const particles: Particle[] = [];
  for (let i = 0; i < 20; i++) {
    const angle = randomFloat(0, Math.PI * 2);
    const speed = randomFloat(0.5, 2);
    particles.push({
      x,
      y,
      speed_x: Math.cos(angle) * speed,
      speed_y: Math.sin(angle) * speed,
      size: randomFloat(3, 7),
      color,
      life: randomInt(30, 60)
    });
  }
  return particles;
}

function triggerSpecialEvent(): SpecialType {
  if (randomInt(1, 10) === 1) {
    const specials: SpecialType[] = ['multi_ball', 'big_paddle', 'score_boost'];
    return specials[randomInt(0, specials.length - 1)];
  }
  return null;
}

function createNewBricks(): Brick[] {
  const bricks: Brick[] = [];
  for (let i = 0; i < 5; i++) {
    for (let j = 0; j < 10; j++) {
      bricks.push({
        x: j * (BRICK_WIDTH + 5) + 35,
        y: i * (BRICK_HEIGHT + 5) + 35,
        width: BRICK_WIDTH,
        height: BRICK_HEIGHT
      });
    }
  }
  return bricks;
}

function resetGameState(state: GameState): void {
  state.score = 0;
  state.balls = [{
    x: WIDTH / 2,
    y: HEIGHT / 2,
    radius: BALL_RADIUS,
    dx: 5,
    dy: -5
  }];
  state.paddle.x = WIDTH / 2 - PADDLE_WIDTH / 2;
  state.paddle.width = PADDLE_WIDTH;
  state.bricks = createNewBricks();
  state.specialActive = null;
  state.specialTimer = 0;
  state.collisionCooldown = 0;
  state.multiBallSpawned = false;
  state.particles = [];
  state.brickParticles = [];
  state.specialEffectParticles = [];
  state.level = 1;
  state.levelCleared = false;
  state.newBricks = [];
  state.returnToMenu = false;
  state.gameOver = false;
  state.paused = false;
}

function spawnMultiBalls(state: GameState, ball: Ball, count = 2): void {
  if (state.multiBallSpawned) return;
  state.multiBallSpawned = true;

  for (let i = 0; i < count; i++) {
    const newBall: Ball = {
      x: ball.x,
      y: ball.y,
      radius: BALL_RADIUS,
      dx: 0,
      dy: 0
    };
    const angle = Math.PI / 4 + i * Math.PI / 2;
    const speed = 6;
    newBall.dx = Math.cos(angle) * speed;
    newBall.dy = -Math.sin(angle) * speed;
    state.balls.push(newBall);

    for (let j = 0; j < 10; j++) {
      state.particles.push(createParticle(
        newBall.x,
        newBall.y,
        COLORS.BALL_COLOR,
        randomFloat(1, 2.5),
        randomFloat(2, 4),
        30
      ));
    }
  }
}

export function updateGameState(state: GameState, keys: Set<string>, mousePos: { x: number; y: number } | null, mouseDown: boolean): GameState {
  const currentTime = Date.now();

  // Handle pause button click
  if (mouseDown && mousePos && !state.gameOver && !state.levelCleared) {
    if (!state.buttonPressed) {
      const pb = state.pauseButton;
      if (mousePos.x >= pb.x && mousePos.x <= pb.x + pb.width &&
          mousePos.y >= pb.y && mousePos.y <= pb.y + pb.height) {
        state.paused = !state.paused;
        state.buttonPressed = true;
      }
    }
  }

  if (!mouseDown) {
    state.buttonPressed = false;
  }

  if (state.gameOver) {
    // Handle game over screen buttons
    if (mouseDown && mousePos && !state.buttonPressed) {
      state.buttonPressed = true;
      const pab = state.playAgainButton;
      const rb = state.restartButton;
      const bb = state.backButton;

      if (mousePos.x >= pab.x && mousePos.x <= pab.x + pab.width &&
          mousePos.y >= pab.y && mousePos.y <= pab.y + pab.height) {
        state.gameOver = false;
        resetGameState(state);
      } else if (mousePos.x >= rb.x && mousePos.x <= rb.x + rb.width &&
                 mousePos.y >= rb.y && mousePos.y <= rb.y + rb.height) {
        resetGameState(state);
        state.gameOver = false;
        state.paused = false;
      } else if (mousePos.x >= bb.x && mousePos.x <= bb.x + bb.width &&
                 mousePos.y >= bb.y && mousePos.y <= bb.y + bb.height) {
        state.returnToMenu = true;
      }
    }
    return state;
  }

  if (state.paused) {
    // Handle pause screen buttons
    if (mouseDown && mousePos && !state.buttonPressed) {
      state.buttonPressed = true;
      const pab = state.playAgainButton;
      const rb = state.restartButton;
      const bb = state.backButton;

      if (mousePos.x >= pab.x && mousePos.x <= pab.x + pab.width &&
          mousePos.y >= pab.y && mousePos.y <= pab.y + pab.height) {
        state.paused = false;
      } else if (mousePos.x >= rb.x && mousePos.x <= rb.x + rb.width &&
                 mousePos.y >= rb.y && mousePos.y <= rb.y + rb.height) {
        resetGameState(state);
        state.gameOver = false;
        state.paused = false;
      } else if (mousePos.x >= bb.x && mousePos.x <= bb.x + bb.width &&
                 mousePos.y >= bb.y && mousePos.y <= bb.y + bb.height) {
        state.returnToMenu = true;
      }
    }
    return state;
  }

  // Handle level transition
  if (state.levelCleared) {
    // Check if power-up expires during level transition
    if (state.specialActive && currentTime - state.specialTimer > 5000) {
      state.specialActive = null;
      state.paddle.width = PADDLE_WIDTH;
      state.multiBallSpawned = false;
    }

    // Gradually add new bricks with animation
    if (state.newBricks.length > 0 && currentTime - state.lastRefillTime > state.refillDelay) {
      const brick = state.newBricks.shift()!;
      state.bricks.push(brick);
      state.lastRefillTime = currentTime;

      for (let i = 0; i < 5; i++) {
        state.particles.push(createParticle(
          brick.x + brick.width / 2,
          brick.y + brick.height / 2,
          BRICK_COLORS[Math.min(4, state.level - 1) % BRICK_COLORS.length],
          randomFloat(0.5, 1.5),
          randomFloat(2, 4),
          30
        ));
      }
    }

    // When all bricks are refilled, resume normal gameplay
    if (state.newBricks.length === 0) {
      state.levelCleared = false;
      state.balls = [{
        x: state.startingBallPos.x,
        y: state.startingBallPos.y,
        radius: BALL_RADIUS,
        dx: 0,
        dy: 0
      }];
      const baseSpeed = 5 + (state.level - 1) * 0.5;
      state.balls[0].dx = baseSpeed;
      state.balls[0].dy = -baseSpeed;
      state.paddle.x = state.startingPaddlePos;

      state.score += state.level * 50;

      if (state.paddle.width > PADDLE_WIDTH * 0.7 && !state.specialActive) {
        state.paddle.width = Math.max(PADDLE_WIDTH * 0.9, state.paddle.width - 5);
      } else if (state.specialActive === 'big_paddle') {
        state.paddle.width = 150;
      }
    }
    return state;
  }

  // Move paddle
  if (keys.has('ArrowLeft') && state.paddle.x > 0) {
    state.paddle.x -= 10;
  }
  if (keys.has('ArrowRight') && state.paddle.x + state.paddle.width < WIDTH) {
    state.paddle.x += 10;
  }

  // Update particles
  updateParticles(state);

  // Move and handle collision for all balls
  const ballsToRemove: number[] = [];
  
  for (let i = 0; i < state.balls.length; i++) {
    const ball = state.balls[i];
    
    ball.x += ball.dx;
    ball.y += ball.dy;

    // Collision with walls
    if (ball.x - ball.radius <= 0 || ball.x + ball.radius >= WIDTH) {
      const bounce = applyBounceRandomness(-ball.dx, ball.dy);
      ball.dx = bounce.dx;
      ball.dy = bounce.dy;
      for (let j = 0; j < 5; j++) {
        state.particles.push(createParticle(ball.x, ball.y, COLORS.BALL_COLOR, randomFloat(1, 2), randomFloat(2, 3), 15));
      }
    }
    if (ball.y - ball.radius <= 0) {
      const bounce = applyBounceRandomness(ball.dx, -ball.dy);
      ball.dx = bounce.dx;
      ball.dy = bounce.dy;
      for (let j = 0; j < 5; j++) {
        state.particles.push(createParticle(ball.x, ball.y, COLORS.BALL_COLOR, randomFloat(1, 2), randomFloat(2, 3), 15));
      }
    }
    if (ball.y + ball.radius >= HEIGHT) {
      ballsToRemove.push(i);
      for (let j = 0; j < 10; j++) {
        state.particles.push(createParticle(ball.x, ball.y, COLORS.RED, randomFloat(2, 3), randomFloat(3, 5), 20));
      }
      continue;
    }

    // Collision with paddle
    if (state.collisionCooldown === 0 &&
        ball.x + ball.radius >= state.paddle.x &&
        ball.x - ball.radius <= state.paddle.x + state.paddle.width &&
        ball.y + ball.radius >= state.paddle.y &&
        ball.y - ball.radius <= state.paddle.y + state.paddle.height) {
      
      if (ball.y < state.paddle.y + state.paddle.height / 2) {
        ball.y = state.paddle.y - ball.radius - 1;
        const hitPos = (ball.x - state.paddle.x) / state.paddle.width;
        const angle = Math.PI * (0.25 + 0.5 * hitPos);
        const speed = Math.sqrt(ball.dx * ball.dx + ball.dy * ball.dy);
        ball.dx = Math.cos(angle) * speed;
        ball.dy = -Math.sin(angle) * speed;
        state.collisionCooldown = 5;
        for (let j = 0; j < 8; j++) {
          state.particles.push(createParticle(ball.x, ball.y, COLORS.PADDLE_COLOR, randomFloat(1, 2), randomFloat(2, 3), 15));
        }
      } else if (ball.y > state.paddle.y + state.paddle.height / 2) {
        ball.y = state.paddle.y + state.paddle.height + ball.radius + 1;
        ball.dy = Math.abs(ball.dy);
        state.collisionCooldown = 5;
      } else {
        ball.dx = -ball.dx;
        state.collisionCooldown = 5;
      }
    }

    // Collision with bricks
    for (let b = 0; b < state.bricks.length; b++) {
      const brick = state.bricks[b];
      if (state.collisionCooldown === 0 &&
          ball.x + ball.radius >= brick.x &&
          ball.x - ball.radius <= brick.x + brick.width &&
          ball.y + ball.radius >= brick.y &&
          ball.y - ball.radius <= brick.y + brick.height) {
        
        state.brickParticles.push(...createBrickParticles(brick, state.level));
        
        // Determine collision direction
        const overlapLeft = ball.x + ball.radius - brick.x;
        const overlapRight = brick.x + brick.width - (ball.x - ball.radius);
        const overlapTop = ball.y + ball.radius - brick.y;
        const overlapBottom = brick.y + brick.height - (ball.y - ball.radius);
        
        const minOverlapX = Math.min(overlapLeft, overlapRight);
        const minOverlapY = Math.min(overlapTop, overlapBottom);
        
        if (minOverlapX < minOverlapY) {
          const bounce = applyBounceRandomness(-ball.dx, ball.dy);
          ball.dx = bounce.dx;
          ball.dy = bounce.dy;
        } else {
          const bounce = applyBounceRandomness(ball.dx, -ball.dy);
          ball.dx = bounce.dx;
          ball.dy = bounce.dy;
        }
        
        state.bricks.splice(b, 1);
        state.score += 10;
        state.collisionCooldown = 3;
        
        // Special event trigger
        if (!state.specialActive) {
          const newSpecial = triggerSpecialEvent();
          if (newSpecial) {
            state.specialActive = newSpecial;
            state.specialTimer = currentTime;
            state.multiBallSpawned = false;
            state.specialEffectParticles.push(...createSpecialEffect(brick.x + brick.width / 2, brick.y + brick.height / 2, newSpecial));
          }
        }
        break;
      }
    }

    // Add ball trail particles
    if (Math.random() < 0.3) {
      state.particles.push(createParticle(
        ball.x,
        ball.y,
        COLORS.BALL_COLOR,
        0.5,
        ball.radius * 0.7,
        15
      ));
    }
  }

  // Remove balls that went out of bounds
  for (const i of ballsToRemove.sort((a, b) => b - a)) {
    if (i < state.balls.length) {
      state.balls.splice(i, 1);
    }
  }

  // Update collision cooldown
  if (state.collisionCooldown > 0) {
    state.collisionCooldown--;
  }

  // Apply special events
  if (state.specialActive) {
    if (state.specialActive === 'big_paddle') {
      state.paddle.width = 150;
    } else if (state.specialActive === 'score_boost') {
      state.score += 5;
    } else if (state.specialActive === 'multi_ball') {
      if (!state.multiBallSpawned && state.balls.length > 0) {
        spawnMultiBalls(state, state.balls[0]);
      }
    }

    if (currentTime - state.specialTimer > 5000) {
      state.specialActive = null;
      state.paddle.width = PADDLE_WIDTH;
      state.multiBallSpawned = false;
    }
  }

  // Win condition
  if (state.bricks.length === 0 && !state.levelCleared) {
    state.levelCleared = true;
    state.level++;
    state.newBricks = createNewBricks();
    state.lastRefillTime = currentTime;
    state.startingBallPos = { x: WIDTH / 2, y: HEIGHT - 100 };
    state.startingPaddlePos = WIDTH / 2 - PADDLE_WIDTH / 2;
    state.balls = [{
      x: state.startingBallPos.x,
      y: state.startingBallPos.y,
      radius: BALL_RADIUS,
      dx: 5,
      dy: -5
    }];
    state.paddle.x = state.startingPaddlePos;
    state.levelTransitionMessageTime = currentTime + 3000;
    
    for (let i = 0; i < 30; i++) {
      state.specialEffectParticles.push(createParticle(
        randomInt(0, WIDTH),
        randomInt(0, HEIGHT / 2),
        BRICK_COLORS[randomInt(0, BRICK_COLORS.length - 1)],
        randomFloat(1, 3),
        randomFloat(3, 6),
        60
      ));
    }
  }

  return state;
}

function updateParticles(state: GameState): void {
  // Update ball trail particles
  state.particles = state.particles.filter(p => {
    p.life--;
    if (p.life <= 0) return false;
    p.x += p.speed_x;
    p.y += p.speed_y;
    p.size *= 0.95;
    return true;
  });

  // Update brick explosion particles
  state.brickParticles = state.brickParticles.filter(p => {
    p.life--;
    if (p.life <= 0) return false;
    p.x += p.speed_x;
    p.y += p.speed_y;
    p.speed_y += 0.1;
    return true;
  });

  // Update special effect particles
  state.specialEffectParticles = state.specialEffectParticles.filter(p => {
    p.life--;
    if (p.life <= 0) return false;
    p.x += p.speed_x;
    p.y += p.speed_y;
    return true;
  });
}