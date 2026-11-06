import rfi20bb from '../../../assets/data/rfi_20bb.json';
import type { ActionId, Position } from '../../types/poker';
import type { QuizConfig, RangeData } from '../types';
import { assertValidRangeData } from '../validateRangeData';

/** Acting order for RFI: BB excluded, it never opens. */
export const RFI_POSITIONS: Position[] = ['UTG', 'UTG1', 'MP', 'HJ', 'CO', 'BTN', 'SB'];

function actionsForPosition(position: Position): ActionId[] {
  // SB can complete the blind instead of opening; everyone else opens, folds, or shoves.
  return position === 'SB' ? ['raise', 'fold', 'allin', 'call'] : ['raise', 'fold', 'allin'];
}

const rfi20bbData = rfi20bb as RangeData;
assertValidRangeData(rfi20bbData, RFI_POSITIONS);

export const rfiQuizConfig: QuizConfig = {
  id: 'rfi',
  title: 'RFI Quiz',
  positions: RFI_POSITIONS,
  actionsForPosition,
  stacks: [
    {
      id: '20bb',
      label: '20 BB',
      stackBB: 20,
      data: rfi20bbData,
    },
  ],
  defaultStackId: '20bb',
};
