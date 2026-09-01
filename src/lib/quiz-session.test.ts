import { describe, expect, it } from "vitest";

import type { Quiz } from "./content-schema";
import {
  advanceQuizSession,
  answerCurrentQuestion,
  createQuizSession,
  evaluateAnswer,
  getQuestionOptions,
  restoreQuizSession,
} from "./quiz-session";

const quiz: Quiz = {
  topic: "luna",
  questions: Array.from({ length: 6 }, (_, index) =>
    index === 1
      ? {
          id: "luna-002",
          type: "true_false" as const,
          concept: "gravitacija",
          difficulty: 1,
          age_min: 7,
          question: "Gravitacija deluje tudi v vesolju.",
          correct: true,
          explanation: "Gravitacija deluje tudi daleč od Zemljinega površja.",
        }
      : {
          id: `luna-${String(index + 1).padStart(3, "0")}`,
          type: "multiple_choice" as const,
          concept: "orbita",
          difficulty: 1,
          age_min: 7,
          question: `Vprašanje ${index + 1} o Lunini orbiti?`,
          options: ["Prvi odgovor", "Drugi odgovor", "Tretji odgovor"],
          correct: 1,
          explanation: "Drugi odgovor pravilno pojasni Lunino gibanje okoli Zemlje.",
        },
  ),
};

describe("quiz sessions", () => {
  it("selects five unique questions", () => {
    const session = createQuizSession(quiz, () => 0.4);

    expect(session.questionIds).toHaveLength(5);
    expect(new Set(session.questionIds)).toHaveLength(5);
    expect(session.questionIds.every((id) => quiz.questions.some((question) => question.id === id))).toBe(true);
  });

  it("evaluates both supported question types", () => {
    const multipleChoice = quiz.questions[0];
    const trueFalse = quiz.questions[1];

    expect(evaluateAnswer(multipleChoice, 1)).toBe(true);
    expect(evaluateAnswer(multipleChoice, 0)).toBe(false);
    expect(getQuestionOptions(trueFalse)).toEqual(["Drži", "Ne drži"]);
    expect(evaluateAnswer(trueFalse, 0)).toBe(true);
  });

  it("locks answers, advances, and completes the final question", () => {
    let session = createQuizSession(quiz, () => 0.4);
    const firstQuestion = quiz.questions.find((question) => question.id === session.questionIds[0])!;
    const answered = answerCurrentQuestion(session, firstQuestion, 0);
    const locked = answerCurrentQuestion(answered, firstQuestion, 1);

    expect(locked).toBe(answered);
    session = advanceQuizSession(locked);
    expect(session.currentIndex).toBe(1);

    while (!session.completed) {
      const question = quiz.questions.find(
        (candidate) => candidate.id === session.questionIds[session.currentIndex],
      )!;
      session = answerCurrentQuestion(session, question, 0);
      session = advanceQuizSession(session, "2026-09-01T10:00:00.000Z");
    }

    expect(session.completed).toBe(true);
    expect(session.completedAt).toBe("2026-09-01T10:00:00.000Z");
    expect(restoreQuizSession(JSON.parse(JSON.stringify(session)), quiz)).toEqual(session);
  });

  it("restores valid progress and rejects stale or tampered data", () => {
    const initial = createQuizSession(quiz, () => 0.4);
    const firstQuestion = quiz.questions.find((question) => question.id === initial.questionIds[0])!;
    const answered = answerCurrentQuestion(initial, firstQuestion, 0);

    expect(restoreQuizSession(JSON.parse(JSON.stringify(answered)), quiz)).toEqual(answered);
    expect(restoreQuizSession({ ...answered, topic: "druga-tema" }, quiz)).toBeNull();
    expect(
      restoreQuizSession(
        {
          ...answered,
          answers: {
            [firstQuestion.id]: {
              selectedIndex: 0,
              correct: !answered.answers[firstQuestion.id].correct,
            },
          },
        },
        quiz,
      ),
    ).toBeNull();
  });
});
