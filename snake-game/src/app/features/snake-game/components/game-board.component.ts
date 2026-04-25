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
        <svg class="snake-body" [style.width.px]="snakeService.boardSize().width" [style.height.px]="snakeService.boardSize().height">
          <defs>
            <linearGradient id="snakeFill" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#ffcc00" />
              <stop offset="50%" stop-color="#ffb800" />
              <stop offset="100%" stop-color="#ff9500" />
            </linearGradient>
          </defs>
          <path
            [attr.d]="snakeService.snakePath()"
            fill="#1a1a1a"
            stroke="#1a1a1a"
            stroke-width="4"
          />
          <path
            [attr.d]="snakeService.snakePath()"
            fill="url(#snakeFill)"
            stroke="#1a1a1a"
            stroke-width="3"
          />
          @for (p of snakeService.patternMarkers(); track $i; let $i = $index) {
            <circle
              [attr.cx]="p.x"
              [attr.cy]="p.y"
              r="5"
              fill="#1a1a1a"
            />
            <circle
              [attr.cx]="p.x - 10"
              [attr.cy]="p.y - 8"
              r="3"
              fill="#1a1a1a"
            />
            <circle
              [attr.cx]="p.x + 10"
              [attr.cy]="p.y - 8"
              r="3"
              fill="#1a1a1a"
            />
          }
        </svg>

        <div
          class="snake-head"
          [class.is-biting]="snakeService.isEating()"
          [style]="snakeService.getHeadStyle()"
        >
          @if (snakeService.tongueOut()) {
            <span class="tongue">👅</span>
          }
        </div>
        
        <div 
          class="food" 
          [style.left.px]="snakeService.food().x * snakeService.getConfig().cellSize"
          [style.top.px]="snakeService.food().y * snakeService.getConfig().cellSize"
          [style.width.px]="snakeService.getConfig().cellSize"
          [style.height.px]="snakeService.getConfig().cellSize"
        ></div>
      </div>

      @if (snakeService.gameState() === 'IDLE') {
        <div class="overlay scene">
          <div class="newspaper-stack">
            <div class="paper paper-1"></div>
            <div class="paper paper-2"></div>
            <div class="paper paper-3"></div>
          </div>
          <div class="snake-coil">
            <svg viewBox="0 0 100 60" class="coil-svg">
              <ellipse cx="50" cy="50" rx="40" ry="8" fill="none" stroke="#1a1a1a" stroke-width="3"/>
              <ellipse cx="50" cy="42" rx="35" ry="7" fill="none" stroke="#1a1a1a" stroke-width="3"/>
              <ellipse cx="50" cy="35" rx="30" ry="6" fill="none" stroke="#1a1a1a" stroke-width="3"/>
              <ellipse cx="50" cy="29" rx="25" ry="5" fill="none" stroke="#1a1a1a" stroke-width="3"/>
              <circle cx="50" cy="20" r="12" fill="#ffcc00" stroke="#1a1a1a" stroke-width="2"/>
              <circle cx="45" cy="18" r="3" fill="#1a1a1a"/>
              <circle cx="55" cy="18" r="3" fill="#1a1a1a"/>
              <path d="M 43 25 Q 50 30 57 25" fill="none" stroke="#1a1a1a" stroke-width="2"/>
              <path d="M 46 26 L 48 24" stroke="#1a1a1a" stroke-width="1"/>
              <path d="M 54 26 L 52 24" stroke="#1a1a1a" stroke-width="1"/>
            </svg>
          </div>
          <div class="donut-half">
            <span>🍩</span>
          </div>
          <h2>🐍 Snake Simpsons</h2>
          <p>Presiona ESPACIO para despertar</p>
        </div>
      }

      @if (snakeService.gameState() === 'PAUSED') {
        <div class="overlay character-sheet">
          <h2>📜 Hoja de Personaje</h2>
          <div class="poses-container">
            <div class="pose-card">
              <svg viewBox="0 0 80 60" class="pose-svg">
                <circle cx="40" cy="25" r="18" fill="#ffcc00" stroke="#1a1a1a" stroke-width="2"/>
                <circle cx="34" cy="22" r="3" fill="#1a1a1a"/>
                <circle cx="46" cy="22" r="3" fill="#1a1a1a"/>
                <path d="M 30 32 Q 40 42 50 32" fill="none" stroke="#1a1a1a" stroke-width="2"/>
                <path d="M 38 30 L 36 26" stroke="#1a1a1a" stroke-width="1"/>
                <path d="M 42 30 L 44 26" stroke="#1a1a1a" stroke-width="1"/>
                <ellipse cx="40" cy="50" rx="15" ry="6" fill="#ffcc00" stroke="#1a1a1a" stroke-width="2"/>
              </svg>
              <p>😄 Sonriendo</p>
            </div>
            <div class="pose-card">
              <svg viewBox="0 0 80 60" class="pose-svg">
                <circle cx="40" cy="25" r="18" fill="#ffcc00" stroke="#1a1a1a" stroke-width="2"/>
                <path d="M 30 22 L 38 22" stroke="#1a1a1a" stroke-width="2"/>
                <path d="M 42 22 L 50 22" stroke="#1a1a1a" stroke-width="2"/>
                <path d="M 35 32 Q 40 35 45 32" fill="none" stroke="#1a1a1a" stroke-width="2"/>
                <text x="40" y="52" font-size="8" fill="#1a1a1a" text-anchor="middle">Z z z</text>
              </svg>
              <p>😴 Durmiendo</p>
            </div>
            <div class="pose-card">
              <svg viewBox="0 0 80 60" class="pose-svg">
                <circle cx="35" cy="20" r="16" fill="#ffcc00" stroke="#1a1a1a" stroke-width="2"/>
                <circle cx="29" cy="16" r="3" fill="#1a1a1a"/>
                <circle cx="41" cy="16" r="3" fill="#1a1a1a"/>
                <path d="M 26 10 L 32 14" stroke="#1a1a1a" stroke-width="1.5"/>
                <path d="M 44 10 L 38 14" stroke="#1a1a1a" stroke-width="1.5"/>
                <path d="M 25 26 L 35 24 L 45 26" fill="none" stroke="#1a1a1a" stroke-width="2"/>
                <text x="60" y="50" font-size="16">🍩</text>
                <path d="M 50 35 L 55 30 L 52 38" stroke="#1a1a1a" stroke-width="1.5" fill="none"/>
              </svg>
              <p>😠 Enfadado</p>
            </div>
          </div>
          <p class="instruction">Presiona ESPACIO para continuar</p>
        </div>
      }

      @if (snakeService.gameState() === 'GAME_OVER') {
        <div class="overlay scene game-over">
          <div class="snake-defeat">
            <svg viewBox="0 0 100 50" class="defeat-svg">
              <circle cx="50" cy="25" r="20" fill="#ffcc00" stroke="#1a1a1a" stroke-width="3"/>
              <circle cx="42" cy="22" r="4" fill="#1a1a1a"/>
              <circle cx="58" cy="22" r="4" fill="#1a1a1a"/>
              <ellipse cx="50" cy="35" rx="8" ry="5" fill="#1a1a1a"/>
              <path d="M 35 15 Q 30 5 40 10" fill="none" stroke="#1a1a1a" stroke-width="2"/>
              <path d="M 65 15 Q 70 5 60 10" fill="none" stroke="#1a1a1a" stroke-width="2"/>
            </svg>
          </div>
          <h2>💀¡Maldición!</h2>
          <p>Puntuación: {{ snakeService.score() }}</p>
          <p class="sarcastic">[La serpiente te mirará con desprecio]</p>
          <button (click)="snakeService.initGame()">¡Intentar de Nuevo!</button>
        </div>
      }
    </div>
  `,
  styles: [`
    :host {
      --bg-primary: #f5f5dc;
      --text-primary: #1a1a1a;
      --accent-green: #ffcc00;
    }

    .game-container {
      background: var(--bg-primary);
    }

    .score { color: #ff6b6b; }
    .high-score { color: #1a1a1a; }
    .world-record { color: #ff4757; }

    .world-record.achieved {
      animation: pulse 0.5s infinite;
    }

    @keyframes pulse {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.1); }
    }

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

    .snake-body {
      position: absolute;
      top: 0;
      left: 0;
      pointer-events: none;
      z-index: 5;
    }

    .snake-head {
      position: absolute;
      width: 42px;
      height: 36px;
      z-index: 10;
      border-radius: 50%;
      background: #ffcc00;
      border: 3px solid #1a1a1a;
      box-shadow: inset 0 -5px 0 rgba(0,0,0,0.15);
    }

    .snake-head.is-biting {
      animation: bite 0.1s ease-in-out infinite alternate;
    }

    @keyframes bite {
      0% { transform: scale(1.2); }
      100% { transform: scale(1.35); }
    }

    .snake-head::before,
    .snake-head::after {
      content: '';
      position: absolute;
      top: 8px;
      width: 16px;
      height: 16px;
      background: radial-gradient(circle at 50% 50%, #1a1a1a 1.5px, #fff 1.5px, #fff 14px, #1a1a1a 14px);
      border-radius: 50%;
      z-index: 15;
      animation: lookAround 2s ease-in-out infinite alternate;
    }

    @keyframes lookAround {
      0% { transform: translate(-3px, 0); }
      50% { transform: translate(3px, 0); }
      100% { transform: translate(-3px, 0); }
    }

    .snake-head::before { left: 3px; }
    .snake-head::after { right: 3px; }

    .snake-head .tongue {
      position: absolute;
      bottom: -10px;
      left: 50%;
      transform: translateX(-50%);
      font-size: 14px;
      z-index: 20;
      animation: tongueWag 0.12s infinite alternate;
      filter: drop-shadow(1px 1px 0 #1a1a1a);
    }

    @keyframes tongueWag {
      0% { transform: translateX(-50%) rotate(-25deg); }
      100% { transform: translateX(-50%) rotate(25deg); }
    }

    .food {
      position: absolute;
      display: flex;
      align-items: center;
      justify-content: center;
      animation: float 0.6s infinite alternate cubic-bezier(0.68, -0.55, 0.27, 1.55);
    }

    .food::after {
      content: '🍩';
      font-size: 22px;
      filter: drop-shadow(2px 2px 0 #1a1a1a);
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
      background: rgba(255, 255, 255, 0.95);
      padding: 2rem 4rem;
      border-radius: 8px;
      text-align: center;
      box-shadow: 0 0 20px rgba(0,0,0,0.5);
      border: 3px solid #1a1a1a;
    }

    .overlay h2 {
      margin: 0 0 1rem;
      color: #ffcc00;
      font-size: 2.5rem;
      text-shadow: 0 0 10px rgba(255, 204, 0, 0.5), 2px 2px 0 #1a1a1a;
    }

    .overlay.scene {
      background: linear-gradient(to bottom, #87CEEB 0%, #98D8C8 100%);
      border: 4px solid #1a1a1a;
      padding: 3rem 4rem;
      min-width: 400px;
    }

    .scene .newspaper-stack {
      position: absolute;
      bottom: 20px;
      left: 30px;
      z-index: 5;
    }

    .scene .paper {
      width: 60px;
      height: 8px;
      background: #f5f5dc;
      border: 1px solid #ccc;
      border-radius: 2px;
      position: absolute;
    }

    .scene .paper-1 { bottom: 0; transform: rotate(-5deg); }
    .scene .paper-2 { bottom: 6px; transform: rotate(2deg); }
    .scene .paper-3 { bottom: 12px; transform: rotate(-3deg); }

    .scene .snake-coil {
      position: absolute;
      bottom: 25px;
      right: 40px;
    }

    .scene .coil-svg {
      width: 120px;
      height: 80px;
    }

    .scene .donut-half {
      position: absolute;
      bottom: 45px;
      left: 100px;
      font-size: 28px;
      animation: donutWobble 1s ease-in-out infinite alternate;
      filter: drop-shadow(2px 2px 0 #1a1a1a);
    }

    @keyframes donutWobble {
      0% { transform: rotate(-10deg); }
      100% { transform: rotate(10deg); }
    }

    .overlay.scene.game-over {
      background: linear-gradient(to bottom, #ff6b6b 0%, #ff4757 100%);
      border: 4px solid #1a1a1a;
      padding-top: 3.5rem;
    }

    .game-over .snake-defeat {
      position: absolute;
      top: -30px;
      left: 50%;
      transform: translateX(-50%);
    }

    .game-over .defeat-svg {
      width: 80px;
      height: 50px;
    }

    .game-over h2 {
      margin-top: 40px;
      color: #ffcc00;
      text-shadow: 2px 2px 0 #1a1a1a;
      animation: shake 0.5s infinite;
    }

    @keyframes shake {
      0%, 100% { transform: rotate(-2deg); }
      50% { transform: rotate(2deg); }
    }

    .game-over .sarcastic {
      font-style: italic;
      color: #333;
      font-size: 0.9rem;
      margin: 1rem 0;
    }

    .game-over button {
      background: #ffcc00;
      border: 3px solid #1a1a1a;
      box-shadow: 3px 3px 0 #1a1a1a;
    }

    .game-over button:hover {
      background: #ffe066;
    }

    .game-over button:active {
      box-shadow: 1px 1px 0 #1a1a1a;
      transform: translate(2px, 2px);
    }

    .character-sheet {
      background: linear-gradient(to bottom, #f0f0f0 0%, #d0d0d0 100%);
      border: 4px solid #1a1a1a;
      padding: 2rem;
      min-width: 500px;
    }

    .character-sheet h2 {
      color: #1a1a1a;
      text-shadow: none;
      font-size: 1.8rem;
      margin-bottom: 1.5rem;
    }

    .poses-container {
      display: flex;
      gap: 1.5rem;
      justify-content: center;
      margin: 1.5rem 0;
    }

    .pose-card {
      text-align: center;
      padding: 1rem;
      background: #fff;
      border: 2px solid #1a1a1a;
      border-radius: 8px;
    }

    .pose-svg {
      width: 80px;
      height: 60px;
    }

    .pose-card p {
      margin: 0.5rem 0 0;
      font-weight: bold;
      color: #1a1a1a;
    }

    .character-sheet .instruction {
      color: #666;
      font-size: 0.9rem;
      margin-top: 1rem;
    }

    button {
      margin-top: 1rem;
      padding: 0.75rem 2rem;
      font-size: 1.1rem;
      background: #ffcc00;
      border: 3px solid #1a1a1a;
      border-radius: 0;
      color: #1a1a1a;
      font-weight: bold;
      cursor: pointer;
      font-family: sans-serif;
      box-shadow: 3px 3px 0 #1a1a1a;
    }

    button:hover {
      background: #ffe066;
    }

    button:active {
      box-shadow: 1px 1px 0 #1a1a1a;
      transform: translate(2px, 2px);
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