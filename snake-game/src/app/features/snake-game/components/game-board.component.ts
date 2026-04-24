import { Component, inject, HostListener, signal, effect, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SnakeService } from '../../../core/services/snake.service';
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
  imports: [CommonModule, FormsModule],
  template: `
    <div class="game-container">
      @if (showSettings()) {
        <div class="settings-panel">
          <h2>⚙️ Configuración</h2>
          <div class="setting-item">
            <label>Record Mundial:</label>
            <input
              type="number"
              [(ngModel)]="worldRecordInput"
              min="100"
              max="10000"
              step="100"
            />
          </div>
          <div class="setting-item">
            <label>Velocidad (ms):</label>
            <input
              type="number"
              [(ngModel)]="speedInput"
              min="50"
              max="500"
              step="10"
            />
          </div>
          <button class="btn-primary" (click)="applySettings()">Aplicar</button>
          <button class="btn-secondary" (click)="showSettings.set(false)">Cerrar</button>
        </div>
      }

      <div class="game-header">
        <div class="score">Score: {{ snakeService.score() }}</div>
        <div class="high-score">🏆 Best: {{ snakeService.highScore() }}</div>
        <div class="world-record" [class.achieved]="snakeService.score() >= snakeService.worldRecord()">
          🌍 Record: {{ snakeService.worldRecord() }}
        </div>
        <button class="settings-btn" (click)="showSettings.set(true)">⚙️</button>
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
        <div class="confetti-message">🎉 NUEVO RECORD MUNDIAL! 🎉</div>
      }

      <div
        class="board"
        [style.width.px]="snakeService.boardSize().width"
        [style.height.px]="snakeService.boardSize().height"
      >
        @for (segment of snakeService.snake(); track $index) {
          <div
            class="snake-segment"
            [style]="snakeService.getSnakeSegmentStyle(segment, $index, snakeService.snake().length)"
          >
            @if ($index === 0) {
              <div class="snake-head-details">
                <div class="eyes" [class]="getEyesClass()">
                  <div class="eye left-eye">
                    <div class="pupil"></div>
                  </div>
                  <div class="eye right-eye">
                    <div class="pupil"></div>
                  </div>
                </div>
                <div class="tongue" [class]="getTongueClass()"></div>
                <div class="scales"></div>
              </div>
            }
          </div>
        }
        <div
          class="food"
          [style]="snakeService.getFoodStyle(snakeService.food())"
        ></div>
      </div>

      @if (snakeService.gameState() === 'IDLE') {
        <div class="overlay">
          <h2>🐍 Snake Game</h2>
          <p>Presiona ESPACIO o clic para comenzar</p>
          <div class="controls-info">
            <span>↑↓←→ o WASD para mover</span>
          </div>
          <div class="world-record-info">
            🌍 Alcanza {{ snakeService.worldRecord() }} puntos para ser récord mundial!
          </div>
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
          <h2>💀 Game Over</h2>
          <p>Puntuación: {{ snakeService.score() }}</p>
          @if (snakeService.score() >= snakeService.worldRecord()) {
            <p class="new-record">🌍 NUEVO RECORD MUNDIAL!</p>
          }
          <button (click)="snakeService.initGame()">Jugar de Nuevo</button>
        </div>
      }

      <div class="instructions">
        <span>ESPACIO: Iniciar/Pausar</span>
        <span>Flechas o WASD: Mover</span>
        <span>⚙️: Configuración</span>
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

    .settings-panel {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: linear-gradient(145deg, #1a1a2e 0%, #16213e 100%);
      border: 2px solid #4ade80;
      border-radius: 12px;
      padding: 2rem;
      z-index: 100;
      box-shadow: 0 0 30px rgba(74, 222, 128, 0.3);
      min-width: 300px;
    }

    .settings-panel h2 {
      text-align: center;
      margin-bottom: 1.5rem;
      color: #4ade80;
    }

    .setting-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
      gap: 1rem;
    }

    .setting-item label {
      color: #ccc;
      font-size: 0.9rem;
    }

    .setting-item input {
      width: 120px;
      padding: 0.5rem;
      border: 1px solid #4ade80;
      border-radius: 4px;
      background: #0f0f1a;
      color: white;
      text-align: center;
      font-size: 1rem;
    }

    .setting-item input:focus {
      outline: none;
      border-color: #22c55e;
      box-shadow: 0 0 10px rgba(74, 222, 128, 0.3);
    }

    .btn-primary {
      width: 100%;
      padding: 0.75rem;
      margin-top: 0.5rem;
      background: #4ade80;
      border: none;
      border-radius: 6px;
      color: #0f0f1a;
      font-weight: bold;
      cursor: pointer;
      transition: transform 0.1s;
    }

    .btn-primary:hover { transform: scale(1.02); }

    .btn-secondary {
      width: 100%;
      padding: 0.5rem;
      margin-top: 0.5rem;
      background: transparent;
      border: 1px solid #6b7280;
      border-radius: 6px;
      color: #9ca3af;
      cursor: pointer;
      transition: all 0.2s;
    }

    .btn-secondary:hover {
      border-color: #9ca3af;
      color: #ccc;
    }

    .game-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      width: 100%;
      max-width: 500px;
      font-size: 1.1rem;
      font-weight: bold;
      gap: 1rem;
    }

    .score { color: #4ade80; }
    .high-score { color: #fbbf24; }
    .world-record { color: #a855f7; }
    .world-record.achieved {
      color: #f472b6;
      text-shadow: 0 0 10px #f472b6;
      animation: pulse 0.5s ease-in-out infinite alternate;
    }

    .settings-btn {
      background: transparent;
      border: 2px solid #6b7280;
      border-radius: 50%;
      width: 40px;
      height: 40px;
      font-size: 1.2rem;
      cursor: pointer;
      transition: all 0.2s;
    }

    .settings-btn:hover {
      border-color: #4ade80;
      color: #4ade80;
    }

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
      font-size: 2.5rem;
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
      background:
        radial-gradient(ellipse at center, #1a2a3a 0%, #0f1922 100%),
        linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
      border: 4px solid #2d5a27;
      border-radius: 8px;
      box-shadow:
        0 0 30px rgba(45, 90, 39, 0.5),
        inset 0 0 60px rgba(0, 0, 0, 0.5);
    }

    .snake-segment {
      transition: all 0.05s ease;
    }

    .snake-head-details {
      position: absolute;
      width: 100%;
      height: 100%;
      pointer-events: none;
    }

    .eyes {
      position: absolute;
      display: flex;
      justify-content: space-between;
      width: 60%;
      height: 30%;
      top: 20%;
      left: 20%;
    }

    .eyes.up { top: 15%; flex-direction: row; }
    .eyes.down { top: auto; bottom: 15%; flex-direction: row; }
    .eyes.left { top: 25%; left: 15%; flex-direction: column; width: 30%; height: 50%; }
    .eyes.right { top: 25%; left: auto; right: 15%; flex-direction: column; width: 30%; height: 50%; }

    .eye {
      background: radial-gradient(circle at 50% 50%, #f5f5dc 0%, #e8dcc8 60%, #c9b896 100%);
      border-radius: 50%;
      box-shadow:
        inset 2px 2px 4px rgba(255,255,255,0.5),
        inset -1px -1px 3px rgba(0,0,0,0.3),
        0 0 3px rgba(0,0,0,0.5);
      display: flex;
      justify-content: center;
      align-items: center;
    }

    .eyes.up .eye, .eyes.down .eye {
      width: 40%;
      height: 100%;
    }

    .eyes.left .eye, .eyes.right .eye {
      width: 100%;
      height: 40%;
    }

    .pupil {
      background: radial-gradient(circle at 30% 30%, #1a1a1a 0%, #000 70%);
      border-radius: 50%;
      box-shadow: inset 1px 1px 2px rgba(255,255,255,0.2);
    }

    .eyes.up .pupil, .eyes.down .pupil {
      width: 50%;
      height: 70%;
    }

    .eyes.left .pupil, .eyes.right .pupil {
      width: 70%;
      height: 50%;
    }

    .tongue {
      position: absolute;
      width: 4px;
      height: 20%;
      background: linear-gradient(180deg, #cc3344 0%, #ff5566 60%, #ff8899 100%);
      border-radius: 2px 2px 4px 4px;
      transform-origin: top center;
    }

    .tongue.up { top: 85%; left: 45%; transform: rotate(0deg); }
    .tongue.down { top: auto; bottom: 85%; left: 45%; transform: rotate(180deg); }
    .tongue.left { top: 40%; left: auto; right: 80%; transform: rotate(-90deg); }
    .tongue.right { top: 40%; left: 80%; right: auto; transform: rotate(90deg); }

    .tongue::after, .tongue::before {
      content: '';
      position: absolute;
      width: 3px;
      height: 8px;
      background: linear-gradient(180deg, #ff5566 0%, #ff8899 100%);
      border-radius: 1px;
      top: 100%;
    }

    .tongue::after { left: -2px; transform: rotate(-20deg); }
    .tongue::before { left: 3px; transform: rotate(20deg); }

    .scales {
      position: absolute;
      width: 100%;
      height: 100%;
      background:
        radial-gradient(ellipse at 30% 70%, rgba(255,255,255,0.1) 0%, transparent 30%),
        radial-gradient(ellipse at 70% 60%, rgba(255,255,255,0.08) 0%, transparent 25%);
      border-radius: inherit;
    }

    .food {
      position: absolute;
      overflow: hidden;
    }

    .food::before {
      content: '';
      position: absolute;
      width: 30%;
      height: 25%;
      background: radial-gradient(ellipse at center, rgba(255,255,255,0.7) 0%, transparent 70%);
      border-radius: 50%;
      top: 15%;
      left: 20%;
    }

    .food::after {
      content: '🍎';
      position: absolute;
      font-size: 0.8em;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
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
export class GameBoardComponent implements OnInit {
  readonly snakeService = inject(SnakeService);
  readonly confetti = signal<ConfettiPiece[]>([]);
  readonly showSettings = signal(false);

  worldRecordInput = 500;
  speedInput = 150;

  private confettiColors = ['#4ade80', '#fbbf24', '#ef4444', '#3b82f6', '#a855f7', '#ec4899', '#22c55e'];

  ngOnInit(): void {
    const config = this.snakeService.getConfig();
    this.worldRecordInput = config.worldRecord;
    this.speedInput = config.initialSpeed;
  }

  applySettings(): void {
    this.snakeService.updateConfig({
      worldRecord: Math.max(100, this.worldRecordInput),
      initialSpeed: Math.max(50, Math.min(500, this.speedInput)),
    });
    this.showSettings.set(false);
  }

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

  getTongueClass(): string {
    const dir = this.snakeService.direction();
    const classMap: Record<Direction, string> = {
      UP: 'up',
      DOWN: 'down',
      LEFT: 'left',
      RIGHT: 'right',
    };
    return classMap[dir];
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