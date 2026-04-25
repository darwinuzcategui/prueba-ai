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

  getSnakePartStyle(part: SnakePart, index: number, total: number): Record<string, string> {
    const cellSize = this.config.cellSize;
    const isHead = part.isHead;
    const baseScale = part.scale;
    const progress = index / Math.max(total - 1, 1);

    const x = part.pos.x * cellSize;
    const y = part.pos.y * cellSize;

    // Multipliers > 1.0 create overlap between segments, ensuring a continuous body without separation
    const width = cellSize * baseScale * (isHead ? 1.4 : 1.3);
    const height = cellSize * baseScale * (isHead ? 1.35 : 1.3);
    const left = x - (width - cellSize) / 2;
    const top = y - (height - cellSize) / 2;

    const baseHue = 95 + Math.sin(index * 0.4) * 15;
    const saturation = 60 + progress * 15;
    const lightness = 35 + Math.sin(index * 0.8) * 8;

    const darkColor = `hsl(${baseHue}, ${saturation}%, ${lightness}%)`;
    const midColor = `hsl(${baseHue + 15}, ${saturation + 10}%, ${lightness + 12}%)`;
    const lightColor = `hsl(${baseHue + 25}, ${saturation - 10}%, ${lightness + 25}%)`;
    const shadowColor = `hsl(${baseHue - 15}, ${saturation}%, ${lightness - 15}%)`;

    const borderRadius = isHead
      ? '35% 65% 55% 45% / 40% 45% 55% 60%'
      : `ellipse at ${50 + Math.sin(index * 1.5) * 30}% ${50 + Math.cos(index * 1.2) * 30}%`;

    return {
      position: 'absolute',
      left: `${left}px`,
      top: `${top}px`,
      width: `${width}px`,
      height: `${height}px`,
      background: `
        radial-gradient(ellipse at 20% 20%, ${lightColor} 0%, transparent 40%),
        radial-gradient(ellipse at 80% 80%, ${shadowColor} 0%, transparent 50%),
        radial-gradient(ellipse at 50% 50%, ${midColor} 0%, ${darkColor} 60%),
        linear-gradient(${isHead ? '165deg' : '150deg'}, ${midColor} 0%, ${darkColor} 50%, ${shadowColor} 100%)
      `,
      borderRadius,
      boxShadow: `
        inset 4px 4px 8px ${lightColor},
        inset -4px -4px 8px ${shadowColor},
        inset 0 0 20px rgba(0,0,0,0.5),
        0 0 ${isHead ? 15 : Math.max(3, 12 - progress * 10)}px hsla(${baseHue}, 50%, 25%, ${isHead ? 0.8 : (0.6 - progress * 0.4)})
      `,
      transform: `rotate(${part.rotation}deg) scaleY(${isHead ? 1 : 0.92})`,
      zIndex: String(total - index),
      transition: 'left 0.04s linear, top 0.04s linear, width 0.06s, height 0.06s, transform 0.04s',
      filter: `brightness(${0.9 - progress * 0.1}) saturate(${1.15 + progress * 0.15}) contrast(${1.05 + progress * 0.1})`,
    };
  }

  getFoodStyle(pos: Position): Record<string, string> {
    const cellSize = this.config.cellSize;

    return {
      position: 'absolute',
      left: `${pos.x * cellSize}px`,
      top: `${pos.y * cellSize}px`,
      width: `${cellSize}px`,
      height: `${cellSize}px`,
      transform: 'rotate(-20deg) scale(0.8)',
      zIndex: '5',
    };
  }
}

interface SnakePart {
  pos: Position;
  scale: number;
  rotation: number;
  isHead: boolean;
}