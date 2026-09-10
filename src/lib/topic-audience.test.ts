import { describe, expect, it } from "vitest";

import type { Quiz } from "./content-schema";
import {
  addProfile,
  createLearningState,
  loadLearningState,
  saveLearningState,
  type LearningStorage,
} from "./learning-state";
import { recordQuizQuestionHistory } from "./quiz-learning";
import { answerCurrentQuestion, createQuizSession } from "./quiz-session";
import { loadQuizSession, saveQuizSession, type QuizStorage } from "./quiz-storage";
import { getTopicAudienceBehavior, isPublishedChildTopic } from "./topic-audience";

class MemoryStorage implements LearningStorage, QuizStorage {
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

const adultQuiz: Quiz = {
  topic: "adult-topic",
  questions: [
    {
      id: "adult-topic-001",
      type: "true_false",
      concept: "postopek",
      difficulty: 1,
      age_min: 18,
      question: "Ali je to vprašanje za odrasle?",
      correct: true,
      explanation: "Vprašanje je del samostojnega kviza za odraslo temo.",
    },
  ],
};

describe("topic audience behavior", () => {
  it("keeps adult completion and recall out of child learning while retaining quiz state", () => {
    const behavior = getTopicAudienceBehavior("adult");
    expect(behavior).toEqual({ showCompletion: false, trackLearningHistory: false });
    expect(isPublishedChildTopic({ data: { audience: "adult", status: "published" } })).toBe(
      false,
    );

    const storage = new MemoryStorage();
    const learningState = addProfile(createLearningState(), {
      id: "child-1",
      label: "Otrok",
      age: 10,
      createdAt: "2026-09-01T10:00:00.000Z",
    });
    expect(saveLearningState(storage, learningState)).toBe(true);

    const question = adultQuiz.questions[0];
    const session = answerCurrentQuestion(createQuizSession(adultQuiz), question, 0);
    expect(saveQuizSession(storage, session)).toBe(true);
    const answer = session.answers[question.id];
    expect(answer).toBeDefined();
    expect(
      recordQuizQuestionHistory(
        storage,
        behavior.trackLearningHistory,
        question.id,
        answer!.correct,
      ),
    ).toBe(false);

    expect(loadQuizSession(storage, adultQuiz)).toEqual(session);
    expect(loadLearningState(storage)).toEqual(learningState);
  });

  it("keeps child completion, quiz history, and review eligibility enabled", () => {
    expect(getTopicAudienceBehavior("child")).toEqual({
      showCompletion: true,
      trackLearningHistory: true,
    });
    expect(isPublishedChildTopic({ data: { audience: "child", status: "published" } })).toBe(
      true,
    );
    expect(isPublishedChildTopic({ data: { audience: "child", status: "draft" } })).toBe(false);
  });
});
