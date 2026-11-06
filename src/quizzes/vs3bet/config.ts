import vs3betAllin20bb from '../../../assets/data/vs_3bet_allin_20bb.json';
import { ALL_POSITIONS, type ActionId, type Position } from '../../types/poker';
import type { QuizConfig, VsRangeData } from '../types';
import { assertValidVsRangeData } from '../validateRangeData';

/** Positions that can RFI and then face a 3bet (everyone except BB, which never opens). */
export const VS_3BET_POSITIONS: Position[] = ['UTG', 'UTG1', 'MP', 'HJ', 'CO', 'BTN', 'SB'];

/** Every position that acts after `position` — i.e. who could have 3bet hero's RFI. */
export function threeBetterPositions(position: Position): Position[] {
  return ALL_POSITIONS.slice(ALL_POSITIONS.indexOf(position) + 1);
}

// Facing an all-in 3bet, hero can only call it off or fold.
function actionsForPosition(_position: Position): ActionId[] {
  return ['call', 'fold'];
}

const vs3betAllin20bbData = vs3betAllin20bb as VsRangeData;
assertValidVsRangeData(vs3betAllin20bbData, VS_3BET_POSITIONS, threeBetterPositions);

export const vs3betQuizConfig: QuizConfig = {
  id: 'vs3bet',
  title: 'Vs 3bet',
  positions: VS_3BET_POSITIONS,
  actionsForPosition,
  vsPositionsFor: threeBetterPositions,
  vsLabel: '3bet',
  stacks: [
    {
      id: '20bb',
      label: '20 BB',
      stackBB: 20,
      data: vs3betAllin20bbData,
    },
  ],
  defaultStackId: '20bb',
  // TODO: assets/data/vs_3bet_allin_20bb.json is still all-fold placeholder data, not real ranges.
  dataReady: false,
};
