import type { QuizMode } from '../quizzes/types';
import type { Position } from '../types/poker';

export type RootStackParamList = {
  Menu: undefined;
  ModeSelect: { quizId: string };
  Table: { quizId: string; stackId: string; mode: QuizMode; lockedPosition?: Position };
  Results: undefined;
};
