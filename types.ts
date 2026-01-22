
export interface Question {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  triangleParams?: {
    sideA: number;
    sideB: number;
    sideC: number;
    midsegmentLength?: number;
    baseLength?: number;
    labels?: {
      v1: string; // Đỉnh trên
      v2: string; // Đỉnh trái dưới
      v3: string; // Đỉnh phải dưới
      m1: string; // Trung điểm cạnh trái
      m2: string; // Trung điểm cạnh phải
    };
  };
}

export enum GameState {
  HOME = 'HOME',
  NAME_INPUT = 'NAME_INPUT',
  LEARNING = 'LEARNING',
  PLAYING = 'PLAYING',
  SUMMARY = 'SUMMARY',
  GAME_OVER = 'GAME_OVER'
}

export interface Achievement {
  id: string;
  title: string;
  icon: string;
  unlocked: boolean;
}

export interface LeaderboardEntry {
  name: string;
  score: number;
  date: string;
}
