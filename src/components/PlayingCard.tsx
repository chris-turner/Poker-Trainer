import { StyleSheet, Text, View } from 'react-native';

import type { Card } from '../types/poker';

const SUIT_SYMBOL: Record<Card['suit'], string> = {
  S: '♠',
  H: '♥',
  D: '♦',
  C: '♣',
};

const RED_SUITS = new Set(['H', 'D']);

const BASE_WIDTH = 72;

export function PlayingCard({ card, width = BASE_WIDTH, height = 100 }: { card: Card; width?: number; height?: number }) {
  const isRed = RED_SUITS.has(card.suit);
  const scale = width / BASE_WIDTH;
  return (
    <View style={[styles.card, { width, height }]}>
      <Text style={[styles.rank, isRed && styles.red, { fontSize: 28 * scale }]}>{card.rank}</Text>
      <Text style={[styles.suit, isRed && styles.red, { fontSize: 24 * scale }]}>{SUIT_SYMBOL[card.suit]}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 10,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  rank: {
    fontWeight: '700',
    color: '#111',
  },
  suit: {
    color: '#111',
  },
  red: {
    color: '#c62828',
  },
});
