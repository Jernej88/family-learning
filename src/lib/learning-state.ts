export const LEARNING_STATE_VERSION = 1;
export const LEARNING_STATE_EVENT = "family-learning:state-changed";

const STORAGE_KEY = "family-learning:v1:learning-state";

export interface QuestionHistory {
  questionId: string;
  lastSeen: string;
  nextDue: string;
  correctStreak: number;
  attempts: number;
  correct: number;
}

export interface LearningProfile {
  id: string;
  label: string;
  age: number;
  createdAt: string;
  learnedTopics: Record<string, string>;
  questionHistory: Record<string, QuestionHistory>;
}

export interface LearningState {
  version: typeof LEARNING_STATE_VERSION;
  activeProfileId?: string;
  profiles: LearningProfile[];
}

export interface LearningStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export function createLearningState(): LearningState {
  return { version: LEARNING_STATE_VERSION, profiles: [] };
}

export function getActiveProfile(state: LearningState): LearningProfile | undefined {
  return state.profiles.find((profile) => profile.id === state.activeProfileId);
}

export function addProfile(
  state: LearningState,
  input: { id: string; label: string; age: number; createdAt: string },
): LearningState {
  const label = input.label.trim();
  if (
    !input.id ||
    state.profiles.some((profile) => profile.id === input.id) ||
    label.length === 0 ||
    label.length > 30 ||
    !Number.isInteger(input.age) ||
    input.age < 5 ||
    input.age > 18 ||
    !isIsoTimestamp(input.createdAt)
  ) {
    return state;
  }

  const profile: LearningProfile = {
    id: input.id,
    label,
    age: input.age,
    createdAt: input.createdAt,
    learnedTopics: {},
    questionHistory: {},
  };

  return {
    ...state,
    activeProfileId: profile.id,
    profiles: [...state.profiles, profile],
  };
}

export function selectProfile(state: LearningState, profileId: string): LearningState {
  if (!state.profiles.some((profile) => profile.id === profileId)) return state;
  return { ...state, activeProfileId: profileId };
}

export function deleteProfile(state: LearningState, profileId: string): LearningState {
  const profiles = state.profiles.filter((profile) => profile.id !== profileId);
  if (profiles.length === state.profiles.length) return state;

  return {
    ...state,
    profiles,
    activeProfileId:
      state.activeProfileId === profileId ? profiles[0]?.id : state.activeProfileId,
  };
}

export function markTopicLearned(
  state: LearningState,
  profileId: string,
  topic: string,
  learnedAt: string,
): LearningState {
  if (!topic || !isIsoTimestamp(learnedAt)) return state;

  return updateProfile(state, profileId, (profile) => ({
    ...profile,
    learnedTopics: { ...profile.learnedTopics, [topic]: learnedAt },
  }));
}

export function setQuestionHistory(
  state: LearningState,
  profileId: string,
  history: QuestionHistory,
): LearningState {
  if (!isQuestionHistory(history)) return state;

  return updateProfile(state, profileId, (profile) => ({
    ...profile,
    questionHistory: { ...profile.questionHistory, [history.questionId]: history },
  }));
}

export function loadLearningState(storage: LearningStorage | undefined): LearningState {
  if (!storage) return createLearningState();

  try {
    const value = storage.getItem(STORAGE_KEY);
    if (value === null) return createLearningState();
    return restoreLearningState(JSON.parse(value)) ?? createLearningState();
  } catch {
    return createLearningState();
  }
}

export function saveLearningState(
  storage: LearningStorage | undefined,
  state: LearningState,
): boolean {
  if (!storage) return false;

  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
}

export function restoreLearningState(input: unknown): LearningState | null {
  if (!isRecord(input) || input.version !== LEARNING_STATE_VERSION || !Array.isArray(input.profiles)) {
    return null;
  }

  if (
    input.activeProfileId !== undefined &&
    typeof input.activeProfileId !== "string"
  ) {
    return null;
  }

  const profiles: LearningProfile[] = [];
  for (const value of input.profiles) {
    const profile = restoreProfile(value);
    if (!profile || profiles.some((candidate) => candidate.id === profile.id)) return null;
    profiles.push(profile);
  }

  const activeProfileId = input.activeProfileId as string | undefined;
  if (activeProfileId && !profiles.some((profile) => profile.id === activeProfileId)) return null;

  return {
    version: LEARNING_STATE_VERSION,
    profiles,
    ...(activeProfileId ? { activeProfileId } : {}),
  };
}

function updateProfile(
  state: LearningState,
  profileId: string,
  update: (profile: LearningProfile) => LearningProfile,
): LearningState {
  let found = false;
  const profiles = state.profiles.map((profile) => {
    if (profile.id !== profileId) return profile;
    found = true;
    return update(profile);
  });
  return found ? { ...state, profiles } : state;
}

function restoreProfile(input: unknown): LearningProfile | null {
  if (
    !isRecord(input) ||
    typeof input.id !== "string" ||
    input.id.length === 0 ||
    typeof input.label !== "string" ||
    input.label.trim().length === 0 ||
    input.label.length > 30 ||
    !Number.isInteger(input.age) ||
    (input.age as number) < 5 ||
    (input.age as number) > 18 ||
    typeof input.createdAt !== "string" ||
    !isIsoTimestamp(input.createdAt) ||
    !isRecord(input.learnedTopics) ||
    !isRecord(input.questionHistory)
  ) {
    return null;
  }

  const learnedTopics: Record<string, string> = {};
  for (const [topic, learnedAt] of Object.entries(input.learnedTopics)) {
    if (!topic || typeof learnedAt !== "string" || !isIsoTimestamp(learnedAt)) return null;
    learnedTopics[topic] = learnedAt;
  }

  const questionHistory: Record<string, QuestionHistory> = {};
  for (const [questionId, history] of Object.entries(input.questionHistory)) {
    if (!isQuestionHistory(history) || history.questionId !== questionId) return null;
    questionHistory[questionId] = history;
  }

  return {
    id: input.id,
    label: input.label.trim(),
    age: input.age as number,
    createdAt: input.createdAt,
    learnedTopics,
    questionHistory,
  };
}

function isQuestionHistory(input: unknown): input is QuestionHistory {
  return (
    isRecord(input) &&
    typeof input.questionId === "string" &&
    input.questionId.length > 0 &&
    typeof input.lastSeen === "string" &&
    isDateOnly(input.lastSeen) &&
    typeof input.nextDue === "string" &&
    isDateOnly(input.nextDue) &&
    Number.isInteger(input.correctStreak) &&
    (input.correctStreak as number) >= 0 &&
    Number.isInteger(input.attempts) &&
    (input.attempts as number) >= 0 &&
    Number.isInteger(input.correct) &&
    (input.correct as number) >= 0 &&
    (input.correct as number) <= (input.attempts as number)
  );
}

function isIsoTimestamp(value: string): boolean {
  const parsed = new Date(value);
  return !Number.isNaN(parsed.valueOf()) && parsed.toISOString() === value;
}

function isDateOnly(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsed.valueOf()) && parsed.toISOString().slice(0, 10) === value;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
