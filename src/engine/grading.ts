import type { ActionDistribution, ActionId } from '../types/poker';

export interface GradeResult {
  correct: boolean;
  /** True when more than one action has nonzero frequency (a mixed-strategy spot). */
  isMixed: boolean;
  distribution: ActionDistribution;
}

/** Grades a chosen action against a combo's solved distribution. Any action with nonzero frequency counts as correct. */
export function gradeAction(distribution: ActionDistribution, chosen: ActionId): GradeResult {
  const nonzero = Object.entries(distribution).filter(([, freq]) => (freq ?? 0) > 0);
  return {
    correct: (distribution[chosen] ?? 0) > 0,
    isMixed: nonzero.length > 1,
    distribution,
  };
}
