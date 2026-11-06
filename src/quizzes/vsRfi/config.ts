import vsRfi20bb from '../../../assets/data/vs_rfi_20bb.json';
import { ALL_POSITIONS, type ActionId, type Position } from '../../types/poker';
import type { QuizConfig, VsRangeData } from '../types';
import { assertValidVsRangeData } from '../validateRangeData';

/** Positions that can ever face an RFI (everyone except UTG, which is always first to act). */
export const VS_RFI_POSITIONS: Position[] = ['UTG1', 'MP', 'HJ', 'CO', 'BTN', 'SB', 'BB'];

/** Every position that acts before `position` — i.e. who could have been the one to RFI. */
export function rfiRaiserPositions(position: Position): Position[] {
  return ALL_POSITIONS.slice(0, ALL_POSITIONS.indexOf(position));
}

// Same four actions as RFI itself — raise here is the ~5bb non-all-in 3bet sizing.
function actionsForPosition(_position: Position): ActionId[] {
  return ['raise', 'call', 'allin', 'fold'];
}

const vsRfi20bbData = vsRfi20bb as VsRangeData;
assertValidVsRangeData(vsRfi20bbData, VS_RFI_POSITIONS, rfiRaiserPositions);

export const vsRfiQuizConfig: QuizConfig = {
  id: 'vsRfi',
  title: 'Vs RFI',
  positions: VS_RFI_POSITIONS,
  actionsForPosition,
  vsPositionsFor: rfiRaiserPositions,
  vsLabel: 'RFI',
  stacks: [
    {
      id: '20bb',
      label: '20 BB',
      stackBB: 20,
      data: vsRfi20bbData,
    },
  ],
  defaultStackId: '20bb',
  // TODO: assets/data/vs_rfi_20bb.json is still all-fold placeholder data, not real ranges.
  dataReady: false,
};
