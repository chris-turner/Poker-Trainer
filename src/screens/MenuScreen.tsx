import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { quizRegistry } from '../quizzes/registry';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Menu'>;

export function MenuScreen({ navigation }: Props) {
  const quizzes = Object.values(quizRegistry);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Poker Trainer</Text>
      {quizzes.map((quiz) => {
        const isReady = quiz.dataReady !== false;
        return (
          <Pressable
            key={quiz.id}
            style={[styles.button, !isReady && styles.buttonDisabled]}
            disabled={!isReady}
            onPress={() => navigation.navigate('ModeSelect', { quizId: quiz.id })}
          >
            <Text style={styles.buttonText}>{quiz.title}</Text>
            {!isReady && <Text style={styles.buttonSubtext}>Coming soon — ranges not ready yet</Text>}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0b3d24',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 24,
  },
  button: {
    backgroundColor: '#1f8a4c',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#1a4d33',
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  buttonSubtext: {
    color: '#d7f0e0',
    fontSize: 13,
    marginTop: 4,
  },
});
