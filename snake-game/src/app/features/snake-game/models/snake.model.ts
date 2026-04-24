export interface Position {
  x: number;
  y: number;
}

export type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

export type GameState = 'IDLE' | 'PLAYING' | 'PAUSED' | 'GAME_OVER';

export interface GameConfig {
  boardWidth: number;
  boardHeight: number;
  cellSize: number;
  initialSpeed: number;
  speedIncrease: number;
  worldRecord: number;
}

export const DEFAULT_CONFIG: GameConfig = {
  boardWidth: 20,
  boardHeight: 15,
  cellSize: 25,
  initialSpeed: 150,
  speedIncrease: 5,
  worldRecord: 50,
};
