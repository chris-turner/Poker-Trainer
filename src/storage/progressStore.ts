import AsyncStorage from '@react-native-async-storage/async-storage';

import type { ActionId, Combo, Position } from '../types/poker';

export interface Attempt {
  quizId: string;
  stackId: string;
  position: Position;
  combo: Combo;
  chosen: ActionId;
  correct: boolean;
  timestamp: number;
}

const STORAGE_KEY = 'pokertrainer:attempts';
const MAX_ATTEMPTS = 2000;

/** Appends one attempt to the on-device log, trimming to the most recent MAX_ATTEMPTS. */
export async function recordAttempt(attempt: Attempt): Promise<void> {
  const attempts = await getAttempts();
  attempts.push(attempt);
  const trimmed = attempts.slice(-MAX_ATTEMPTS);
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
}

export async function getAttempts(): Promise<Attempt[]> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  return raw ? (JSON.parse(raw) as Attempt[]) : [];
}

export async function clearAttempts(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEY);
}

export interface Stats {
  total: number;
  correct: number;
  percentage: number;
}

/** All-time accuracy across every recorded attempt. */
export async function getStats(): Promise<Stats> {
  const attempts = await getAttempts();
  const correct = attempts.filter((a) => a.correct).length;
  const total = attempts.length;
  return { total, correct, percentage: total === 0 ? 0 : Math.round((correct / total) * 100) };
}
