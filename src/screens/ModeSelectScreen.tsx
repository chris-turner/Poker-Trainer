import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { InfoModal, type InfoVariant } from '../components/InfoModal';
import { quizRegistry } from '../quizzes/registry';
import type { QuizMode } from '../quizzes/types';
import type { RootStackParamList } from '../navigation/types';
import { hasSeenInfoModal, markInfoModalSeen } from '../storage/infoStore';
import type { Position } from '../types/poker';

type Props = NativeStackScreenProps<RootStackParamList, 'ModeSelect'>;

// Spot Check modes are hidden for now; flip this to bring their menu entries back.
const SHOW_SPOT_CHECK = false;

export function ModeSelectScreen({ route, navigation }: Props) {
  const { quizId } = route.params;
  const quiz = quizRegistry[quizId];
  const [positionPickerMode, setPositionPickerMode] = useState<QuizMode | null>(null);
  const [showIntroHint, setShowIntroHint] = useState(false);
  const [infoVisible, setInfoVisible] = useState(false);

  const openInfo = () => {
    setInfoVisible(true);
    setShowIntroHint(false);
    // Best-effort: the flag only gates the first-time hint.
    markInfoModalSeen().catch(() => {});
  };

  // Re-checked on every focus so the hint disappears once the user has opened the info modal
  // on the table screen and navigated back here.
  useFocusEffect(
    useCallback(() => {
      let active = true;
      hasSeenInfoModal()
        .then((seen) => {
          if (active) setShowIntroHint(!seen);
        })
        .catch(() => {});
      return () => {
        active = false;
      };
    }, []),
  );

  const startTable = (mode: QuizMode, lockedPosition?: Position) => {
    navigation.navigate('Table', {
      quizId: quiz.id,
      stackId: quiz.defaultStackId,
      mode,
      lockedPosition,
    });
  };

  if (positionPickerMode) {
    return (
      <ScrollView style={styles.screen} contentContainerStyle={styles.container}>
        <Text style={styles.title}>Choose a Position</Text>
        <View style={styles.grid}>
          {quiz.positions.map((position) => (
            <Pressable
              key={position}
              style={styles.posButton}
              onPress={() => startTable(positionPickerMode, position)}
            >
              <Text style={styles.buttonText}>{position}</Text>
            </Pressable>
          ))}
        </View>
        <Pressable style={styles.backButton} onPress={() => setPositionPickerMode(null)}>
          <Text style={styles.backButtonText}>Back</Text>
        </Pressable>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.container}>
      <Text style={styles.title}>{quiz.title}</Text>
      <Pressable style={styles.button} onPress={() => startTable('advance')}>
        <Text style={styles.buttonText}>Advance Seat</Text>
        <Text style={styles.buttonSubtext}>Move through every position in order</Text>
      </Pressable>
      <Pressable style={styles.button} onPress={() => setPositionPickerMode('seatLock')}>
        <Text style={styles.buttonText}>Seat Lock</Text>
        <Text style={styles.buttonSubtext}>Repeat the same position every hand</Text>
      </Pressable>
      <Pressable style={styles.button} onPress={() => startTable('random')}>
        <Text style={styles.buttonText}>Random Spot</Text>
        <Text style={styles.buttonSubtext}>Get a random seat every hand</Text>
      </Pressable>
      {SHOW_SPOT_CHECK && (
        <>
          <Pressable style={styles.button} onPress={() => setPositionPickerMode('spotCheck')}>
            <Text style={styles.buttonText}>Spot Check</Text>
            <Text style={styles.buttonSubtext}>Pick a position and a specific hand to check</Text>
          </Pressable>
          <Pressable style={styles.button} onPress={() => setPositionPickerMode('spotCheckAdvance')}>
            <Text style={styles.buttonText}>Spot Check Advance Seat</Text>
            <Text style={styles.buttonSubtext}>Pick a hand, then advance a seat and pick another</Text>
          </Pressable>
        </>
      )}
      <Pressable style={styles.infoButton} hitSlop={8} onPress={openInfo}>
        <Text style={styles.infoButtonText}>?</Text>
      </Pressable>
      {showIntroHint && <Text style={styles.introHint}>New to preflop ranges? Tap the ? for a quick intro.</Text>}

      <InfoModal visible={infoVisible} onClose={() => setInfoVisible(false)} variant={quiz.id as InfoVariant} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#0b3d24',
  },
  container: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    padding: 24,
  },
  title: {
    fontSize: 24,
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
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'center',
  },
  posButton: {
    backgroundColor: '#1f8a4c',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 10,
    minWidth: 80,
    alignItems: 'center',
  },
  backButton: {
    marginTop: 24,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  backButtonText: {
    color: '#d7f0e0',
    fontSize: 15,
  },
  introHint: {
    color: '#d7f0e0',
    fontSize: 13,
    textAlign: 'center',
  },
  infoButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#3f51b5',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  infoButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
});
