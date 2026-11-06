import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useLayoutEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { HandGrid } from '../components/HandGrid';
import { InfoModal, type InfoVariant } from '../components/InfoModal';
import { PokerTable } from '../components/PokerTable';
import { cardsFromCombo, dealTwoRandom, comboFromCards } from '../engine/cards';
import { gradeAction, type GradeResult } from '../engine/grading';
import type { RootStackParamList } from '../navigation/types';
import { quizRegistry } from '../quizzes/registry';
import type { QuizConfig, RangeData, VsRangeData } from '../quizzes/types';
import { markInfoModalSeen } from '../storage/infoStore';
import { recordAttempt } from '../storage/progressStore';
import { ALL_POSITIONS, type ActionId, type Card, type Combo, type Position } from '../types/poker';

type Props = NativeStackScreenProps<RootStackParamList, 'Table'>;

// The table block (felt + hero cards) never shrinks past this, even if the info/action/results
// block below asks for more room than is available (that's what the inner ScrollView safety net
// is for instead).
const MIN_TABLE_HEIGHT = 190;
const CONTAINER_PADDING_V = 14;
const CONTENT_GAP = 16;
// Rough height of the info row + results button + the gaps around them, reserved so the
// hand-picker grid (the tallest possible middle-region content) degrades to an internal scroll
// instead of ever pushing the results button off-screen.
const RESERVED_CHROME = 140;
// Tallest feedback state: the 26pt Correct!/Incorrect header plus one 16pt breakdown /
// "Correct action" line and the gap between them. The region keeps this height even while
// empty (before answering) so feedback appearing never causes a layout shift.
const FEEDBACK_REGION_HEIGHT = 64;
// Tall enough for the action row (16px vertical padding + 17pt label), the taller of the two
// button sets that swap through this slot.
const BUTTON_SLOT_HEIGHT = 56;
// The action buttons and Next Hand occupy the same screen spot (see buttonSlot), so a
// double-tap on one would land its second tap on the other — answering a hand the player never
// saw, or skipping feedback. Presses within this window of the slot swapping are ignored.
const SLOT_SWAP_GUARD_MS = 350;

const ACTION_LABEL: Record<ActionId, string> = {
  raise: 'Raise',
  fold: 'Fold',
  allin: 'All-in',
  call: 'Call',
};

interface Round {
  position: Position;
  cards: [Card, Card];
  combo: Combo;
  /** Only set for two-position quizzes (vs RFI, vs 3bet): who hero is reacting to this hand. */
  vsPosition?: Position;
}

function randomPosition(positions: Position[]): Position {
  return positions[Math.floor(Math.random() * positions.length)];
}

/** Picks who hero is reacting to this hand, for quizzes that need a second position. */
function randomVsPosition(quiz: QuizConfig, position: Position): Position | undefined {
  if (!quiz.vsPositionsFor) return undefined;
  return randomPosition(quiz.vsPositionsFor(position));
}

function dealRound(quiz: QuizConfig, position: Position): Round {
  const cards = dealTwoRandom();
  return { position, cards, combo: comboFromCards(cards), vsPosition: randomVsPosition(quiz, position) };
}

/**
 * Walks backward through seat order (the direction the button actually moves each hand:
 * UTG -> BB -> SB -> BTN -> CO -> HJ -> MP -> UTG1 -> UTG), skipping positions this quiz
 * doesn't cover (e.g. BB, which never opens in RFI).
 */
function nextRealisticPosition(current: Position, quizPositions: Position[]): Position {
  let idx = ALL_POSITIONS.indexOf(current);
  let candidate: Position;
  do {
    idx = (idx - 1 + ALL_POSITIONS.length) % ALL_POSITIONS.length;
    candidate = ALL_POSITIONS[idx];
  } while (!quizPositions.includes(candidate));
  return candidate;
}

