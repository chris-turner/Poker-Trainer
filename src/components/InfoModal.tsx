import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

export type InfoVariant = 'rfi' | 'vsRfi' | 'vs3bet';

const VARIANT_CONTENT: Record<InfoVariant, { heading: string; body: string }> = {
  rfi: {
    heading: 'What is RFI?',
    body:
      'RFI stands for “Raise First In” — the decision you face when everyone before you has folded and ' +
      "you're the first player to voluntarily enter the pot. Your options are to raise, go all-in, or " +
      'fold (and from the small blind, you can also call to complete the blind).',
  },
  vsRfi: {
    heading: 'What is "Vs RFI"?',
    body:
      "This quiz drills the decision you face when a player before you has already raised first in (RFI'd) " +
      'and it folds around to you. Your options are to fold, call, 3bet to a standard sizing, or ' +
      'go all-in — which is correct depends on both your hand and who opened.',
  },
  vs3bet: {
    heading: 'What is "Vs 3bet"?',
    body:
      "This quiz drills the decision you face after you've raised first in (RFI'd) and a player acting " +
      "after you re-raises all-in (3bets). At this stack depth you're deciding whether to call off the " +
      'rest of your stack or fold — which is correct depends on both your hand and who 3bet you.',
  },
};

/**
 * Beginner intro to the current quiz and its range data, opened from the "?" header button.
 * Dismissible by tapping the backdrop or the Close button.
 */
export function InfoModal({
  visible,
  onClose,
  variant = 'rfi',
}: {
  visible: boolean;
  onClose: () => void;
  variant?: InfoVariant;
}) {
  const { heading, body } = VARIANT_CONTENT[variant];
  return (
<Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        {/* Backdrop is a sibling of the card, not its parent, so taps on the card never dismiss. */}
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={styles.card}>
          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            <Text style={styles.heading}>{heading}</Text>
            <Text style={styles.body}>{body}</Text>

            <Text style={styles.heading}>About these ranges</Text>
            <Text style={styles.body}>
              The answers in this quiz come from simplified solver-based charts. 
            </Text>
            <Text style={styles.body}>
              • Mixed strategies (e.g. “Raise 50% / Fold 50%”) mean either action is fine — good players randomize them.
            </Text>
            <Text style={styles.body}>
              • Real-game decisions involve more than any chart can capture: opponent tendencies, exact stack sizes at the table, ICM pressure in tournaments, and antes all shift correct play.
            </Text>
            <Text style={[styles.body, { marginTop: 8 }]}>
              Use these ranges as a guide, not a rulebook.
            </Text>
          </ScrollView>
          <Pressable style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>Close</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  card: {
    width: "100%",
    maxWidth: 420,
    maxHeight: "92%",
    backgroundColor: "#0b3d24",
    borderWidth: 2,
    borderColor: "#1f8a4c",
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  content: {
    gap: 6,
  },
  heading: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
    marginTop: 4,
  },
  body: {
    color: "#d7f0e0",
    fontSize: 14,
    lineHeight: 19,
  },
  closeButton: {
    backgroundColor: "#1f8a4c",
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  closeButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
