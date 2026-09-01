import { describe, expect, it } from "vitest";

import type { Quiz } from "./content-schema";
import { createQuizSession } from "./quiz-session";
import { clearQuizSession, loadQuizSession, saveQuizSession, type QuizStorage } from "./quiz-storage";

const quiz: Quiz = {
  topic: "luna",
  questions: [
    {
      id: "luna-001",
      type: "true_false",
      concept: "orbita",
      difficulty: 1,
      age_min: 7,
      question: "Luna kroži okoli Zemlje.",
      correct: true,
      explanation: "Luna zaradi gravitacije kroži okoli Zemlje.",
    },
  ],
};

class MemoryStorage implements QuizStorage {
  items = new Map<string, string>();

  getItem(key: string): string | null {
    return this.items.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.items.set(key, value);
  }

  removeItem(key: string): void {
    this.items.delete(key);
  }
}

describe("quiz storage", () => {
  it("saves, loads, and clears a session", () => {
    const storage = new MemoryStorage();
    const session = createQuizSession(quiz);

    expect(saveQuizSession(storage, session)).toBe(true);
    expect(loadQuizSession(storage, quiz)).toEqual(session);
    expect(clearQuizSession(storage, quiz.topic)).toBe(true);
    expect(loadQuizSession(storage, quiz)).toBeNull();
  });

  it("ignores malformed and unavailable storage", () => {
    const malformed = new MemoryStorage();
    malformed.items.set("family-learning:v1:quiz:luna", "not json");
    const unavailable: QuizStorage = {
      getItem: () => {
        throw new Error("blocked");
      },
      setItem: () => {
        throw new Error("blocked");
      },
      removeItem: () => {
        throw new Error("blocked");
      },
    };

    expect(loadQuizSession(malformed, quiz)).toBeNull();
    expect(loadQuizSession(unavailable, quiz)).toBeNull();
    expect(saveQuizSession(unavailable, createQuizSession(quiz))).toBe(false);
    expect(clearQuizSession(unavailable, quiz.topic)).toBe(false);
  });
});