export function TableScreen({ route, navigation }: Props) {
  const { quizId, stackId, mode, lockedPosition } = route.params;
  const quiz = quizRegistry[quizId];
  const stack = quiz.stacks.find((s) => s.id === stackId) ?? quiz.stacks[0];
  const isSpotCheck = mode === 'spotCheck' || mode === 'spotCheckAdvance';
  const startPosition =
    (mode === 'seatLock' || isSpotCheck) && lockedPosition
      ? lockedPosition
      : mode === 'random' || mode === 'advance' || mode === 'spotCheckAdvance'
        ? randomPosition(quiz.positions)
        : quiz.positions[0];

  const [availableHeight, setAvailableHeight] = useState(0);
  const [bottomHeight, setBottomHeight] = useState(0);
  const [currentPosition, setCurrentPosition] = useState<Position>(startPosition);
  // In Spot Check modes there's no dealt hand until the player picks one from the HandGrid.
  const [round, setRound] = useState<Round | null>(() => (isSpotCheck ? null : dealRound(quiz, startPosition)));
  const [result, setResult] = useState<GradeResult | null>(null);
  const [infoVisible, setInfoVisible] = useState(false);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: quiz.title,
      headerRight: () => (
        <Pressable
          hitSlop={8}
          style={styles.infoButton}
          onPress={() => {
            setInfoVisible(true);
            // Best-effort: the flag only gates the first-time hint on ModeSelect.
            markInfoModalSeen().catch(() => {});
          }}
        >
          <Text style={styles.infoButtonText}>?</Text>
        </Pressable>
      ),
    });
  }, [navigation]);

  const actions = round ? quiz.actionsForPosition(round.position) : [];
  const distribution =
    round && quiz.vsPositionsFor && round.vsPosition
      ? ((stack.data as VsRangeData).positions[round.position]?.[round.vsPosition]?.[round.combo] ?? {})
      : round
        ? ((stack.data as RangeData).positions[round.position]?.[round.combo] ?? {})
        : {};

  // Timestamp of the last press that swapped the button slot's contents (answer <-> next hand).
  const slotSwapAtRef = useRef(0);
  const slotJustSwapped = () => {
    const now = Date.now();
    if (now - slotSwapAtRef.current < SLOT_SWAP_GUARD_MS) return true;
    slotSwapAtRef.current = now;
    return false;
  };

  const handleAction = (action: ActionId) => {
    if (!round) return;
    if (slotJustSwapped()) return;
    const grade = gradeAction(distribution, action);
    setResult(grade);
    recordAttempt({
      quizId: quiz.id,
      stackId: stack.id,
      position: round.position,
      combo: round.combo,
      chosen: action,
      correct: grade.correct,
      timestamp: Date.now(),
    }).catch(() => {
      // Best-effort local logging; a failed write shouldn't block the quiz.
    });
  };

  const handleHandPicked = (combo: Combo) => {
    setRound({
      position: currentPosition,
      cards: cardsFromCombo(combo),
      combo,
      vsPosition: randomVsPosition(quiz, currentPosition),
    });
  };

  const nextHand = () => {
    if (slotJustSwapped()) return;
    if (mode === 'advance') {
      const next = nextRealisticPosition(currentPosition, quiz.positions);
      setCurrentPosition(next);
      setRound(dealRound(quiz, next));
    } else if (mode === 'random') {
      const next = randomPosition(quiz.positions);
      setCurrentPosition(next);
      setRound(dealRound(quiz, next));
    } else if (mode === 'spotCheckAdvance') {
      const next = nextRealisticPosition(currentPosition, quiz.positions);
      setCurrentPosition(next);
      setRound(null);
    } else if (mode === 'spotCheck') {
      setRound(null);
    } else {
      setRound(dealRound(quiz, currentPosition));
    }
    setResult(null);
  };

  // Everything below the table (info row, action/feedback/hand-grid content, results button) is
  // measured at its natural size — the table is what yields room to it, not the other way
  // around, so those controls are never squeezed or clipped. The table gets *all* the leftover
  // space (up to its own aspect-ratio ceiling, see PokerTable), rather than a fixed percentage,
  // so there's no dead gap stranded between the table and the controls on tall screens.
  const contentAreaHeight = availableHeight ? availableHeight - CONTAINER_PADDING_V * 2 : 0;
  const tableMaxHeight = contentAreaHeight
    ? Math.max(MIN_TABLE_HEIGHT, contentAreaHeight - bottomHeight - CONTENT_GAP)
    : undefined;
  const middleMaxHeight = contentAreaHeight
    ? Math.max(80, contentAreaHeight - RESERVED_CHROME - MIN_TABLE_HEIGHT - CONTENT_GAP)
    : undefined;

  return (
    <View style={styles.screen} onLayout={(e) => setAvailableHeight(e.nativeEvent.layout.height)}>
      <View style={styles.container}>
        <PokerTable
          heroPosition={currentPosition}
          heroCards={round?.cards}
          maxHeight={tableMaxHeight}
          raiserPosition={round?.vsPosition}
        />

        <View style={styles.bottomBlock} onLayout={(e) => setBottomHeight(e.nativeEvent.layout.height)}>
          <View style={styles.infoRow}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{currentPosition}</Text>
            </View>
            <Text style={styles.stackText}>{stack.stackBB} BB</Text>
            {quiz.vsLabel && round?.vsPosition && (
              <Text style={styles.vsText}>
                vs {round.vsPosition} {quiz.vsLabel}
              </Text>
            )}
          </View>

          {!round ? (
            <ScrollView
              style={[styles.middleScroll, middleMaxHeight ? { maxHeight: middleMaxHeight } : null]}
              contentContainerStyle={styles.middleScrollContent}
              showsVerticalScrollIndicator={false}
            >
              <HandGrid onSelect={handleHandPicked} />
            </ScrollView>
          ) : (
            <>
              {/* Fixed-height region that's always mounted (empty before answering) so the
                  feedback appearing never pushes the rows below it — see FEEDBACK_REGION_HEIGHT. */}
              <View style={styles.feedbackRegion}>{result && <FeedbackContent result={result} />}</View>

              {/* One fixed-height slot for whichever button set is active — action buttons
                  before answering, Next Hand after — so the swap can't move the Results button. */}
              <View style={styles.buttonSlot}>
                {result ? (
                  <Pressable style={styles.nextButton} onPress={nextHand}>
                    <Text style={styles.nextButtonText}>Next Hand</Text>
                  </Pressable>
                ) : (
                  <View style={styles.actionRow}>
                    {actions.map((action) => (
                      <Pressable key={action} style={styles.actionButton} onPress={() => handleAction(action)}>
                        <Text style={styles.actionButtonText}>{ACTION_LABEL[action]}</Text>
                      </Pressable>
                    ))}
                  </View>
                )}
              </View>
            </>
          )}

          <Pressable style={styles.resultsButton} onPress={() => navigation.navigate('Results')}>
            <Text style={styles.resultsButtonText}>Results</Text>
          </Pressable>
        </View>
      </View>

      <InfoModal visible={infoVisible} onClose={() => setInfoVisible(false)} variant={quiz.id as InfoVariant} />
    </View>
  );
}

