import type { Quiz } from "./content-schema";
import { restoreQuizSession, type QuizSession } from "./quiz-session";

const STORAGE_PREFIX = "family-learning:v1:quiz:";

export interface QuizStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export function loadQuizSession(storage: QuizStorage | undefined, quiz: Quiz): QuizSession | null {
  if (!storage) return null;

  try {
    const value = storage.getItem(storageKey(quiz.topic));
    return value === null ? null : restoreQuizSession(JSON.parse(value), quiz);
  } catch {
    return null;
  }
}

export function saveQuizSession(
  storage: QuizStorage | undefined,
  session: QuizSession,
): boolean {
  if (!storage) return false;

  try {
    storage.setItem(storageKey(session.topic), JSON.stringify(session));
    return true;
  } catch {
    return false;
  }
}

export function clearQuizSession(storage: QuizStorage | undefined, topic: string): boolean {
  if (!storage) return false;

  try {
    storage.removeItem(storageKey(topic));
    return true;
  } catch {
    return false;
  }
}

function storageKey(topic: string): string {
  return `${STORAGE_PREFIX}${topic}`;
}
