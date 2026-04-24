import { Injectable, signal, computed } from '@angular/core';
import { Position, Direction, GameState, GameConfig, DEFAULT_CONFIG } from '../../features/snake-game/models/snake.model';

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

  getCellStyle(pos: Position): Record<string, string> {
    return {
      left: `${pos.x * this.config.cellSize}px`,
      top: `${pos.y * this.config.cellSize}px`,
      width: `${this.config.cellSize}px`,
      height: `${this.config.cellSize}px`,
    };
  }
}