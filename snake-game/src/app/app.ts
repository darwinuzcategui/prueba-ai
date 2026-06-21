import { Component } from '@angular/core';
import { GameBoardComponent } from './features/snake-game/components/game-board.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [GameBoardComponent],
  template: `<app-game-board />`,
})
export class App {}