function FeedbackContent({ result }: { result: GradeResult }) {
  const nonzero = Object.entries(result.distribution)
    .filter(([, freq]) => (freq ?? 0) > 0)
    .sort(([, a], [, b]) => (b ?? 0) - (a ?? 0));
  const breakdown = nonzero.map(([action, freq]) => `${ACTION_LABEL[action as ActionId]} ${freq}%`).join('  /  ');

  return (
    <>
      <Text style={[styles.feedbackHeader, result.correct ? styles.correct : styles.incorrect]}>
        {result.correct ? 'Correct!' : 'Incorrect'}
      </Text>
      {result.isMixed && <Text style={styles.breakdown}>{breakdown}</Text>}
      {!result.isMixed && !result.correct && (
        <Text style={styles.breakdown}>Correct action: {ACTION_LABEL[nonzero[0][0] as ActionId]}</Text>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#0b3d24',
  },
  // Two children — the table and the block of controls below it — spread across the full
  // height with justifyContent, so any leftover space becomes breathing room between them
  // instead of dead space stranded below the results button.
  container: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: CONTENT_GAP,
    paddingVertical: CONTAINER_PADDING_V,
    paddingHorizontal: 12,
  },
  // Naturally sized (not stretched), so the info row, action/feedback/grid content, and results
  // button always render at their real size — the table above is what shrinks to make room.
  bottomBlock: {
    width: '100%',
    alignItems: 'center',
    gap: CONTENT_GAP,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  // Hugs its content up to middleMaxHeight; only content taller than that (the hand-picker
  // grid, on a small screen) scrolls internally, keeping the results button always visible.
  middleScroll: {
    width: '100%',
  },
  middleScrollContent: {
    width: '100%',
    alignItems: 'center',
  },
  badge: {
    backgroundColor: '#3f51b5',
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  badgeText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
  },
  stackText: {
    color: '#d7f0e0',
    fontSize: 18,
  },
  vsText: {
    color: '#d9822b',
    fontSize: 15,
    fontWeight: '600',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#1f8a4c',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
  },
  // Permanently reserved space for the feedback text, sized to fit its tallest state (the
  // Correct!/Incorrect header plus a breakdown/"Correct action" line). Rendered empty at the
  // same height before answering, so feedback appearing can't shift anything around it.
  feedbackRegion: {
    height: FEEDBACK_REGION_HEIGHT,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  // Shared fixed-height slot for the action row / Next Hand swap; both render centered inside
  // it, so trading one for the other can't move the Results button below.
  buttonSlot: {
    height: BUTTON_SLOT_HEIGHT,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  feedbackHeader: {
    fontSize: 26,
    fontWeight: '700',
  },
  correct: {
    color: '#6fd88a',
  },
  incorrect: {
    color: '#f28b82',
  },
  breakdown: {
    color: '#fff',
    fontSize: 16,
  },
  nextButton: {
    backgroundColor: '#1f8a4c',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
  },
  nextButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
  },
  resultsButton: {
    backgroundColor: '#3f51b5',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
  },
  resultsButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
  },
  // Lives in the navigation header (light background), hence the filled indigo circle.
  infoButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#3f51b5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
