import type { Quiz } from "./content-schema";

export const QUESTIONS_PER_QUIZ = 5;
export const QUIZ_SESSION_VERSION = 1;

export type QuizQuestion = Quiz["questions"][number];

export interface QuizAnswer {
  selectedIndex: number;
  correct: boolean;
}

export interface QuizSession {
  version: typeof QUIZ_SESSION_VERSION;
  topic: string;
  questionIds: string[];
  currentIndex: number;
  answers: Record<string, QuizAnswer>;
  completed: boolean;
  completedAt?: string;
}

export function getQuestionOptions(question: QuizQuestion): string[] {
  return question.type === "multiple_choice" ? question.options : ["Drži", "Ne drži"];
}

export function getCorrectAnswerIndex(question: QuizQuestion): number {
  if (question.type === "multiple_choice") return question.correct;
  return question.correct ? 0 : 1;
}

export function evaluateAnswer(question: QuizQuestion, selectedIndex: number): boolean {
  return selectedIndex === getCorrectAnswerIndex(question);
}

export function createQuizSession(
  quiz: Quiz,
  random: () => number = Math.random,
): QuizSession {
  const questionIds = quiz.questions.map((question) => question.id);

  for (let index = questionIds.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [questionIds[index], questionIds[swapIndex]] = [questionIds[swapIndex], questionIds[index]];
  }

  return {
    version: QUIZ_SESSION_VERSION,
    topic: quiz.topic,
    questionIds: questionIds.slice(0, QUESTIONS_PER_QUIZ),
    currentIndex: 0,
    answers: {},
    completed: false,
  };
}

export function answerCurrentQuestion(
  session: QuizSession,
  question: QuizQuestion,
  selectedIndex: number,
): QuizSession {
  if (session.completed || session.questionIds[session.currentIndex] !== question.id) {
    return session;
  }
  if (session.answers[question.id]) return session;
  if (!Number.isInteger(selectedIndex) || selectedIndex < 0 || selectedIndex >= getQuestionOptions(question).length) {
    return session;
  }

  return {
    ...session,
    answers: {
      ...session.answers,
      [question.id]: {
        selectedIndex,
        correct: evaluateAnswer(question, selectedIndex),
      },
    },
  };
}

export function advanceQuizSession(
  session: QuizSession,
  completedAt: string = new Date().toISOString(),
): QuizSession {
  const currentQuestionId = session.questionIds[session.currentIndex];
  if (session.completed || !session.answers[currentQuestionId]) return session;

  if (session.currentIndex === session.questionIds.length - 1) {
    return { ...session, completed: true, completedAt };
  }

  return { ...session, currentIndex: session.currentIndex + 1 };
}

export function restoreQuizSession(input: unknown, quiz: Quiz): QuizSession | null {
  if (!isRecord(input)) return null;
  if (
    input.version !== QUIZ_SESSION_VERSION ||
    input.topic !== quiz.topic ||
    !Array.isArray(input.questionIds) ||
    input.questionIds.length === 0 ||
    input.questionIds.length > QUESTIONS_PER_QUIZ ||
    !input.questionIds.every((id) => typeof id === "string") ||
    new Set(input.questionIds).size !== input.questionIds.length ||
    !Number.isInteger(input.currentIndex) ||
    (input.currentIndex as number) < 0 ||
    (input.currentIndex as number) >= input.questionIds.length ||
    typeof input.completed !== "boolean" ||
    !isRecord(input.answers)
  ) {
    return null;
  }

  const questionsById = new Map(quiz.questions.map((question) => [question.id, question]));
  if (!input.questionIds.every((id) => questionsById.has(id))) return null;

  const answers: Record<string, QuizAnswer> = {};
  for (const [questionId, value] of Object.entries(input.answers)) {
    const question = questionsById.get(questionId);
    if (!question || !input.questionIds.includes(questionId) || !isRecord(value)) return null;
    if (
      !Number.isInteger(value.selectedIndex) ||
      (value.selectedIndex as number) < 0 ||
      (value.selectedIndex as number) >= getQuestionOptions(question).length ||
      typeof value.correct !== "boolean" ||
      value.correct !== evaluateAnswer(question, value.selectedIndex as number)
    ) {
      return null;
    }
    answers[questionId] = {
      selectedIndex: value.selectedIndex as number,
      correct: value.correct,
    };
  }

  const currentIndex = input.currentIndex as number;
  const completed = input.completed;
  const requiredAnswerCount = completed ? input.questionIds.length : currentIndex;
  if (input.questionIds.slice(0, requiredAnswerCount).some((id) => !answers[id])) return null;
  if (input.questionIds.slice(currentIndex + 1).some((id) => answers[id])) return null;
  if (completed && (!answers[input.questionIds[currentIndex]] || typeof input.completedAt !== "string")) {
    return null;
  }
  if (!completed && input.completedAt !== undefined) return null;

  return {
    version: QUIZ_SESSION_VERSION,
    topic: quiz.topic,
    questionIds: input.questionIds as string[],
    currentIndex,
    answers,
    completed,
    ...(completed ? { completedAt: input.completedAt as string } : {}),
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
