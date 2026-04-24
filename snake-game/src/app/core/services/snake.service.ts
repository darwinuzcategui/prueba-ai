import { Injectable, signal, computed } from '@angular/core';
import { Position, Direction, GameState, GameConfig, DEFAULT_CONFIG } from '../../features/snake-game/models/snake.model';

export const WORLD_RECORD = 500;

@Injectable({ providedIn: 'root' })
export class SnakeService {
  private readonly config: GameConfig = DEFAULT_CONFIG;

  private intervalId: number | null = null;

  readonly snake = signal<Position[]>([]);
  readonly food = signal<Position>({ x: 0, y: 0 });
  readonly direction = signal<Direction>('RIGHT');
  readonly nextDirection = signal<Direction>('RIGHT');
  readonly gameState = signal<GameState>('IDLE');
  readonly score = signal<number>(0);
  readonly highScore = signal<number>(0);
  readonly worldRecord = signal<number>(WORLD_RECORD);
  readonly showConfetti = signal<boolean>(false);

  readonly boardSize = computed(() => ({
    width: this.config.boardWidth * this.config.cellSize,
    height: this.config.boardHeight * this.config.cellSize,
  }));

  initGame(): void {
    const startX = Math.floor(this.config.boardWidth / 4);
    const startY = Math.floor(this.config.boardHeight / 2);
    this.snake.set([
      { x: startX, y: startY },
      { x: startX - 1, y: startY },
      { x: startX - 2, y: startY },
    ]);
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
    const speed = this.config.initialSpeed;
    this.intervalId = window.setInterval(() => this.update(), speed);
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
    const head = { ...currentSnake[0] };
    const nextDir = this.nextDirection();

    this.direction.set(nextDir);

    switch (nextDir) {
      case 'UP': head.y--; break;
      case 'DOWN': head.y++; break;
      case 'LEFT': head.x--; break;
      case 'RIGHT': head.x++; break;
    }

    if (this.checkCollision(head)) {
      this.gameOver();
      return;
    }

    const newSnake = [head, ...currentSnake];

    if (head.x === this.food().x && head.y === this.food().y) {
      this.score.update(s => s + 10);
      this.checkWorldRecord();
      this.spawnFood();
    } else {
      newSnake.pop();
    }

    this.snake.set(newSnake);
  }

  private checkCollision(head: Position): boolean {
    const snake = this.snake();
    if (head.x < 0 || head.x >= this.config.boardWidth ||
        head.y < 0 || head.y >= this.config.boardHeight) {
      return true;
    }
    return snake.some((seg, i) => i > 0 && seg.x === head.x && seg.y === head.y);
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
    } while (this.snake().some(s => s.x === pos.x && s.y === pos.y));
    this.food.set(pos);
  }

  private gameOver(): void {
    this.gameState.set('GAME_OVER');
    this.stopGameLoop();
    if (this.score() > this.highScore()) {
      this.highScore.set(this.score());
    }
  }

  getCellStyle(pos: Position, isHead: boolean = false): Record<string, string> {
    return {
      left: `${pos.x * this.config.cellSize}px`,
      top: `${pos.y * this.config.cellSize}px`,
      width: `${this.config.cellSize}px`,
      height: `${this.config.cellSize}px`,
      transform: isHead ? 'scale(1.1)' : 'scale(1)',
      zIndex: isHead ? '2' : '1',
    };
  }

  getSnakeSegmentStyle(segment: Position, index: number, total: number): Record<string, string> {
    const baseStyle = this.getCellStyle(segment, index === 0);
    const progress = index / total;
    const scale = 1.1 - (progress * 0.2);
    const opacity = 1 - (progress * 0.3);

    return {
      ...baseStyle,
      transform: `scale(${scale})`,
      opacity: String(opacity),
      background: index === 0
        ? 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)'
        : `linear-gradient(135deg, hsl(${120 - progress * 20}, 85%, ${50 - progress * 10}%) 0%, hsl(${120 - progress * 20}, 85%, ${40 - progress * 10}%) 100%)`,
      boxShadow: index === 0
        ? '0 0 15px rgba(34, 197, 94, 0.8), inset 0 2px 4px rgba(255,255,255,0.3), inset 0 -2px 4px rgba(0,0,0,0.3)'
        : '0 0 8px rgba(74, 222, 128, 0.4), inset 0 1px 2px rgba(255,255,255,0.2), inset 0 -1px 2px rgba(0,0,0,0.2)',
      borderRadius: index === 0 ? '50% 50% 40% 40%' : '40%',
    };
  }
}