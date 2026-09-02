import { describe, expect, it } from "vitest";

import type { LearningProfile, QuestionHistory } from "./learning-state";
import {
  REVIEW_INTERVAL_DAYS,
  selectDailyQuestions,
  todayDate,
  updateQuestionHistory,
  type ReviewQuestion,
} from "./review";

function history(
  questionId: string,
  overrides: Partial<QuestionHistory> = {},
): QuestionHistory {
  return {
    questionId,
    lastSeen: "2026-08-01",
    nextDue: "2026-08-04",
    correctStreak: 1,
    attempts: 1,
    correct: 1,
    ...overrides,
  };
}

function candidate(id: string, topic = "luna", age = 7): ReviewQuestion {
  return {
    topic,
    topicTitle: topic === "luna" ? "Luna" : "Vulkani",
    question: {
      id,
      type: "true_false",
      concept: "orbita",
      difficulty: 1,
      age_min: age,
      question: `Vprašanje ${id}?`,
      correct: true,
      explanation: "Razlaga pravilnega odgovora.",
    },
  };
}

function profile(overrides: Partial<LearningProfile> = {}): LearningProfile {
  return {
    id: "child-1",
    label: "Otrok 1",
    age: 10,
    createdAt: "2026-08-01T10:00:00.000Z",
    learnedTopics: {
      luna: "2026-08-25T10:00:00.000Z",
      vulkani: "2026-01-01T10:00:00.000Z",
    },
    questionHistory: {},
    ...overrides,
  };
}

describe("review scheduling", () => {
  it("uses the configured correct-answer intervals and caps at 90 days", () => {
    let current: QuestionHistory | undefined;
    const dueDates: string[] = [];

    for (let index = 0; index < REVIEW_INTERVAL_DAYS.length + 1; index += 1) {
      current = updateQuestionHistory(current, "luna-001", true, "2026-09-01");
      dueDates.push(current.nextDue);
    }

    expect(dueDates).toEqual([
      "2026-09-04",
      "2026-09-08",
      "2026-09-15",
      "2026-10-01",
      "2026-10-31",
      "2026-11-30",
      "2026-11-30",
    ]);
  });

  it("schedules an incorrect answer tomorrow and resets the streak", () => {
    const result = updateQuestionHistory(
      history("luna-001", { correctStreak: 4, attempts: 5, correct: 4 }),
      "luna-001",
      false,
      "2026-09-01",
    );

    expect(result).toEqual({
      questionId: "luna-001",
      lastSeen: "2026-09-01",
      nextDue: "2026-09-02",
      correctStreak: 0,
      attempts: 6,
      correct: 4,
    });
  });

  it("formats the learner's local calendar date", () => {
    expect(todayDate(new Date(2026, 8, 1, 23, 30))).toBe("2026-09-01");
  });
});

describe("daily question selection", () => {
  it("selects a five-question priority mix without duplicates", () => {
    const questions = [
      candidate("luna-001"),
      candidate("luna-002"),
      candidate("luna-003"),
      candidate("luna-004"),
      candidate("luna-005"),
      candidate("vulkani-001", "vulkani"),
    ];
    const learner = profile({
      questionHistory: {
        "luna-001": history("luna-001", { nextDue: "2026-08-20" }),
        "luna-002": history("luna-002", { nextDue: "2026-08-25" }),
        "luna-003": history("luna-003", { nextDue: "2026-09-20", attempts: 4, correct: 1 }),
      },
    });

    const selected = selectDailyQuestions(questions, learner, {
      today: "2026-09-01",
      random: () => 0.5,
    });

    expect(selected).toHaveLength(5);
    expect(selected.slice(0, 2).map(({ question }) => question.id)).toEqual([
      "luna-001",
      "luna-002",
    ]);
    expect(selected[2].question.id).toBe("luna-003");
    expect(new Set(selected.map(({ question }) => question.id)).size).toBe(5);
  });

  it("uses only learned, age-appropriate, non-excluded questions", () => {
    const questions = [
      candidate("luna-001"),
      candidate("luna-002", "luna", 11),
      candidate("vulkani-001", "vulkani"),
      candidate("morje-001", "morje"),
    ];
    const learner = profile({ age: 10 });

    const selected = selectDailyQuestions(questions, learner, {
      today: "2026-09-01",
      limit: 5,
      excludeQuestionIds: ["vulkani-001"],
    });

    expect(selected.map(({ question }) => question.id)).toEqual(["luna-001"]);
  });

  it("does not treat inherited object properties as learned topics", () => {
    const learner = profile({ learnedTopics: {} });

    expect(
      selectDailyQuestions([candidate("constructor-001", "constructor")], learner, {
        today: "2026-09-01",
      }),
    ).toEqual([]);
  });

  it("does not resurface a healthy question before its due date", () => {
    const learner = profile({
      questionHistory: {
        "luna-001": history("luna-001", {
          nextDue: "2026-09-10",
          attempts: 2,
          correct: 2,
        }),
      },
    });

    expect(
      selectDailyQuestions([candidate("luna-001")], learner, { today: "2026-09-01" }),
    ).toEqual([]);
  });
});
