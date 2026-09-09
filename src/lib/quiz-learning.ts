import {
  getActiveProfile,
  loadLearningState,
  saveLearningState,
  setQuestionHistory,
  type LearningStorage,
} from "./learning-state";
import { todayDate, updateQuestionHistory } from "./review";

export function recordQuizQuestionHistory(
  storage: LearningStorage | undefined,
  trackLearningHistory: boolean,
  questionId: string,
  answerCorrect: boolean,
  today: string = todayDate(),
): boolean {
  if (!trackLearningHistory) return false;

  const learningState = loadLearningState(storage);
  const profile = getActiveProfile(learningState);
  if (!profile) return false;

  const history = updateQuestionHistory(
    profile.questionHistory[questionId],
    questionId,
    answerCorrect,
    today,
  );
  const nextLearningState = setQuestionHistory(learningState, profile.id, history);
  return saveLearningState(storage, nextLearningState);
}
