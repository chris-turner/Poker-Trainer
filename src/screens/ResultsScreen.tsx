import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import type { RootStackParamList } from '../navigation/types';
import { clearAttempts, getStats, type Stats } from '../storage/progressStore';

type Props = NativeStackScreenProps<RootStackParamList, 'Results'>;

export function ResultsScreen({}: Props) {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    getStats().then(setStats);
  }, []);

  const handleReset = () => {
    clearAttempts().then(() => getStats()).then(setStats);
  };

  if (!stats) {
    return (
      <View style={styles.container}>
        <ActivityIndicator color="#fff" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.percentage}>{stats.percentage}%</Text>
      <Text style={styles.label}>correct</Text>
      <Text style={styles.detail}>
        {stats.correct} / {stats.total} hands
      </Text>
      <Pressable style={styles.resetButton} onPress={handleReset}>
        <Text style={styles.resetButtonText}>Reset stats</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0b3d24',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 24,
  },
  percentage: {
    fontSize: 56,
    fontWeight: '700',
    color: '#fff',
  },
  label: {
    fontSize: 18,
    color: '#d7f0e0',
  },
  detail: {
    fontSize: 16,
    color: '#d7f0e0',
    marginTop: 16,
  },
  resetButton: {
    marginTop: 32,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  resetButtonText: {
    color: '#a8c5b4',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
});
