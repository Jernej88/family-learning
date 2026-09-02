import type { Quiz } from "./content-schema";
import type { LearningProfile, QuestionHistory } from "./learning-state";

export const REVIEW_INTERVAL_DAYS = [3, 7, 14, 30, 60, 90] as const;
export const DAILY_QUESTION_COUNT = 5;

export type ReviewQuizQuestion = Quiz["questions"][number];

export interface ReviewQuestion {
  topic: string;
  topicTitle: string;
  question: ReviewQuizQuestion;
}

export function todayDate(now: Date = new Date()): string {
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function updateQuestionHistory(
  previous: QuestionHistory | undefined,
  questionId: string,
  answerCorrect: boolean,
  today: string,
): QuestionHistory {
  const correctStreak = answerCorrect ? (previous?.correctStreak ?? 0) + 1 : 0;
  const interval = answerCorrect
    ? REVIEW_INTERVAL_DAYS[Math.min(correctStreak - 1, REVIEW_INTERVAL_DAYS.length - 1)]
    : 1;

  return {
    questionId,
    lastSeen: today,
    nextDue: addDays(today, interval),
    correctStreak,
    attempts: (previous?.attempts ?? 0) + 1,
    correct: (previous?.correct ?? 0) + (answerCorrect ? 1 : 0),
  };
}

export function selectDailyQuestions(
  questions: ReviewQuestion[],
  profile: LearningProfile,
  options: {
    today?: string;
    limit?: number;
    random?: () => number;
    excludeQuestionIds?: Iterable<string>;
  } = {},
): ReviewQuestion[] {
  const today = options.today ?? todayDate();
  const limit = options.limit ?? DAILY_QUESTION_COUNT;
  const random = options.random ?? Math.random;
  const excluded = new Set(options.excludeQuestionIds ?? []);
  const eligible = questions.filter(
    ({ topic, question }) =>
      Object.hasOwn(profile.learnedTopics, topic) &&
      question.age_min <= profile.age &&
      !excluded.has(question.id),
  );

  const overdue: ReviewQuestion[] = [];
  const weak: ReviewQuestion[] = [];
  const recent: ReviewQuestion[] = [];
  const older: ReviewQuestion[] = [];

  for (const candidate of eligible) {
    const history = profile.questionHistory[candidate.question.id];
    const learnedDaysAgo = daysBetween(profile.learnedTopics[candidate.topic], today);
    if (history && history.nextDue <= today) {
      overdue.push(candidate);
    } else if (history && history.attempts > 0 && history.correct / history.attempts < 0.7) {
      weak.push(candidate);
    } else if (!history && learnedDaysAgo >= 0 && learnedDaysAgo <= 14) {
      recent.push(candidate);
    } else if (!history) {
      older.push(candidate);
    }
  }

  overdue.sort((left, right) => {
    const leftDue = profile.questionHistory[left.question.id]!.nextDue;
    const rightDue = profile.questionHistory[right.question.id]!.nextDue;
    return leftDue.localeCompare(rightDue);
  });
  weak.sort((left, right) => successRate(profile, left) - successRate(profile, right));
  shuffle(recent, random);
  shuffle(older, random);

  const selected: ReviewQuestion[] = [];
  const selectedIds = new Set<string>();
  take(overdue, 2, selected, selectedIds);
  take(weak, 1, selected, selectedIds);
  take(recent, 1, selected, selectedIds);
  take(older, 1, selected, selectedIds);
  take(
    [...overdue, ...weak, ...recent, ...older],
    Math.max(0, limit - selected.length),
    selected,
    selectedIds,
  );

  return selected.slice(0, Math.max(0, limit));
}

function take(
  candidates: ReviewQuestion[],
  count: number,
  selected: ReviewQuestion[],
  selectedIds: Set<string>,
): void {
  let added = 0;
  for (const candidate of candidates) {
    if (added >= count) break;
    if (selectedIds.has(candidate.question.id)) continue;
    selected.push(candidate);
    selectedIds.add(candidate.question.id);
    added += 1;
  }
}

function successRate(profile: LearningProfile, candidate: ReviewQuestion): number {
  const history = profile.questionHistory[candidate.question.id]!;
  return history.correct / history.attempts;
}

function addDays(value: string, days: number): string {
  const date = new Date(`${value}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function daysBetween(fromTimestamp: string, toDate: string): number {
  const from = new Date(fromTimestamp).valueOf();
  const to = new Date(`${toDate}T23:59:59.999Z`).valueOf();
  return Math.floor((to - from) / 86_400_000);
}

function shuffle<T>(values: T[], random: () => number): void {
  for (let index = values.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [values[index], values[swapIndex]] = [values[swapIndex], values[index]];
  }
}
