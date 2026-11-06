import { rfiQuizConfig } from './rfi/config';
import type { QuizConfig } from './types';
import { vs3betQuizConfig } from './vs3bet/config';
import { vsRfiQuizConfig } from './vsRfi/config';

/** All quizzes available from the main menu. Add new quiz configs here as they're built. */
export const quizRegistry: Record<string, QuizConfig> = {
  [rfiQuizConfig.id]: rfiQuizConfig,
  [vsRfiQuizConfig.id]: vsRfiQuizConfig,
  [vs3betQuizConfig.id]: vs3betQuizConfig,
};
