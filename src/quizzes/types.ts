import type { ActionDistribution, ActionId, Combo, Position } from '../types/poker';

/** Shape of a bundled range JSON asset, e.g. assets/data/rfi_20bb.json. */
export interface RangeData {
  scenario: string;
  stack: string;
  /** Partial: not every quiz's data covers every position (e.g. RFI excludes BB, which never opens). */
  positions: Partial<Record<Position, Record<Combo, ActionDistribution>>>;
}

/**
 * Shape of a bundled range JSON asset for a two-position scenario, e.g. assets/data/vs_rfi_20bb.json.
 * Keyed by hero's own position, then by the position of the player hero is reacting to (the
 * original raiser for "vs RFI", or the 3-better for "vs 3bet") — the correct action depends on
 * both, not just where hero sits.
 */
export interface VsRangeData {
  scenario: string;
  stack: string;
  positions: Partial<Record<Position, Partial<Record<Position, Record<Combo, ActionDistribution>>>>>;
}

/** One selectable stack depth within a quiz (e.g. RFI has 20bb today, more later). */
export interface StackConfig {
  id: string;
  label: string;
  stackBB: number;
  data: RangeData | VsRangeData;
}

/** A quiz "type" (RFI today; vs-open, 3-bet, etc. later). Self-registers into the registry. */
export interface QuizConfig {
  id: string;
  title: string;
  /** Positions playable in this quiz, in seating/acting order. */
  positions: Position[];
  /** Which actions are available to the player from a given position. */
  actionsForPosition: (position: Position) => ActionId[];
  stacks: StackConfig[];
  defaultStackId: string;
  /**
   * Present only for two-position quizzes (vs RFI, vs 3bet): given hero's position, the possible
   * positions of the player hero is reacting to. Its presence is what tells TableScreen to deal a
   * second position each round and look up `stack.data` as a `VsRangeData` instead of `RangeData`.
   */
  vsPositionsFor?: (position: Position) => Position[];
  /** Short label for the "vs" role shown in the UI (e.g. "RFI", "3bet"). Required when vsPositionsFor is set. */
  vsLabel?: string;
  /**
   * False when this quiz's range data is placeholder (e.g. still all-fold stub data) rather than
   * real solver output. Defaults to true. Quizzes with dataReady: false are shown as "coming soon"
   * and are not playable, so they can't teach incorrect strategy.
   */
  dataReady?: boolean;
}

export type QuizMode = 'seatLock' | 'advance' | 'random' | 'spotCheck' | 'spotCheckAdvance';
