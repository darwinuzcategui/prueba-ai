import { Injectable, signal, computed } from '@angular/core';
import { Position, Direction, GameState, GameConfig, DEFAULT_CONFIG } from '../../features/snake-game/models/snake.model';

@Injectable({ providedIn: 'root' })
export class SnakeService {
  private config: GameConfig = { ...DEFAULT_CONFIG };

  private intervalId: number | null = null;

  readonly snake = signal<Position[]>([]);
  readonly food = signal<Position>({ x: 0, y: 0 });
  readonly direction = signal<Direction>('RIGHT');
  readonly nextDirection = signal<Direction>('RIGHT');
  readonly gameState = signal<GameState>('IDLE');
  readonly score = signal<number>(0);
  readonly highScore = signal<number>(0);
  readonly worldRecord = signal<number>(this.config.worldRecord);
  readonly showConfetti = signal<boolean>(false);

  readonly boardSize = computed(() => ({
    width: this.config.boardWidth * this.config.cellSize,
    height: this.config.boardHeight * this.config.cellSize,
  }));

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

  getSnakeSegmentStyle(segment: Position, index: number, total: number): Record<string, string> {
    const cellSize = this.config.cellSize;
    const isHead = index === 0;
    const progress = index / Math.max(total - 1, 1);

    const baseLeft = segment.x * cellSize;
    const baseTop = segment.y * cellSize;

    let segmentWidth = cellSize;
    let segmentHeight = cellSize;
    let left = baseLeft;
    let top = baseTop;

    if (isHead) {
      segmentWidth = cellSize * 1.2;
      segmentHeight = cellSize * 1.1;
      left = baseLeft - cellSize * 0.1;
      top = baseTop - cellSize * 0.05;
    } else {
      const shrinkFactor = 1 - (progress * 0.3);
      segmentWidth = cellSize * shrinkFactor;
      segmentHeight = cellSize * shrinkFactor;
      left = baseLeft + (cellSize - segmentWidth) / 2;
      top = baseTop + (cellSize - segmentHeight) / 2;
    }

    const eyeOffset = cellSize * 0.25;
    const eyeSize = cellSize * 0.18;
    const pupilSize = cellSize * 0.08;

    return {
      position: 'absolute',
      left: `${left}px`,
      top: `${top}px`,
      width: `${segmentWidth}px`,
      height: `${segmentHeight}px`,
      background: isHead
        ? 'linear-gradient(145deg, #2d5a27 0%, #1a3d15 50%, #0d2610 100%)'
        : `linear-gradient(145deg, #3a7d32 ${100 - progress * 30}%, #2d5a27 ${100 - progress * 20}%, #1a3d15 100%)`,
      borderRadius: isHead
        ? '55% 45% 45% 55% / 50% 45% 55% 50%'
        : progress < 0.5 ? '45% 55% 55% 45% / 50% 55% 45% 50%' : '50% 50% 45% 55% / 55% 50% 50% 45%',
      boxShadow: isHead
        ? `inset 3px 3px 6px rgba(100,180,80,0.4), inset -2px -2px 4px rgba(0,0,0,0.6), 0 0 ${8 + progress * 5}px rgba(50,150,50,${0.6 - progress * 0.4})`
        : `inset 2px 2px 4px rgba(100,180,80,${0.3 - progress * 0.2}), inset -1px -1px 3px rgba(0,0,0,${0.4 + progress * 0.2}), 0 0 ${6 - progress * 3}px rgba(50,150,50,${0.5 - progress * 0.3})`,
      zIndex: isHead ? '10' : String(Math.ceil(total - index)),
      opacity: String(1 - progress * 0.15),
      transition: 'left 0.05s, top 0.05s, width 0.05s, height 0.05s',
    };
  }

  getHeadDetailsStyle(direction: Direction): { eyes: Record<string, string>, tongue: Record<string, string> } {
    const cellSize = this.config.cellSize;
    const eyeOffset = cellSize * 0.2;
    const eyeSize = cellSize * 0.22;
    const pupilSize = cellSize * 0.1;

    const eyes: Record<string, string> = {
      position: 'absolute',
      width: `${eyeSize * 2 + eyeOffset}px`,
      height: `${eyeSize}px`,
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      top: direction === 'UP' ? '15%' : direction === 'DOWN' ? 'auto' : '35%',
      bottom: direction === 'DOWN' ? '20%' : 'auto',
      left: direction === 'LEFT' ? 'auto' : direction === 'RIGHT' ? '15%' : '25%',
      right: direction === 'RIGHT' ? '15%' : direction === 'LEFT' ? 'auto' : '25%',
      transform: `rotate(${direction === 'UP' ? '0deg' : direction === 'DOWN' ? '180deg' : direction === 'LEFT' ? '-90deg' : '90deg'})`,
    };

    const tongue: Record<string, string> = {
      position: 'absolute',
      width: '3px',
      height: `${cellSize * 0.3}px`,
      background: 'linear-gradient(180deg, #cc3344 0%, #ff5566 50%, #ff7788 100%)',
      borderRadius: '2px',
      top: direction === 'UP' ? '85%' : direction === 'DOWN' ? 'auto' : '45%',
      bottom: direction === 'DOWN' ? '85%' : 'auto',
      left: direction === 'LEFT' ? 'auto' : direction === 'RIGHT' ? 'auto' : '50%',
      right: direction === 'RIGHT' ? '80%' : direction === 'LEFT' ? '80%' : 'auto',
      transform: `translateX(-50%) rotate(${direction === 'UP' ? '90deg' : direction === 'DOWN' ? '-90deg' : '0deg'})`,
      transformOrigin: 'top center',
    };

    return { eyes, tongue };
  }

  getFoodStyle(pos: Position): Record<string, string> {
    const cellSize = this.config.cellSize;

    return {
      position: 'absolute',
      left: `${pos.x * cellSize}px`,
      top: `${pos.y * cellSize}px`,
      width: `${cellSize}px`,
      height: `${cellSize}px`,
      background: 'radial-gradient(ellipse at 35% 35%, #ff6b4a 0%, #e53e2e 40%, #c62828 70%, #8b1a1a 100%)',
      borderRadius: '50% 48% 52% 50% / 48% 50% 50% 52%',
      boxShadow: `
        inset 3px 3px 8px rgba(255,200,150,0.5),
        inset -2px -2px 6px rgba(0,0,0,0.4),
        0 0 ${cellSize * 0.4}px rgba(255,80,50,0.7),
        0 0 ${cellSize * 0.8}px rgba(255,50,30,0.4)
      `,
      zIndex: '5',
    };
  }
}