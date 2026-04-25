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
              <div class="snake-head" [class.eating]="snakeService.isEating()" [class.hissing]="snakeService.isHissing()">
                <div class="head-cover">
                  <div class="scale-row top">
                    <div class="scale-plate"></div>
                    <div class="scale-plate"></div>
                    <div class="scale-plate"></div>
                    <div class="scale-plate"></div>
                    <div class="scale-plate"></div>
                  </div>

                  <div class="heat-pits left-pit">
                    <div class="pit-hole"></div>
                    <div class="pit-glow"></div>
                  </div>

                  <div class="eye-zone">
                    <div class="eye-socket left-socket">
                      <div class="eye-rim">
                        <div class="eye-outer">
                          <div class="pupil-slit" [class]="getDirectionClass()">
                            <div class="pupil-highlight"></div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div class="inter-orbital">
                      <div class="scale-plate center-brow"></div>
                    </div>

                    <div class="eye-socket right-socket">
                      <div class="eye-rim">
                        <div class="eye-outer">
                          <div class="pupil-slit" [class]="getDirectionClass()">
                            <div class="pupil-highlight"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div class="heat-pits right-pit">
                    <div class="pit-hole"></div>
                    <div class="pit-glow"></div>
                  </div>

                  <div class="scale-row bottom">
                    <div class="scale-plate"></div>
                    <div class="scale-plate"></div>
                    <div class="scale-plate"></div>
                    <div class="scale-plate"></div>
                    <div class="scale-plate"></div>
                  </div>

                  <div class="snout-region">
                    <div class="nasal-scales">
                      <div class="scale-plate nasal left-nasal">
                        <div class="nostril-hole"></div>
                      </div>
                      <div class="scale-plate nasal right-nasal">
                        <div class="nostril-hole"></div>
                      </div>
                    </div>

                    <div class="labial-row upper">
                      @for (i of [1,2,3,4,5]; track i) {
                        <div class="labial-scale"></div>
                      }
                    </div>

                    <div class="mouth-region" [class.open]="snakeService.isEating()">
                      <div class="upper-jaw"></div>
                      <div class="mouth-interior">
                        @if (snakeService.isEating()) {
                          <div class="fang-pair left-fangs">
                            <div class="fang"></div>
                          </div>
                          <div class="fang-pair right-fangs">
                            <div class="fang"></div>
                          </div>
                        }
                      </div>
                      <div class="lower-jaw" [class.extended]="snakeService.isEating()"></div>
                    </div>

                    <div class="labial-row lower">
                      @for (i of [1,2,3,4,5]; track i) {
                        <div class="labial-scale"></div>
                      }
                    </div>
                  </div>

                  <div class="tongue-region">
                    @if (snakeService.tongueOut() || snakeService.isEating()) {
                      <div class="tongue" [class.extended]="snakeService.isEating() || snakeService.tongueOut()">
                        <div class="tongue-fork left-tine"></div>
                        <div class="tongue-fork right-tine"></div>
                      </div>
                    }
                  </div>
                </div>
              </div>
            } @else {
              <div class="body-segment" [class.long-tail]="$index > snakeService.snake().length * 0.7">
                <div class="segment-pattern">
                  <div class="dorsal-scales">
                    @for (s of getDorsalScales($index); track $index) {
                      <div class="dorsal-plate" [class]="s"></div>
                    }
                  </div>
                  <div class="lateral-line"></div>
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
      --board-bg: #050a05;
      --board-border: #2d4a20;
    }

    :host-context([data-theme="light"]) {
      --bg-primary: #d5d5d8;
      --bg-secondary: #e8e8e8;
      --text-primary: #1a1a2e;
      --text-secondary: #6b7280;
      --accent-green: #22c55e;
      --accent-yellow: #f59e0b;
      --accent-purple: #8b5cf6;
      --board-bg: #1a2015;
      --board-border: #3d5a30;
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
        radial-gradient(ellipse at center, #0d1508 0%, var(--board-bg) 100%),
        linear-gradient(135deg, #0a0f05 0%, #050805 100%);
      border: 4px solid var(--board-border);
      border-radius: 8px;
      box-shadow:
        0 0 50px rgba(45, 74, 32, 0.6),
        inset 0 0 100px rgba(0, 0, 0, 0.8);
    }

    .snake-part {
      position: absolute;
      transition: all 0.04s linear;
    }

    .snake-head {
      position: absolute;
      width: 100%;
      height: 100%;
    }

    .head-cover {
      width: 100%;
      height: 100%;
      background: radial-gradient(ellipse at 50% 40%, #90EE50 0%, #32CD32 25%, #228B22 50%, #006400 75%, #004d00 100%);
      border-radius: 35% 65% 55% 45% / 40% 45% 55% 60%;
      position: relative;
      overflow: hidden;
      box-shadow:
        inset 0 0 20px rgba(144,238,144,0.3),
        0 0 15px rgba(50,205,50,0.5);
    }

    .scale-row {
      position: absolute;
      left: 10%;
      right: 10%;
      display: flex;
      justify-content: space-around;
    }

    .scale-row.top { top: 5%; }
    .scale-row.bottom { bottom: 25%; }

    .scale-plate {
      background: radial-gradient(ellipse at 50% 50%, rgba(100,150,80,0.5) 0%, rgba(60,100,40,0.8) 60%, transparent 100%);
      border-radius: 40% 60% 50% 50% / 50% 45% 55% 50%;
    }

    .scale-row.top .scale-plate {
      width: 15%;
      height: 12%;
    }

    .scale-row.bottom .scale-plate {
      width: 12%;
      height: 8%;
    }

    .heat-pits {
      position: absolute;
      top: 25%;
      width: 8%;
      height: 15%;
    }

    .heat-pits.left-pit { left: 15%; }
    .heat-pits.right-pit { right: 15%; }

    .pit-hole {
      width: 100%;
      height: 100%;
      background: radial-gradient(ellipse at center, #0a0a0a 0%, #1a1a1a 50%, #0d0d0d 100%);
      border-radius: 50%;
      box-shadow: inset 0 0 5px rgba(0,0,0,0.9);
    }

    .pit-glow {
      position: absolute;
      top: 20%;
      left: 20%;
      width: 60%;
      height: 60%;
      background: radial-gradient(circle, rgba(255,50,0,0.3) 0%, transparent 70%);
      border-radius: 50%;
    }

    .eye-zone {
      position: absolute;
      top: 15%;
      left: 15%;
      right: 15%;
      height: 30%;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .eye-socket {
      width: 28%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .eye-rim {
      width: 100%;
      height: 85%;
      background: radial-gradient(ellipse at 50% 50%, #FFD700 0%, #FFA500 50%, #FF8C00 100%);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow:
        inset 2px 2px 4px rgba(255,215,0,0.6),
        inset -2px -2px 4px rgba(200,100,0,0.6),
        0 0 8px rgba(255,165,0,0.8);
    }

    .eye-outer {
      width: 80%;
      height: 80%;
      background: radial-gradient(circle at 50% 50%, #FFFF00 0%, #FFD700 30%, #FFA500 60%, #FF8C00 100%);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow:
        inset 1px 1px 3px rgba(255,255,200,0.7),
        inset -1px -1px 2px rgba(200,100,0,0.4);
    }

    .pupil-slit {
      width: 25%;
      height: 70%;
      background: radial-gradient(ellipse at 50% 50%, #0a0a0a 0%, #000 70%, #1a1a1a 100%);
      border-radius: 50%;
      position: relative;
      box-shadow: inset 1px 1px 2px rgba(255,255,255,0.2);
    }

    .pupil-slit.up { transform: translateY(-20%); }
    .pupil-slit.down { transform: translateY(20%); }
    .pupil-slit.left { transform: translateX(-20%); }
    .pupil-slit.right { transform: translateX(20%); }

    .pupil-highlight {
      position: absolute;
      top: 15%;
      left: 20%;
      width: 25%;
      height: 25%;
      background: rgba(255,255,255,0.5);
      border-radius: 50%;
    }

    .inter-orbital {
      flex: 1;
      display: flex;
      justify-content: center;
    }

    .center-brow {
      width: 20%;
      height: 40%;
    }

    .snout-region {
      position: absolute;
      bottom: 5%;
      left: 15%;
      right: 15%;
      height: 40%;
    }

    .nasal-scales {
      display: flex;
      justify-content: space-between;
      margin-bottom: 2%;
    }

    .nasal {
      width: 22%;
      height: 35%;
    }

    .nostril-hole {
      position: absolute;
      top: 30%;
      left: 25%;
      width: 50%;
      height: 40%;
      background: radial-gradient(ellipse at center, #050505 0%, #0a0a0a 100%);
      border-radius: 40% 60% 50% 50%;
    }

    .labial-row {
      display: flex;
      justify-content: space-between;
      margin: 2% 0;
    }

.labial-scale {
      width: 15%;
      height: 3px;
      background: linear-gradient(90deg, transparent 0%, #5a8a40 30%, #6a9a50 50%, #5a8a40 70%, transparent 100%);
      border-radius: 2px;
    }

    .upper-jaw {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 50%;
      background: linear-gradient(180deg, #4a7a35 0%, #3d6a28 100%);
      border-radius: 0 0 30% 30%;
    }

    .lower-jaw {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      height: 60%;
      background: linear-gradient(180deg, #3d6a28 0%, #2d5a1a 100%);
      border-radius: 30% 30% 0 0;
      transform-origin: top center;
      transition: transform 0.05s ease-out;
    }

    .mouth-region {
      position: relative;
      height: 35%;
      overflow: hidden;
    }

    .upper-jaw {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 50%;
      background: linear-gradient(180deg, #3d4a28 0%, #2d3a1d 100%);
      border-radius: 0 0 30% 30%;
    }

    .mouth-interior {
      position: absolute;
      top: 40%;
      left: 10%;
      right: 10%;
      height: 20%;
      background: linear-gradient(180deg, #1a0505 0%, #4a0f0f 50%, #2a0a0a 100%);
      display: flex;
      justify-content: center;
      gap: 20%;
    }

    .fang-pair {
      display: flex;
      align-items: flex-end;
    }

    .fang {
      width: 3px;
      height: 12px;
      background: linear-gradient(180deg, #faf5e0 0%, #e8d9b8 40%, #c9a86c 70%, #8b6914 100%);
      border-radius: 2px 2px 50% 50%;
      box-shadow: 0 0 2px rgba(0,0,0,0.3);
    }

    .fang-pair.left-fangs .fang { transform: rotate(-15deg); }
    .fang-pair.right-fangs .fang { transform: rotate(15deg); }

    .lower-jaw {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      height: 60%;
      background: linear-gradient(180deg, #2d3a1d 0%, #1a2510 100%);
      border-radius: 30% 30% 0 0;
      transform-origin: top center;
      transition: transform 0.05s ease-out;
    }

    .lower-jaw.extended {
      transform: scaleY(1.3) translateY(20%);
    }

    .tongue-region {
      position: absolute;
      bottom: -5px;
      left: 50%;
      transform: translateX(-50%);
    }

    .tongue {
      width: 4px;
      height: 0;
      background: linear-gradient(180deg, #1a0a0a 0%, #2a1515 50%, #1a0a0a 100%);
      border-radius: 2px;
      display: flex;
      justify-content: center;
      transform-origin: top center;
      transition: height 0.1s ease-out;
    }

    .tongue.extended {
      height: 20px;
    }

    .tongue-fork {
      position: absolute;
      width: 2px;
      height: 8px;
      background: linear-gradient(180deg, #2a1515 0%, #1a0a0a 100%);
      top: 100%;
    }

    .tongue-fork.left-tine {
      left: -2px;
      transform: rotate(-25deg);
    }

    .tongue-fork.right-tine {
      right: -2px;
      transform: rotate(25deg);
    }

    .body-segment {
      width: 100%;
      height: 100%;
      background: radial-gradient(ellipse at 50% 50%, #90EE90 0%, #32CD32 25%, #228B22 50%, #006400 70%, #004d00 100%);
      border-radius: 40% 60% 50% 50% / 50% 45% 55% 50%;
      box-shadow:
        inset 3px 3px 8px rgba(144,238,144,0.5),
        inset -3px -3px 8px rgba(0,100,0,0.6),
        0 0 12px rgba(50,205,50,0.7);
      position: relative;
      overflow: hidden;
    }

    .segment-pattern {
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      padding: 10% 15%;
    }

    .dorsal-scales {
      display: flex;
      justify-content: center;
      gap: 5%;
    }

    .dorsal-plate {
      width: 15%;
      height: 15%;
      background: linear-gradient(135deg, rgba(60,70,40,0.8) 0%, rgba(20,30,10,0.9) 100%);
      transform: rotate(45deg);
      border-radius: 2px;
      box-shadow: 1px 1px 2px rgba(0,0,0,0.5);
    }

    .lateral-line {
      position: absolute;
      left: 20%;
      right: 20%;
      top: 45%;
      height: 2px;
      background: linear-gradient(90deg, transparent 0%, rgba(20,30,10,0.6) 30%, rgba(20,30,10,0.6) 70%, transparent 100%);
    }

    .food {
      position: absolute;
      overflow: visible;
    }

    .food::before {
      content: '';
      position: absolute;
      width: 25%;
      height: 25%;
      background: #5D4037;
      top: -5%;
      right: -5%;
      border-radius: 50% 50% 0 0;
      transform: rotate(45deg);
      box-shadow: inset 1px 1px 2px rgba(0,0,0,0.5);
    }

    .food::after {
      content: '';
      position: absolute;
      width: 15%;
      height: 15%;
      background: #3E2723;
      bottom: -2%;
      left: -2%;
      border-radius: 50%;
      box-shadow: inset -1px -1px 2px rgba(0,0,0,0.5);
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

  getDorsalScales(index: number): string[] {
    return ['d1', 'd2', 'd3', 'd4', 'd5'].slice(0, 3 + (index % 3));
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