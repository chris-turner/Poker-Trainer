import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { Combo, Rank } from '../types/poker';

const RANKS_DESC: Rank[] = ['A', 'K', 'Q', 'J', 'T', '9', '8', '7', '6', '5', '4', '3', '2'];
const CELL_SIZE = 24;

function comboForCell(rowIdx: number, colIdx: number): { combo: Combo; kind: 'pair' | 'suited' | 'offsuit' } {
  if (rowIdx === colIdx) {
    return { combo: `${RANKS_DESC[rowIdx]}${RANKS_DESC[rowIdx]}`, kind: 'pair' };
  }
  if (rowIdx < colIdx) {
    return { combo: `${RANKS_DESC[rowIdx]}${RANKS_DESC[colIdx]}s`, kind: 'suited' };
  }
  return { combo: `${RANKS_DESC[colIdx]}${RANKS_DESC[rowIdx]}o`, kind: 'offsuit' };
}

/** 13x13 starting-hand grid (pairs on the diagonal, suited above, offsuit below) for picking a specific combo. */
export function HandGrid({ onSelect }: { onSelect: (combo: Combo) => void }) {
  return (
    <View style={styles.grid}>
      {RANKS_DESC.map((_, rowIdx) => (
        <View key={rowIdx} style={styles.row}>
          {RANKS_DESC.map((_, colIdx) => {
            const { combo, kind } = comboForCell(rowIdx, colIdx);
            return (
              <Pressable
                key={colIdx}
                style={[styles.cell, styles[kind]]}
                onPress={() => onSelect(combo)}
              >
                <Text style={[styles.cellText, kind === 'pair' && styles.pairText]}>{combo}</Text>
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    alignSelf: 'center',
  },
  row: {
    flexDirection: 'row',
  },
  cell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0.5,
    borderColor: '#0b3d24',
  },
  pair: {
    backgroundColor: '#f4c430',
  },
  suited: {
    backgroundColor: '#3f51b5',
  },
  offsuit: {
    backgroundColor: '#1f8a4c',
  },
  cellText: {
    fontSize: 7,
    fontWeight: '700',
    color: '#fff',
  },
  pairText: {
    color: '#3a2e00',
  },
});
