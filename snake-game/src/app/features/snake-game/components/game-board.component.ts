import { Component, inject, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SnakeService } from '../../../core/services/snake.service';
import { Direction } from '../models/snake.model';

@Component({
  selector: 'app-game-board',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="game-container">
      <div class="game-header">
        <div class="score">Score: {{ snakeService.score() }}</div>
        <div class="high-score">High Score: {{ snakeService.highScore() }}</div>
      </div>

      <div class="board" [style.width.px]="snakeService.boardSize().width" [style.height.px]="snakeService.boardSize().height">
        @for (segment of snakeService.snake(); track $index) {
          <div class="snake-segment" [style]="snakeService.getCellStyle(segment)"
               [class.head]="$index === 0"></div>
        }
        <div class="food" [style]="snakeService.getCellStyle(snakeService.food())"></div>
      </div>

      @if (snakeService.gameState() === 'IDLE') {
        <div class="overlay">
          <h2>🐍 Snake Game</h2>
          <p>Press SPACE or click to start</p>
          <div class="controls-info">
            <span>↑↓←→ or WASD to move</span>
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
          <button (click)="snakeService.initGame()">Play Again</button>
        </div>
      }
    </div>
  `,
  styles: [`
    .game-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1rem;
      padding: 2rem;
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

    .board {
      position: relative;
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
      border: 4px solid #4ade80;
      border-radius: 8px;
      box-shadow: 0 0 30px rgba(74, 222, 128, 0.3);
    }

    .snake-segment {
      position: absolute;
      background: linear-gradient(135deg, #4ade80 0%, #22c55e 100%);
      border-radius: 4px;
      transition: all 0.05s ease;
    }

    .snake-segment.head {
      background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
      box-shadow: 0 0 10px rgba(34, 197, 94, 0.6);
    }

    .food {
      position: absolute;
      background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
      border-radius: 50%;
      box-shadow: 0 0 15px rgba(239, 68, 68, 0.6);
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

    .controls-info {
      margin-top: 1rem;
      font-size: 0.875rem;
      color: #9ca3af;
    }
  `]
})
export class GameBoardComponent {
  readonly snakeService = inject(SnakeService);

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