import type { Card, Combo, Rank, Suit } from '../types/poker';

const RANKS: Rank[] = ['2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K', 'A'];
const SUITS: Suit[] = ['S', 'H', 'D', 'C'];

export function buildDeck(): Card[] {
  const deck: Card[] = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({ rank, suit });
    }
  }
  return deck;
}

function shuffle<T>(items: T[]): T[] {
  const shuffled = [...items];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/** Draws two distinct cards uniformly at random from a full 52-card deck. */
export function dealTwoRandom(): [Card, Card] {
  const [first, second] = shuffle(buildDeck());
  return [first, second];
}

/** Reduces two dealt cards to their shorthand combo class, e.g. 'AKs', 'T9o', '77'. */
export function comboFromCards([a, b]: [Card, Card]): Combo {
  const aIdx = RANKS.indexOf(a.rank);
  const bIdx = RANKS.indexOf(b.rank);
  const [hi, lo] = aIdx >= bIdx ? [a, b] : [b, a];

  if (hi.rank === lo.rank) {
    return `${hi.rank}${lo.rank}`;
  }
  const suited = hi.suit === lo.suit ? 's' : 'o';
  return `${hi.rank}${lo.rank}${suited}`;
}

/** Builds a pair of display cards for a shorthand combo (e.g. 'AKs', 'T9o', '77'), for Spot Check. */
export function cardsFromCombo(combo: Combo): [Card, Card] {
  const hi = combo[0] as Card['rank'];
  const lo = combo[1] as Card['rank'];
  const suited = combo.length === 3 && combo[2] === 's';
  return suited
    ? [{ rank: hi, suit: 'S' }, { rank: lo, suit: 'S' }]
    : [{ rank: hi, suit: 'S' }, { rank: lo, suit: 'H' }];
}
