export type Suit = 'S' | 'H' | 'D' | 'C';

export type Rank =
  | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | 'T' | 'J' | 'Q' | 'K' | 'A';

export interface Card {
  rank: Rank;
  suit: Suit;
}

/** Full ring, in acting order. BB is dealt into but never opens (not playable in RFI). */
export const ALL_POSITIONS = ['UTG', 'UTG1', 'MP', 'HJ', 'CO', 'BTN', 'SB', 'BB'] as const;
export type Position = (typeof ALL_POSITIONS)[number];

/** Shorthand hand notation, e.g. 'AA', 'AKs', 'T9o'. */
export type Combo = string;

export type ActionId = 'raise' | 'fold' | 'call' | 'allin';

/** Frequency (0-100) that a GTO-ish solve takes each action for a given combo. */
export type ActionDistribution = Partial<Record<ActionId, number>>;
