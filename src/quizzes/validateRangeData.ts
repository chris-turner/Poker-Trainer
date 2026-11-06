import type { ActionDistribution, ActionId, Combo, Position } from '../types/poker';
import type { RangeData, VsRangeData } from './types';

const RANKS = ['A', 'K', 'Q', 'J', 'T', '9', '8', '7', '6', '5', '4', '3', '2'];
const COMBO_COUNT = RANKS.length * RANKS.length; // 13 pairs + 78 suited + 78 offsuit = 169
const VALID_ACTIONS: ActionId[] = ['raise', 'fold', 'call', 'allin'];
const COMBO_PATTERN = /^([AKQJT2-9])([AKQJT2-9])(s|o)?$/;

function isValidCombo(combo: string): boolean {
  const match = COMBO_PATTERN.exec(combo);
  if (!match) return false;
  const [, hi, lo, suited] = match;
  // Pairs carry no suited/offsuit suffix; everything else must specify one.
  return hi === lo ? suited === undefined : suited !== undefined;
}

/** Validates one position's combo -> distribution map. Shared by both range-data shapes. */
function validateComboMap(combos: Record<Combo, ActionDistribution> | undefined, label: string): void {
  if (!combos) {
    throw new Error(`${label} is missing`);
  }

  const comboEntries = Object.entries(combos);
  if (comboEntries.length !== COMBO_COUNT) {
    throw new Error(`${label} has ${comboEntries.length} combos, expected ${COMBO_COUNT}`);
  }

  for (const [combo, distribution] of comboEntries) {
    if (!isValidCombo(combo)) {
      throw new Error(`${label} has invalid combo "${combo}"`);
    }

    let total = 0;
    for (const [action, freq] of Object.entries(distribution)) {
      if (!VALID_ACTIONS.includes(action as ActionId)) {
        throw new Error(`${label} combo "${combo}" has unknown action "${action}"`);
      }
      if (typeof freq !== 'number' || freq < 0 || freq > 100) {
        throw new Error(`${label} combo "${combo}" action "${action}" has invalid frequency ${freq}`);
      }
      total += freq;
    }

    if (Math.abs(total - 100) > 0.5) {
      throw new Error(`${label} combo "${combo}" frequencies sum to ${total}, expected 100`);
    }
  }
}

/**
 * Validates a bundled range JSON asset at import time. Without this, a typo'd position key,
 * malformed combo string, or bad frequency silently falls back to an empty distribution at
 * quiz time (see TableScreen's `?? {}`) — every action reads as "incorrect" for that spot with
 * no error to chase. Fail loudly here instead, while the data is still being hand-edited.
 */
export function assertValidRangeData(data: RangeData, expectedPositions: Position[]): void {
  const label = `Range data "${data.scenario}/${data.stack}"`;
  for (const position of expectedPositions) {
    validateComboMap(data.positions[position], `${label} position "${position}"`);
  }
}

/**
 * Validates a bundled two-position range JSON asset (vs RFI, vs 3bet) at import time. For each
 * hero position, `vsPositionsFor` gives the set of "who hero is reacting to" positions that must
 * each carry a full 169-combo map.
 */
export function assertValidVsRangeData(
  data: VsRangeData,
  expectedPositions: Position[],
  vsPositionsFor: (position: Position) => Position[]
): void {
  const label = `Range data "${data.scenario}/${data.stack}"`;
  for (const position of expectedPositions) {
    const vsPositions = vsPositionsFor(position);
    for (const vsPosition of vsPositions) {
      validateComboMap(
        data.positions[position]?.[vsPosition],
        `${label} position "${position}" vs "${vsPosition}"`
      );
    }
  }
}
