import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'pokertrainer:infoModalSeen';

/** Whether the user has ever opened the "What is RFI?" info modal; gates the first-time hint. */
export async function hasSeenInfoModal(): Promise<boolean> {
  return (await AsyncStorage.getItem(STORAGE_KEY)) === 'true';
}

export async function markInfoModalSeen(): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, 'true');
}
