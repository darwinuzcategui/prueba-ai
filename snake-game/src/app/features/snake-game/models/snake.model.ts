export interface Position {
  x: number;
  y: number;
}

export interface SnakeSegment {
  position: Position;
}

export type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

export type GameState = 'IDLE' | 'PLAYING' | 'PAUSED' | 'GAME_OVER';

export interface GameConfig {
  boardWidth: number;
  boardHeight: number;
  cellSize: number;
  initialSpeed: number;
  speedIncrease: number;
}

export const DEFAULT_CONFIG: GameConfig = {
  boardWidth: 20,
  boardHeight: 15,
  cellSize: 25,
  initialSpeed: 150,
  speedIncrease: 5,
};