import { Injectable, signal, computed } from '@angular/core';
import { Position, Direction, GameState, GameConfig, DEFAULT_CONFIG } from '../../features/snake-game/models/snake.model';

@Injectable({ providedIn: 'root' })
export class SnakeService {
  private config: GameConfig = { ...DEFAULT_CONFIG };
  private intervalId: number | null = null;

  readonly snake = signal<SnakePart[]>([]);
  readonly food = signal<Position>({ x: 0, y: 0 });
  readonly direction = signal<Direction>('RIGHT');
  readonly nextDirection = signal<Direction>('RIGHT');
  readonly gameState = signal<GameState>('IDLE');
  readonly score = signal<number>(0);
  readonly highScore = signal<number>(0);
  readonly worldRecord = signal<number>(this.config.worldRecord);
  readonly showConfetti = signal<boolean>(false);
  readonly isEating = signal<boolean>(false);
  readonly isHissing = signal<boolean>(false);
  readonly tongueOut = signal<boolean>(false);

  readonly boardSize = computed(() => ({
    width: this.config.boardWidth * this.config.cellSize,
    height: this.config.boardHeight * this.config.cellSize,
  }));

  private audioContext: AudioContext | null = null;

  private initAudio(): void {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }

  private playEatSound(): void {
    this.initAudio();
    if (!this.audioContext) return;

    const ctx = this.audioContext;

    const noise = ctx.createBufferSource();
    const buffer = ctx.createBuffer(1, ctx.sampleRate * 0.15, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.05));
    }
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 800;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.4, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    noise.start(ctx.currentTime);

    const osc = ctx.createOscillator();
    const oscGain = ctx.createGain();
    osc.frequency.setValueAtTime(120, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(60, ctx.currentTime + 0.1);
    osc.type = 'sawtooth';
    oscGain.gain.setValueAtTime(0.2, ctx.currentTime);
    oscGain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
    osc.connect(oscGain);
    oscGain.connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.1);
  }

  private playHissSound(): void {
    this.initAudio();
    if (!this.audioContext) return;

    const ctx = this.audioContext;
    const noise = ctx.createBufferSource();
    const buffer = ctx.createBuffer(1, ctx.sampleRate * 0.3, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      const t = i / ctx.sampleRate;
      data[i] = (Math.random() * 2 - 1) * Math.sin(t * 10) * Math.exp(-t * 4);
    }
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 2000;
    filter.Q.value = 2;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    noise.start(ctx.currentTime);
  }

  private playSlitherSound(): void {
    this.initAudio();
    if (!this.audioContext) return;

    const ctx = this.audioContext;
    const noise = ctx.createBufferSource();
    const buffer = ctx.createBuffer(1, ctx.sampleRate * 0.05, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.3;
    }
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 500;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.05, ctx.currentTime);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    noise.start(ctx.currentTime);
  }

  updateConfig(newConfig: Partial<GameConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.worldRecord.set(this.config.worldRecord);
  }

  getConfig(): GameConfig {
    return { ...this.config };
  }

  initGame(): void {
    this.tongueOut.set(true);
    setTimeout(() => this.tongueOut.set(false), 2000);

    const startX = Math.floor(this.config.boardWidth / 4);
    const startY = Math.floor(this.config.boardHeight / 2);
    const snake: SnakePart[] = [
      { pos: { x: startX, y: startY }, scale: 1, rotation: 0, isHead: true },
      { pos: { x: startX - 1, y: startY }, scale: 0.95, rotation: 0, isHead: false },
      { pos: { x: startX - 2, y: startY }, scale: 0.88, rotation: 0, isHead: false },
    ];
    this.snake.set(snake);
    this.direction.set('RIGHT');
    this.nextDirection.set('RIGHT');
    this.score.set(0);
    this.showConfetti.set(false);
    this.spawnFood();
    this.gameState.set('PLAYING');
    this.startGameLoop();
  }

  private startGameLoop(): void {
    this.stopGameLoop();
    this.intervalId = window.setInterval(() => this.update(), this.config.initialSpeed);
  }

  private stopGameLoop(): void {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  pause(): void {
    if (this.gameState() === 'PLAYING') {
      this.gameState.set('PAUSED');
      this.stopGameLoop();
    }
  }

  resume(): void {
    if (this.gameState() === 'PAUSED') {
      this.gameState.set('PLAYING');
      this.startGameLoop();
    }
  }

  setDirection(dir: Direction): void {
    const opposites: Record<Direction, Direction> = {
      UP: 'DOWN',
      DOWN: 'UP',
      LEFT: 'RIGHT',
      RIGHT: 'LEFT',
    };
    if (opposites[dir] !== this.direction()) {
      this.nextDirection.set(dir);
      this.playSlitherSound();
    }
  }

  private update(): void {
    const currentSnake = this.snake();
    const head = currentSnake[0];
    const nextDir = this.nextDirection();

    this.direction.set(nextDir);

    const newHeadPos = { ...head.pos };
    switch (nextDir) {
      case 'UP': newHeadPos.y--; break;
      case 'DOWN': newHeadPos.y++; break;
      case 'LEFT': newHeadPos.x--; break;
      case 'RIGHT': newHeadPos.x++; break;
    }

    const rotation = this.getRotationForDirection(nextDir);

    if (this.checkCollision(newHeadPos)) {
      this.isHissing.set(true);
      setTimeout(() => this.isHissing.set(false), 500);
      this.gameOver();
      return;
    }

    const isEating = newHeadPos.x === this.food().x && newHeadPos.y === this.food().y;

    if (isEating) {
      this.isEating.set(true);
      this.isHissing.set(true);
      this.playEatSound();
      setTimeout(() => this.playHissSound(), 50);

      setTimeout(() => {
        this.isEating.set(false);
        this.isHissing.set(false);
      }, 300);

      this.score.update(s => s + 10);
      this.checkWorldRecord();
      this.spawnFood();

      const newSnake = [
        { pos: newHeadPos, scale: 1.1, rotation, isHead: true },
        ...currentSnake.map((part, i) => ({
          ...part,
          scale: Math.min(1.05, 0.92 + (i * 0.01)),
          isHead: false,
        })),
        { ...currentSnake[currentSnake.length - 1], scale: Math.min(1, currentSnake[currentSnake.length - 1].scale + 0.02) },
      ];
      this.snake.set(newSnake);
    } else {
      this.tongueOut.set(true);
      setTimeout(() => this.tongueOut.set(false), 500);

      const newSnake = [
        { pos: newHeadPos, scale: 1, rotation, isHead: true },
        ...currentSnake.slice(0, -1).map((part, i) => ({
          ...part,
          scale: i === 0 ? 1 : Math.max(0.5, 0.95 - (i * 0.02)),
          rotation: i === 0 ? rotation : part.rotation,
          isHead: false,
        })),
      ];
      this.snake.set(newSnake);
      this.playSlitherSound();
    }
  }

  private getRotationForDirection(dir: Direction): number {
    switch (dir) {
      case 'UP': return 0;
      case 'DOWN': return 180;
      case 'LEFT': return -90;
      case 'RIGHT': return 90;
    }
  }

  private checkCollision(head: Position): boolean {
    const snake = this.snake();
    if (head.x < 0 || head.x >= this.config.boardWidth ||
        head.y < 0 || head.y >= this.config.boardHeight) {
      return true;
    }
    return snake.some((seg, i) => i > 4 && seg.pos.x === head.x && seg.pos.y === head.y);
  }

  private checkWorldRecord(): void {
    if (this.score() >= this.worldRecord() && this.score() > this.highScore()) {
      this.worldRecord.set(this.score());
      this.showConfetti.set(true);
      setTimeout(() => this.showConfetti.set(false), 4000);
    }
  }

  private spawnFood(): void {
    let pos: Position;
    do {
      pos = {
        x: Math.floor(Math.random() * this.config.boardWidth),
        y: Math.floor(Math.random() * this.config.boardHeight),
      };
    } while (this.snake().some(s => s.pos.x === pos.x && s.pos.y === pos.y));
    this.food.set(pos);
  }

  private gameOver(): void {
    this.gameState.set('GAME_OVER');
    this.stopGameLoop();
    if (this.score() > this.highScore()) {
      this.highScore.set(this.score());
    }
  }

  readonly snakePath = computed(() => {
    const segments = this.snake();
    if (segments.length < 2) return '';
    const cs = this.config.cellSize;

    const leftPoints: { x: number; y: number }[] = [];
    const rightPoints: { x: number; y: number }[] = [];

    for (let i = 0; i < segments.length; i++) {
      const p = segments[i].pos;
      const cx = p.x * cs + cs / 2;
      const cy = p.y * cs + cs / 2;
      const progress = i / (segments.length - 1);
      const thickness = cs * 0.45 * (1 - progress * 0.6);

      let dx = 0, dy = 0;
      if (i === 0) {
        const next = segments[1].pos;
        dx = next.x - p.x;
        dy = next.y - p.y;
      } else if (i === segments.length - 1) {
        const prev = segments[i - 1].pos;
        dx = p.x - prev.x;
        dy = p.y - prev.y;
      } else {
        const prev = segments[i - 1].pos;
        const next = segments[i + 1].pos;
        dx = next.x - prev.x;
        dy = next.y - prev.y;
      }
      const len = Math.sqrt(dx * dx + dy * dy) || 1;
      const nx = -dy / len;
      const ny = dx / len;

      leftPoints.push({ x: cx + nx * thickness, y: cy + ny * thickness });
      rightPoints.push({ x: cx - nx * thickness, y: cy - ny * thickness });
    }

    let d = `M ${leftPoints[0].x} ${leftPoints[0].y}`;
    for (let i = 1; i < leftPoints.length; i++) {
      d += ` L ${leftPoints[i].x} ${leftPoints[i].y}`;
    }
    const last = segments.length - 1;
    const tailCx = segments[last].pos.x * cs + cs / 2;
    const tailCy = segments[last].pos.y * cs + cs / 2;
    const tailDirX = tailCx - rightPoints[last].x;
    const tailDirY = tailCy - rightPoints[last].y;
    const tailLen = Math.sqrt(tailDirX * tailDirX + tailDirY * tailDirY) || 1;
    d += ` L ${tailCx + (tailDirX / tailLen) * cs * 0.25} ${tailCy + (tailDirY / tailLen) * cs * 0.25}`;

    for (let i = rightPoints.length - 1; i >= 0; i--) {
      d += ` L ${rightPoints[i].x} ${rightPoints[i].y}`;
    }

    const headCx = segments[0].pos.x * cs + cs / 2;
    const headCy = segments[0].pos.y * cs + cs / 2;
    const headDirX = headCx - leftPoints[0].x;
    const headDirY = headCy - leftPoints[0].y;
    const headLen = Math.sqrt(headDirX * headDirX + headDirY * headDirY) || 1;
    d += ` L ${headCx + (headDirX / headLen) * cs * 0.4} ${headCy + (headDirY / headLen) * cs * 0.4}`;

    d += ' Z';
    return d;
  });

  readonly patternMarkers = computed(() => {
    const cs = this.config.cellSize;
    return this.snake()
      .filter((_, i) => i > 0 && i < this.snake().length - 1 && i % 3 === 0)
      .map(s => ({ x: s.pos.x * cs + cs / 2, y: s.pos.y * cs + cs / 2 }));
  });

  getHeadStyle(): Record<string, string> {
    const head = this.snake()[0];
    if (!head) return {};
    const cs = this.config.cellSize;
    const rot = this.getRotationForDirection(this.direction());
    const x = head.pos.x * cs + cs / 2 - 26;
    const y = head.pos.y * cs + cs / 2 - 25;
    return {
      left: `${x}px`,
      top: `${y}px`,
      transform: `rotate(${rot}deg)`,
      transition: 'left 0.04s linear, top 0.04s linear, transform 0.04s',
    };
  }
}

interface SnakePart {
  pos: Position;
  scale: number;
  rotation: number;
  isHead: boolean;
}