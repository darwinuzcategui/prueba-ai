import { Component, inject, HostListener, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SnakeService, WORLD_RECORD } from '../../../core/services/snake.service';
import { Direction } from '../models/snake.model';

interface ConfettiPiece {
  id: number;
  x: number;
  y: number;
  color: string;
  rotation: number;
  size: number;
}

@Component({
  selector: 'app-game-board',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="game-container">
      <div class="game-header">
        <div class="score">Score: {{ snakeService.score() }}</div>
        <div class="high-score">High Score: {{ snakeService.highScore() }}</div>
        <div class="world-record" [class.achieved]="snakeService.score() >= WORLD_RECORD">
          🏆 World Record: {{ snakeService.worldRecord() }}
        </div>
      </div>

      @if (snakeService.showConfetti()) {
        <div class="confetti-container">
          @for (piece of confetti(); track piece.id) {
            <div
              class="confetti-piece"
              [style.left.%]="piece.x"
              [style.top.%]="piece.y"
              [style.background]="piece.color"
              [style.transform]="'rotate(' + piece.rotation + 'deg)'"
              [style.width.px]="piece.size"
              [style.height.px]="piece.size * 0.6"
            ></div>
          }
        </div>
        <div class="confetti-message">🎉 NEW WORLD RECORD! 🎉</div>
      }

      <div
        class="board"
        [style.width.px]="snakeService.boardSize().width"
        [style.height.px]="snakeService.boardSize().height"
      >
        @for (segment of snakeService.snake(); track $index; let last = $last) {
          <div
            class="snake-segment"
            [style]="snakeService.getSnakeSegmentStyle(segment, $index, snakeService.snake().length)"
            [class.head]="$index === 0"
            [class.body]="$index > 0"
          >
            @if ($index === 0) {
              <div class="snake-eyes" [class]="getEyesClass()"></div>
            }
          </div>
        }
        <div
          class="food"
          [style]="getFoodStyle()"
        >
          <div class="food-shine"></div>
        </div>
      </div>

      @if (snakeService.gameState() === 'IDLE') {
        <div class="overlay">
          <h2>🐍 Snake Game</h2>
          <p>Press SPACE or click to start</p>
          <div class="controls-info">
            <span>↑↓←→ or WASD to move</span>
          </div>
          <div class="world-record-info">
            🏆 Beat {{ WORLD_RECORD }} points to set a world record!
          </div>
        </div>
      }

      @if (snakeService.gameState() === 'PAUSED') {
        <div class="overlay">
          <h2>⏸️ Paused</h2>
          <p>Press SPACE to continue</p>
        </div>
      }

      @if (snakeService.gameState() === 'GAME_OVER') {
        <div class="overlay game-over">
          <h2>💀 Game Over</h2>
          <p>Score: {{ snakeService.score() }}</p>
          @if (snakeService.score() >= WORLD_RECORD) {
            <p class="new-record">🏆 NEW WORLD RECORD!</p>
          }
          <button (click)="snakeService.initGame()">Play Again</button>
        </div>
      }

      <div class="instructions">
        <span>SPACE: Start/Pause</span>
        <span>Arrow Keys or WASD: Move</span>
      </div>
    </div>
  `,
  styles: [`
    .game-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1rem;
      padding: 2rem;
      position: relative;
    }

    .game-header {
      display: flex;
      justify-content: space-between;
      width: 100%;
      max-width: 500px;
      font-size: 1.25rem;
      font-weight: bold;
    }

    .score { color: #4ade80; }
    .high-score { color: #fbbf24; }
    .world-record { color: #a855f7; }
    .world-record.achieied { color: #f472b6; text-shadow: 0 0 10px #f472b6; }

    .confetti-container {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 1000;
      overflow: hidden;
    }

    .confetti-piece {
      position: absolute;
      border-radius: 2px;
      animation: confetti-fall 3s ease-out forwards;
    }

    @keyframes confetti-fall {
      0% {
        transform: translateY(-100vh) rotate(0deg);
        opacity: 1;
      }
      100% {
        transform: translateY(100vh) rotate(720deg);
        opacity: 0;
      }
    }

    .confetti-message {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      font-size: 3rem;
      font-weight: bold;
      color: #fbbf24;
      text-shadow: 0 0 30px rgba(251, 191, 36, 0.8), 0 0 60px rgba(251, 191, 36, 0.4);
      animation: pulse 0.5s ease-in-out infinite alternate;
      z-index: 1001;
    }

    @keyframes pulse {
      from { transform: translate(-50%, -50%) scale(1); }
      to { transform: translate(-50%, -50%) scale(1.1); }
    }

    .board {
      position: relative;
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
      border: 4px solid #4ade80;
      border-radius: 8px;
      box-shadow: 0 0 30px rgba(74, 222, 128, 0.3);
    }

    .snake-segment {
      position: absolute;
      transition: all 0.05s ease;
      display: flex;
      justify-content: center;
      align-items: center;
    }

    .snake-segment.body {
      background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
      box-shadow: 0 0 8px rgba(34, 197, 94, 0.4),
                  inset 0 1px 2px rgba(255,255,255,0.2),
                  inset 0 -1px 2px rgba(0,0,0,0.2);
    }

    .snake-segment.head {
      background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
      box-shadow: 0 0 15px rgba(34, 197, 94, 0.8),
                  inset 0 2px 4px rgba(255,255,255,0.3),
                  inset 0 -2px 4px rgba(0,0,0,0.3);
    }

    .snake-eyes {
      display: flex;
      gap: 4px;
      position: absolute;
      top: 20%;
    }

    .snake-eyes.up { flex-direction: row; top: 20%; }
    .snake-eyes.down { flex-direction: row; top: auto; bottom: 20%; }
    .snake-eyes.left { flex-direction: column; left: 20%; }
    .snake-eyes.right { flex-direction: column; left: auto; right: 20%; }

    .snake-eyes::before,
    .snake-eyes::after {
      content: '';
      width: 4px;
      height: 4px;
      background: #000;
      border-radius: 50%;
      box-shadow: 0 0 2px rgba(255,255,255,0.5);
    }

    .food {
      position: absolute;
      background: radial-gradient(circle at 30% 30%, #ff6b6b, #ef4444, #dc2626);
      border-radius: 50%;
      box-shadow: 0 0 20px rgba(239, 68, 68, 0.8), inset 0 -3px 6px rgba(0,0,0,0.3);
      display: flex;
      justify-content: center;
      align-items: center;
      overflow: hidden;
    }

    .food-shine {
      position: absolute;
      width: 30%;
      height: 30%;
      background: rgba(255, 255, 255, 0.6);
      border-radius: 50%;
      top: 15%;
      left: 15%;
    }

    .overlay {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      background: rgba(0, 0, 0, 0.85);
      border-radius: 8px;
      color: white;
      text-align: center;
    }

    .overlay h2 { margin: 0 0 1rem; font-size: 2rem; }
    .overlay p { margin: 0.5rem 0; }
    .overlay .new-record { color: #fbbf24; font-size: 1.5rem; font-weight: bold; }
    .overlay button {
      margin-top: 1rem;
      padding: 0.75rem 2rem;
      font-size: 1rem;
      background: #4ade80;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      transition: transform 0.1s;
    }
    .overlay button:hover { transform: scale(1.05); }

    .controls-info, .world-record-info {
      margin-top: 1rem;
      font-size: 0.875rem;
      color: #9ca3af;
    }

    .world-record-info {
      color: #a855f7;
      font-weight: bold;
    }

    .instructions {
      display: flex;
      gap: 2rem;
      color: #6b7280;
      font-size: 0.875rem;
    }
  `]
})
export class GameBoardComponent {
  readonly snakeService = inject(SnakeService);
  readonly WORLD_RECORD = WORLD_RECORD;
  readonly confetti = signal<ConfettiPiece[]>([]);

  private confettiColors = ['#4ade80', '#fbbf24', '#ef4444', '#3b82f6', '#a855f7', '#ec4899', '#22c55e'];

  constructor() {
    effect(() => {
      if (this.snakeService.showConfetti()) {
        this.generateConfetti();
      }
    });
  }

  generateConfetti(): void {
    const pieces: ConfettiPiece[] = [];
    for (let i = 0; i < 150; i++) {
      pieces.push({
        id: i,
        x: Math.random() * 100,
        y: -10 - Math.random() * 20,
        color: this.confettiColors[Math.floor(Math.random() * this.confettiColors.length)],
        rotation: Math.random() * 360,
        size: 8 + Math.random() * 8,
      });
    }
    this.confetti.set(pieces);
    setTimeout(() => this.confetti.set([]), 4000);
  }

  getEyesClass(): string {
    const dir = this.snakeService.direction();
    const classMap: Record<Direction, string> = {
      UP: 'up',
      DOWN: 'down',
      LEFT: 'left',
      RIGHT: 'right',
    };
    return classMap[dir];
  }

  getFoodStyle(): Record<string, string> {
    const food = this.snakeService.food();
    return this.snakeService.getCellStyle(food, false);
  }

  @HostListener('window:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    const keyMap: Record<string, Direction> = {
      ArrowUp: 'UP', ArrowDown: 'DOWN', ArrowLeft: 'LEFT', ArrowRight: 'RIGHT',
      w: 'UP', s: 'DOWN', a: 'LEFT', d: 'RIGHT',
      W: 'UP', S: 'DOWN', A: 'LEFT', D: 'RIGHT',
    };

    if (event.code === 'Space') {
      event.preventDefault();
      this.handleSpace();
      return;
    }

    const dir = keyMap[event.key];
    if (dir) {
      event.preventDefault();
      this.snakeService.setDirection(dir);
    }
  }

  private handleSpace(): void {
    switch (this.snakeService.gameState()) {
      case 'IDLE':
        this.snakeService.initGame();
        break;
      case 'PLAYING':
        this.snakeService.pause();
        break;
      case 'PAUSED':
        this.snakeService.resume();
        break;
      case 'GAME_OVER':
        this.snakeService.initGame();
        break;
    }
  }
}