import { Component, inject, HostListener, signal, effect, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SnakeService } from '../../../core/services/snake.service';
import { ThemeService } from '../../../core/services/theme.service';
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
            <input type="number" [(ngModel)]="worldRecordInput" min="100" max="10000" step="100" />
          </div>
          <div class="setting-item">
            <label>Velocidad (ms):</label>
            <input type="number" [(ngModel)]="speedInput" min="50" max="500" step="10" />
          </div>
          <div class="setting-item">
            <label>Sonido:</label>
            <button class="sound-btn" (click)="toggleSound()" [class.muted]="!soundEnabled">
              {{ soundEnabled ? '🔊' : '🔇' }}
            </button>
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
        <button class="theme-btn" (click)="themeService.toggle()">
          {{ themeService.isDark() ? '☀️' : '🌙' }}
        </button>
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
            class="snake-part"
            [style]="snakeService.getSnakePartStyle(segment, $index, snakeService.snake().length)"
          >
            @if (segment.isHead) {
              <div class="snake-head" [class.eating]="snakeService.mouthOpen() > 0">
                <div class="head-base">
                  <div class="head-top">
                    <div class="head-scale-row">
                      <div class="scale detail"></div>
                      <div class="scale detail"></div>
                      <div class="scale detail"></div>
                    </div>
                  </div>

                  <div class="eye-socket left" [class]="getDirectionClass()">
                    <div class="eye">
                      <div class="eyelid upper"></div>
                      <div class="pupil" [class]="getDirectionClass()"></div>
                      <div class="eyelid lower"></div>
                    </div>
                  </div>

                  <div class="eye-socket right" [class]="getDirectionClass()">
                    <div class="eye">
                      <div class="eyelid upper"></div>
                      <div class="pupil" [class]="getDirectionClass()"></div>
                      <div class="eyelid lower"></div>
                    </div>
                  </div>

                  <div class="head-center">
                    <div class="scale-row">
                      <div class="scale center"></div>
                      <div class="scale center"></div>
                    </div>
                  </div>

                  <div class="snout-area" [class.open]="snakeService.mouthOpen() > 0">
                    <div class="snout">
                      <div class="nostril left"></div>
                      <div class="nostril right"></div>
                    </div>
                    <div class="mouth" [class.open]="snakeService.mouthOpen() > 0">
                      <div class="upper-jaw"></div>
                      <div class="lower-jaw" [class.extended]="snakeService.mouthOpen() > 0.5"></div>
                      @if (snakeService.mouthOpen() > 0.3) {
                        <div class="fangs">
                          <div class="fang left"></div>
                          <div class="fang right"></div>
                        </div>
                        <div class="tongue" [class.visible]="snakeService.mouthOpen() > 0.5"></div>
                      }
                    </div>
                  </div>

                  <div class="head-bottom">
                    <div class="head-scale-row">
                      <div class="scale detail"></div>
                      <div class="scale detail"></div>
                      <div class="scale detail"></div>
                    </div>
                  </div>
                </div>
              </div>
            } @else {
              <div class="body-segment" [class.heading]="segment.scale > 0.9">
                <div class="scale-pattern">
                  @for (s of getScalePattern($index); track $index) {
                    <div class="scale" [class]="s"></div>
                  }
                </div>
              </div>
            }
          </div>
        }
        <div class="food" [style]="snakeService.getFoodStyle(snakeService.food())"></div>
      </div>

      @if (snakeService.gameState() === 'IDLE') {
        <div class="overlay">
          <h2>🐍 Snake Game</h2>
          <p>Presiona ESPACIO para comenzar</p>
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
        <span>🔊: Sonido {{ soundEnabled ? 'ON' : 'OFF' }}</span>
      </div>
    </div>
  `,
  styles: [`
    :host {
      --bg-primary: #0f0f1a;
      --bg-secondary: #1a1a2e;
      --text-primary: #ffffff;
      --text-secondary: #9ca3af;
      --accent-green: #4ade80;
      --accent-yellow: #fbbf24;
      --accent-purple: #a855f7;
      --board-bg: #050a0f;
      --board-border: #1a3d15;
    }

    :host-context([data-theme="light"]) {
      --bg-primary: #e0e0e8;
      --bg-secondary: #f5f5f5;
      --text-primary: #1a1a2e;
      --text-secondary: #6b7280;
      --accent-green: #22c55e;
      --accent-yellow: #f59e0b;
      --accent-purple: #8b5cf6;
      --board-bg: #1a251a;
      --board-border: #2d5a27;
    }

    .game-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1rem;
      padding: 2rem;
      position: relative;
      background: linear-gradient(135deg, var(--bg-primary) 0%, var(--bg-secondary) 100%);
      min-height: 100vh;
      color: var(--text-primary);
    }

    .settings-panel {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: var(--bg-secondary);
      border: 2px solid var(--accent-green);
      border-radius: 12px;
      padding: 2rem;
      z-index: 100;
      box-shadow: 0 0 30px rgba(74, 222, 128, 0.3);
      min-width: 300px;
    }

    .settings-panel h2 { text-align: center; margin-bottom: 1.5rem; color: var(--accent-green); }

    .setting-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
      gap: 1rem;
    }

    .setting-item label { color: var(--text-secondary); font-size: 0.9rem; }

    .setting-item input {
      width: 120px;
      padding: 0.5rem;
      border: 1px solid var(--accent-green);
      border-radius: 4px;
      background: var(--bg-primary);
      color: var(--text-primary);
      text-align: center;
    }

    .sound-btn {
      width: 40px;
      height: 40px;
      font-size: 1.2rem;
      background: transparent;
      border: 2px solid var(--text-secondary);
      border-radius: 50%;
      cursor: pointer;
    }

    .sound-btn.muted { opacity: 0.5; }

    .btn-primary {
      width: 100%;
      padding: 0.75rem;
      margin-top: 0.5rem;
      background: var(--accent-green);
      border: none;
      border-radius: 6px;
      color: var(--bg-primary);
      font-weight: bold;
      cursor: pointer;
    }

    .btn-secondary {
      width: 100%;
      padding: 0.5rem;
      margin-top: 0.5rem;
      background: transparent;
      border: 1px solid var(--text-secondary);
      border-radius: 6px;
      color: var(--text-secondary);
      cursor: pointer;
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

    .score { color: var(--accent-green); }
    .high-score { color: var(--accent-yellow); }
    .world-record { color: var(--accent-purple); }
    .world-record.achieved { color: #f472b6; text-shadow: 0 0 10px #f472b6; animation: pulse 0.5s infinite alternate; }

    .theme-btn, .settings-btn {
      background: transparent;
      border: 2px solid var(--text-secondary);
      border-radius: 50%;
      width: 40px;
      height: 40px;
      font-size: 1.2rem;
      cursor: pointer;
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
      0% { transform: translateY(-100vh) rotate(0deg); opacity: 1; }
      100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
    }

    .confetti-message {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      font-size: 2.5rem;
      font-weight: bold;
      color: var(--accent-yellow);
      text-shadow: 0 0 30px rgba(251, 191, 36, 0.8);
      animation: pulse 0.5s infinite alternate;
      z-index: 1001;
    }

    @keyframes pulse {
      from { transform: translate(-50%, -50%) scale(1); }
      to { transform: translate(-50%, -50%) scale(1.1); }
    }

    .board {
      position: relative;
      background:
        radial-gradient(ellipse at center, #0d1520 0%, var(--board-bg) 100%),
        linear-gradient(135deg, #0a0f18 0%, #050a0f 100%);
      border: 4px solid var(--board-border);
      border-radius: 8px;
      box-shadow:
        0 0 50px rgba(26, 61, 21, 0.7),
        inset 0 0 100px rgba(0, 0, 0, 0.8);
    }

    .snake-part {
      position: absolute;
      transition: all 0.05s linear;
    }

    .snake-head {
      position: absolute;
      width: 100%;
      height: 100%;
    }

    .head-base {
      position: relative;
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: column;
      background: radial-gradient(ellipse at 50% 30%, #3a6b2a 0%, #2d5a20 30%, #1a3d15 70%, #0d2610 100%);
    }

    .head-top, .head-bottom {
      height: 25%;
      display: flex;
      justify-content: center;
      align-items: center;
    }

    .head-scale-row {
      display: flex;
      gap: 15%;
      justify-content: center;
    }

    .scale {
      background: radial-gradient(ellipse at 50% 50%, rgba(255,255,255,0.15) 0%, transparent 70%);
      border-radius: 50%;
    }

    .scale.detail {
      width: 30%;
      height: 60%;
    }

    .scale.center {
      width: 40%;
      height: 50%;
    }

    .eye-socket {
      position: absolute;
      width: 24%;
      height: 28%;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .eye-socket.left { left: 15%; top: 18%; }
    .eye-socket.right { right: 15%; top: 18%; }

    .eye-socket.up { top: 12%; }
    .eye-socket.down { top: auto; bottom: 18%; }
    .eye-socket.left.dir-left { left: 10%; top: 30%; }
    .eye-socket.right.dir-right { right: 10%; top: 30%; }

    .eye {
      width: 100%;
      height: 100%;
      background: radial-gradient(circle at 50% 40%, #faf5e0 0%, #e8d9b8 30%, #c9a86c 60%, #8b6914 100%);
      border-radius: 50%;
      position: relative;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      box-shadow:
        inset 2px 2px 4px rgba(255,255,255,0.6),
        inset -2px -2px 4px rgba(0,0,0,0.4),
        0 0 8px rgba(0,0,0,0.6);
    }

    .eyelid {
      position: absolute;
      width: 100%;
      background: linear-gradient(to bottom, #2d5a20, #1a3d15);
      border-radius: 50%;
    }

    .eyelid.upper {
      top: 0;
      height: 50%;
      transform-origin: top center;
    }

    .eyelid.lower {
      bottom: 0;
      height: 50%;
      transform-origin: bottom center;
    }

    .pupil {
      width: 55%;
      height: 70%;
      background: radial-gradient(circle at 35% 35%, #0a0a0a 0%, #000 50%, #1a1a1a 80%, #2a2a2a 100%);
      border-radius: 50%;
      z-index: 1;
      box-shadow: inset 1px 1px 2px rgba(255,255,255,0.2);
    }

    .pupil.up { transform: translateY(-15%); }
    .pupil.down { transform: translateY(15%); }
    .pupil.left { transform: translateX(-15%); }
    .pupil.right { transform: translateX(15%); }

    .head-center {
      flex: 1;
      display: flex;
      justify-content: center;
      align-items: center;
    }

    .scale-row {
      display: flex;
      gap: 20%;
    }

    .snout-area {
      height: 35%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: flex-end;
      position: relative;
    }

    .snout {
      width: 35%;
      height: 40%;
      background: linear-gradient(180deg, #2d5a20 0%, #1a3d15 100%);
      border-radius: 50% 50% 45% 45%;
      position: relative;
      display: flex;
      justify-content: center;
      align-items: center;
    }

    .nostril {
      position: absolute;
      width: 4px;
      height: 3px;
      background: #0d2610;
      border-radius: 50%;
      top: 40%;
    }

    .nostril.left { left: 20%; }
    .nostril.right { right: 20%; }

    .mouth {
      position: absolute;
      width: 45%;
      height: 0%;
      background: linear-gradient(180deg, #1a0505 0%, #4a0f0f 100%);
      top: 75%;
      border-radius: 0 0 50% 50%;
      overflow: hidden;
      transition: height 0.05s ease-out;
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    .mouth.open {
      height: 60%;
      box-shadow: 0 0 10px rgba(74, 20, 20, 0.8);
    }

    .upper-jaw {
      width: 100%;
      height: 40%;
      background: linear-gradient(180deg, #2d4a20 0%, #1a3d15 100%);
      border-radius: 0 0 30% 30%;
    }

    .lower-jaw {
      width: 100%;
      height: 60%;
      background: linear-gradient(180deg, #1a3d15 0%, #0d2610 100%);
      border-radius: 30% 30% 0 0;
      transform-origin: top center;
      transition: transform 0.05s ease-out;
    }

    .lower-jaw.extended {
      transform: scaleY(1.2) translateY(10%);
    }

    .fangs {
      position: absolute;
      top: 5%;
      width: 80%;
      display: flex;
      justify-content: space-between;
    }

    .fang {
      width: 4px;
      height: 15px;
      background: linear-gradient(180deg, #faf5e0 0%, #e8d9b8 50%, #c9a86c 100%);
      border-radius: 2px 2px 50% 50%;
      box-shadow: 0 0 3px rgba(0,0,0,0.3);
    }

    .fang.left { transform: rotate(-10deg); }
    .fang.right { transform: rotate(10deg); }

    .tongue {
      position: absolute;
      top: 50%;
      width: 4px;
      height: 0;
      background: linear-gradient(180deg, #8b1538 0%, #c41e3a 50%, #e8264b 100%);
      border-radius: 2px;
      transform-origin: top center;
    }

    .tongue.visible {
      height: 25px;
      animation: tongue-snap 0.15s ease-out forwards;
    }

    .tongue.visible::after, .tongue.visible::before {
      content: '';
      position: absolute;
      width: 3px;
      height: 10px;
      background: linear-gradient(180deg, #c41e3a 0%, #e8264b 100%);
      border-radius: 1px;
      top: 100%;
    }

    .tongue.visible::after { left: -2px; transform: rotate(-20deg); }
    .tongue.visible::before { left: 3px; transform: rotate(20deg); }

    @keyframes tongue-snap {
      0% { transform: scaleY(0); }
      50% { transform: scaleY(1.2); }
      100% { transform: scaleY(1); }
    }

    .body-segment {
      position: absolute;
      width: 100%;
      height: 100%;
      background: radial-gradient(ellipse at 50% 50%, #2d5a20 0%, #1a3d15 50%, #0d2610 100%);
      border-radius: 45% 55% 50% 50% / 50% 45% 55% 50%;
      box-shadow:
        inset 2px 2px 4px rgba(100,160,80,0.3),
        inset -2px -2px 4px rgba(0,0,0,0.4),
        0 0 10px rgba(26,61,21,0.5);
    }

    .scale-pattern {
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: column;
      justify-content: space-around;
      padding: 15% 20%;
    }

    .food {
      position: absolute;
      overflow: hidden;
    }

    .food::before {
      content: '';
      position: absolute;
      width: 40%;
      height: 35%;
      background: radial-gradient(ellipse at center, rgba(255,255,255,0.7) 0%, transparent 70%);
      border-radius: 50%;
      top: 10%;
      left: 12%;
    }

    .food::after {
      content: '';
      position: absolute;
      width: 25%;
      height: 20%;
      background: rgba(100, 20, 20, 0.9);
      border-radius: 50%;
      bottom: 20%;
      right: 15%;
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
      background: rgba(0, 0, 0, 0.9);
      border-radius: 8px;
      color: white;
      text-align: center;
    }

    .overlay h2 { margin: 0 0 1rem; font-size: 2rem; }
    .overlay p { margin: 0.5rem 0; }
    .overlay .new-record { color: var(--accent-yellow); font-size: 1.5rem; font-weight: bold; }
    .overlay button {
      margin-top: 1rem;
      padding: 0.75rem 2rem;
      font-size: 1rem;
      background: var(--accent-green);
      border: none;
      border-radius: 4px;
      color: var(--bg-primary);
      cursor: pointer;
    }

    .controls-info, .world-record-info {
      margin-top: 1rem;
      font-size: 0.875rem;
      color: var(--text-secondary);
    }

    .world-record-info { color: var(--accent-purple); font-weight: bold; }

    .instructions {
      display: flex;
      gap: 2rem;
      color: var(--text-secondary);
      font-size: 0.875rem;
    }
  `]
})
export class GameBoardComponent implements OnInit {
  readonly snakeService = inject(SnakeService);
  readonly themeService = inject(ThemeService);
  readonly confetti = signal<ConfettiPiece[]>([]);
  readonly showSettings = signal(false);
  soundEnabled = true;

  worldRecordInput = 500;
  speedInput = 150;

  private confettiColors = ['#4ade80', '#fbbf24', '#ef4444', '#3b82f6', '#a855f7', '#ec4899', '#22c55e'];

  ngOnInit(): void {
    const config = this.snakeService.getConfig();
    this.worldRecordInput = config.worldRecord;
    this.speedInput = config.initialSpeed;
  }

  toggleSound(): void {
    this.soundEnabled = !this.soundEnabled;
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

  getScalePattern(index: number): string[] {
    const patterns = ['top-left', 'top-right', 'bottom-left', 'bottom-right'];
    return [patterns[index % 4], patterns[(index + 1) % 4]];
  }

  getDirectionClass(): string {
    const dir = this.snakeService.direction();
    return dir.toLowerCase();
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