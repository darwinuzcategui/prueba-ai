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
  readonly mouthOpen = signal<number>(0);

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
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.frequency.setValueAtTime(200, ctx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.1);

    gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.15);

    const oscillator2 = ctx.createOscillator();
    const gainNode2 = ctx.createGain();
    oscillator2.connect(gainNode2);
    gainNode2.connect(ctx.destination);
    oscillator2.frequency.setValueAtTime(150, ctx.currentTime + 0.05);
    oscillator2.frequency.exponentialRampToValueAtTime(60, ctx.currentTime + 0.12);
    gainNode2.gain.setValueAtTime(0.2, ctx.currentTime + 0.05);
    gainNode2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.12);
    oscillator2.start(ctx.currentTime + 0.05);
    oscillator2.stop(ctx.currentTime + 0.12);
  }

  private playGameOverSound(): void {
    this.initAudio();
    if (!this.audioContext) return;

    const ctx = this.audioContext;
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.frequency.setValueAtTime(300, ctx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.3);
    oscillator.type = 'sawtooth';

    gainNode.gain.setValueAtTime(0.2, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.3);
  }

  updateConfig(newConfig: Partial<GameConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.worldRecord.set(this.config.worldRecord);
  }

  getConfig(): GameConfig {
    return { ...this.config };
  }

  initGame(): void {
    const startX = Math.floor(this.config.boardWidth / 4);
    const startY = Math.floor(this.config.boardHeight / 2);
    const snake: SnakePart[] = [
      { pos: { x: startX, y: startY }, scale: 1.1, rotation: 0, isHead: true },
      { pos: { x: startX - 1, y: startY }, scale: 1, rotation: 0, isHead: false },
      { pos: { x: startX - 2, y: startY }, scale: 0.95, rotation: 0, isHead: false },
    ];
    this.snake.set(snake);
    this.direction.set('RIGHT');
    this.nextDirection.set('RIGHT');
    this.score.set(0);
    this.showConfetti.set(false);
    this.mouthOpen.set(0);
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
      this.playGameOverSound();
      this.gameOver();
      return;
    }

    const isEating = newHeadPos.x === this.food().x && newHeadPos.y === this.food().y;

    if (isEating) {
      this.isEating.set(true);
      this.mouthOpen.set(1);
      this.playEatSound();

      setTimeout(() => {
        this.mouthOpen.set(0);
        this.isEating.set(false);
      }, 250);

      this.score.update(s => s + 10);
      this.checkWorldRecord();
      this.spawnFood();

      const newSnake = [
        { pos: newHeadPos, scale: 1.15, rotation, isHead: true },
        ...currentSnake.map((part, i) => ({
          ...part,
          scale: Math.min(1.15, 0.9 + (i * 0.02)),
          isHead: false,
        })),
        { ...currentSnake[currentSnake.length - 1], scale: Math.min(1.1, currentSnake[currentSnake.length - 1].scale + 0.03) },
      ];
      this.snake.set(newSnake);
    } else {
      this.mouthOpen.set(0);
      const newSnake = [
        { pos: newHeadPos, scale: 1.1, rotation, isHead: true },
        ...currentSnake.slice(0, -1).map((part, i) => ({
          ...part,
          scale: i === 0 ? 1.1 : Math.max(0.65, 0.95 - (i * 0.015)),
          rotation: i === 0 ? rotation : part.rotation,
          isHead: false,
        })),
      ];
      this.snake.set(newSnake);
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

    const width = cellSize * baseScale * (isHead ? 1.3 : 1.1);
    const height = cellSize * baseScale * (isHead ? 1.1 : 1.05);
    const left = x - (width - cellSize) / 2;
    const top = y - (height - cellSize) / 2;

    const baseHue = 95 + Math.sin(index * 0.5) * 15;
    const saturation = 75 - progress * 20;
    const lightness = 28 - progress * 12;

    const darkColor = `hsl(${baseHue}, ${saturation}%, ${lightness}%)`;
    const midColor = `hsl(${baseHue + 5}, ${saturation + 5}%, ${lightness + 8}%)`;
    const lightColor = `hsl(${baseHue + 10}, ${saturation - 10}%, ${lightness + 15}%)`;

    const borderRadius = isHead
      ? '65% 35% 45% 55% / 50% 45% 55% 50%'
      : progress < 0.15
        ? '60% 40% 50% 50% / 55% 45% 55% 45%'
        : progress < 0.5
          ? '50% 50% 45% 55% / 50% 50% 50% 50%'
          : '45% 55% 55% 45% / 45% 55% 45% 55%';

    const glowIntensity = isHead ? 0.9 : (0.7 - progress * 0.45);
    const glowSize = isHead ? 18 : Math.max(4, 12 - progress * 8);

    return {
      position: 'absolute',
      left: `${left}px`,
      top: `${top}px`,
      width: `${width}px`,
      height: `${height}px`,
      background: `
        radial-gradient(ellipse at 25% 25%, ${lightColor} 0%, transparent 45%),
        radial-gradient(ellipse at 75% 75%, ${darkColor} 0%, transparent 50%),
        radial-gradient(ellipse at 50% 50%, ${midColor} 0%, ${darkColor} 70%),
        linear-gradient(${isHead ? '160deg' : '145deg'}, ${midColor} 0%, ${darkColor} 50%, ${darkColor} 100%)
      `,
      borderRadius,
      boxShadow: `
        inset 3px 3px 6px ${lightColor},
        inset -3px -3px 6px ${darkColor},
        inset 0 0 15px rgba(0,0,0,0.3),
        0 0 ${glowSize}px hsla(${baseHue}, 85%, 40%, ${glowIntensity})
      `,
      transform: `rotate(${part.rotation}deg) scaleY(${isHead ? 1 : 1 - progress * 0.15})`,
      zIndex: String(total - index),
      transition: 'left 0.05s linear, top 0.05s linear, width 0.08s, height 0.08s, transform 0.05s',
      filter: `brightness(${1 - progress * 0.15}) saturate(${1.1 + progress * 0.2})`,
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
      background: `
        radial-gradient(ellipse at 30% 30%, #ff9966 0%, #e64a19 30%, #bf360c 60%, #8b1a1a 100%)
      `,
      borderRadius: '45% 55% 50% 50% / 50% 45% 55% 50%',
      boxShadow: `
        inset 4px 4px 10px rgba(255,200,150,0.5),
        inset -3px -3px 8px rgba(0,0,0,0.4),
        0 0 ${cellSize * 0.5}px rgba(255,80,30,0.8),
        0 0 ${cellSize}px rgba(255,50,20,0.5)
      `,
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