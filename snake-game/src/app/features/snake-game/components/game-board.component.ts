import { Component, inject, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SnakeService } from '../../../core/services/snake.service';
import { ThemeService } from '../../../core/services/theme.service';

@Component({
  selector: 'app-game-board',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="game-container">
      <div class="game-header">
        <div class="score">Score: {{ snakeService.score() }}</div>
        <div class="high-score">🏆 Best: {{ snakeService.highScore() }}</div>
        <div class="world-record" [class.achieved]="snakeService.score() >= snakeService.worldRecord()">
          🌍 Record: {{ snakeService.worldRecord() }}
        </div>
      </div>

      <div
        class="board"
        [style.width.px]="snakeService.boardSize().width"
        [style.height.px]="snakeService.boardSize().height"
        [style.background-size]="snakeService.getConfig().cellSize + 'px ' + snakeService.getConfig().cellSize + 'px, ' + snakeService.getConfig().cellSize + 'px ' + snakeService.getConfig().cellSize + 'px, 100% 100%'"
      >
        @for (segment of snakeService.snake(); track $index) {
          <div
            class="snake-part"
            [class.is-head]="$first"
            [class.is-tail]="$last && snakeService.snake().length > 1"
            [class.is-biting]="$first && snakeService.isEating()"
            [style]="snakeService.getSnakePartStyle(segment, $index, snakeService.snake().length)"
          ></div>
        }
        
        <div 
          class="food" 
          [style.left.px]="snakeService.food().x * snakeService.getConfig().cellSize"
          [style.top.px]="snakeService.food().y * snakeService.getConfig().cellSize"
          [style.width.px]="snakeService.getConfig().cellSize"
          [style.height.px]="snakeService.getConfig().cellSize"
        ></div>
      </div>

      @if (snakeService.gameState() === 'IDLE') {
        <div class="overlay">
          <h2>🐍 Photoreal Snake</h2>
          <p>Presiona ESPACIO para comenzar</p>
        </div>
      }

      @if (snakeService.gameState() === 'PAUSED') {
        <div class="overlay">
          <h2>⏸️ Pausado</h2>
          <p>Presiona ESPACIO para continuar</p>
        </div>
      }

      @if (snakeService.gameState() === 'GAME_OVER') {
        <div class="overlay game-over">
          <h2>💀 Devorado</h2>
          <p>Puntuación: {{ snakeService.score() }}</p>
          <button (click)="snakeService.initGame()">Jugar de Nuevo</button>
        </div>
      }
    </div>
  `,
  styles: [`
    :host {
      --bg-primary: #1a1a2e;
      --text-primary: #ffffff;
      --accent-green: #4ade80;
    }

    .game-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 2rem;
      background: var(--bg-primary);
      min-height: 100vh;
      color: var(--text-primary);
      font-family: sans-serif;
    }

    .game-header {
      display: flex;
      gap: 2rem;
      font-size: 1.2rem;
      font-weight: bold;
      margin-bottom: 2rem;
    }

    .score { color: #4ade80; }
    .high-score { color: #fbbf24; }
    .world-record { color: #a855f7; }

    .board {
      position: relative;
      /* Modern wooden board with subtle grid, maintaining a light base for sprite blending */
      background-image: 
        linear-gradient(to right, rgba(0, 0, 0, 0.08) 1px, transparent 1px),
        linear-gradient(to bottom, rgba(0, 0, 0, 0.08) 1px, transparent 1px),
        radial-gradient(circle at center, #f4e8d1 0%, #d8c3a5 100%);
      background-color: #eaddca;
      border: 8px solid #4a3728; /* Wood-like border */
      border-radius: 12px;
      box-shadow: 
        0 25px 50px -12px rgba(0, 0, 0, 0.5), /* Outer drop shadow */
        inset 0 0 20px rgba(0, 0, 0, 0.2), /* Inner ambient shadow */
        inset 0 0 3px rgba(255, 255, 255, 0.6); /* Inner edge highlight */
      overflow: hidden;
    }

    .snake-part {
      position: absolute;
      background-color: #2ed573; /* Vibrant green */
      /* Scale pattern using radial gradients */
      background-image: radial-gradient(circle at center, rgba(255,255,255,0.3) 2px, transparent 3px);
      background-size: 8px 8px;
      border: 3px solid #2f3542; /* Comic contour */
      box-shadow: inset -4px -4px 0 rgba(0,0,0,0.2), 0 4px 6px rgba(0,0,0,0.3); /* Cel-shading depth */
      transition: left 0.05s linear, top 0.05s linear;
      border-radius: 50%;
      z-index: 10;
    }

    .snake-part.is-head {
      background: #1dd1a1 !important; /* Base color overrides the inline gradient */
      /* Cute tiny nose (nostrils) right between the eyes */
      background-image: 
        radial-gradient(circle at 42% 25%, #2f3542 1px, transparent 1.5px),
        radial-gradient(circle at 58% 25%, #2f3542 1px, transparent 1.5px) !important;
      border-radius: 35% 35% 50% 50% !important; /* Shaped head */
      z-index: 20;
    }

    /* Adorable expressive little eyes */
    .snake-part.is-head::before,
    .snake-part.is-head::after {
      content: '';
      position: absolute;
      top: 6px;
      width: 8px;
      height: 8px;
      background-color: #fff; /* White sclera */
      background-image: 
        radial-gradient(circle at 2.5px 2.5px, #fff 1.5px, transparent 2px), /* Main sparkle */
        radial-gradient(circle at 6px 6px, #fff 0.5px, transparent 1px), /* Secondary sparkle */
        radial-gradient(circle at 4px 4.5px, #1e272e 3px, transparent 3.5px); /* Pupil */
      border: 1.5px solid #2f3542;
      border-radius: 50%;
      box-shadow: 0 1px 0 rgba(0,0,0,0.15);
    }
    
    .snake-part.is-head::before { left: -1px; }
    .snake-part.is-head::after { right: -1px; }

    .snake-part.is-head.is-biting {
      transform: scale(1.3) !important;
      background-color: #1dd1a1 !important; /* Keep cute color */
      /* Adorable open mouth with teeth, PLUS the cute nose */
      background-image: 
        radial-gradient(circle at 42% 25%, #2f3542 1px, transparent 1.5px), /* Left nostril */
        radial-gradient(circle at 58% 25%, #2f3542 1px, transparent 1.5px), /* Right nostril */
        radial-gradient(circle at 35% 5%, #fff 1.5px, transparent 2px), /* Left tooth */
        radial-gradient(circle at 65% 5%, #fff 1.5px, transparent 2px), /* Right tooth */
        radial-gradient(ellipse at 50% 8%, #ff6b81 8px, transparent 9px) !important; /* Pink mouth at the very front */
      box-shadow: inset -4px -4px 0 rgba(0,0,0,0.2), 0 6px 12px rgba(0,0,0,0.4) !important;
    }

    /* Keep eyes cute when biting */
    .snake-part.is-head.is-biting::before,
    .snake-part.is-head.is-biting::after {
      top: 8px !important;
    }

    .snake-part.is-tail {
      background: none !important; /* No gradient */
      background-color: #00ff00 !important; /* Super bright green */
      border: none !important; /* Remove comic border to allow crisp triangle clipping */
      border-radius: 0 !important;
      clip-path: polygon(50% 100%, 10% 0, 90% 0) !important; /* Pointy trailing triangle */
      box-shadow: none !important;
      /* Simulate the comic contour on the clipped shape */
      filter: drop-shadow(0 2px 0 #2f3542) drop-shadow(0 -2px 0 #2f3542) drop-shadow(2px 0 0 #2f3542) drop-shadow(-2px 0 0 #2f3542) !important;
    }

    .food {
      position: absolute;
      display: flex;
      align-items: center;
      justify-content: center;
      animation: float 0.6s infinite alternate cubic-bezier(0.68, -0.55, 0.27, 1.55);
    }

    .food::after {
      content: '🍎';
      font-size: 24px;
      filter: drop-shadow(0 4px 2px rgba(0,0,0,0.4));
    }

    @keyframes float {
      0% { transform: translateY(0px) scale(0.9); }
      100% { transform: translateY(-6px) scale(1.1); }
    }

    .overlay {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: rgba(0, 0, 0, 0.85);
      padding: 2rem 4rem;
      border-radius: 12px;
      text-align: center;
      box-shadow: 0 0 30px rgba(0,0,0,0.8);
      border: 2px solid var(--accent-green);
    }

    .overlay h2 {
      margin: 0 0 1rem;
      color: var(--accent-green);
      font-size: 2.5rem;
      text-shadow: 0 0 10px rgba(74, 222, 128, 0.5);
    }

    button {
      margin-top: 1rem;
      padding: 0.75rem 2rem;
      font-size: 1.1rem;
      background: var(--accent-green);
      border: none;
      border-radius: 6px;
      color: #000;
      font-weight: bold;
      cursor: pointer;
    }
  `]
})
export class GameBoardComponent {
  snakeService = inject(SnakeService);
  themeService = inject(ThemeService);

  @HostListener('window:keydown', ['$event'])
  handleKeyDown(event: KeyboardEvent) {
    if (event.code === 'Space') {
      const state = this.snakeService.gameState();
      if (state === 'IDLE' || state === 'GAME_OVER') {
        this.snakeService.initGame();
      } else if (state === 'PLAYING') {
        this.snakeService.pause();
      } else if (state === 'PAUSED') {
        this.snakeService.resume();
      }
      event.preventDefault();
      return;
    }

    if (this.snakeService.gameState() !== 'PLAYING') return;

    switch (event.key) {
      case 'ArrowUp': case 'w': case 'W': this.snakeService.setDirection('UP'); break;
      case 'ArrowDown': case 's': case 'S': this.snakeService.setDirection('DOWN'); break;
      case 'ArrowLeft': case 'a': case 'A': this.snakeService.setDirection('LEFT'); break;
      case 'ArrowRight': case 'd': case 'D': this.snakeService.setDirection('RIGHT'); break;
    }
  }
}