import { StyleSheet, Text, View } from 'react-native';

/** Two overlapping face-down mini cards, used for opponent seats around the table. */
export function CardBack() {
  return (
    <View style={styles.wrap}>
      <View style={[styles.mini, styles.left]}>
        <Text style={styles.star}>★</Text>
      </View>
      <View style={[styles.mini, styles.right]}>
        <Text style={styles.star}>★</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: 40,
    height: 34,
    flexDirection: 'row',
  },
  mini: {
    position: 'absolute',
    width: 24,
    height: 34,
    borderRadius: 4,
    backgroundColor: '#5a6472',
    borderWidth: 1,
    borderColor: '#7c8896',
    alignItems: 'center',
    justifyContent: 'center',
  },
  left: {
    left: 0,
  },
  right: {
    left: 16,
  },
  star: {
    color: '#3d4552',
    fontSize: 11,
  },
});
