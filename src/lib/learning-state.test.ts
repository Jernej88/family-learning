import { describe, expect, it } from "vitest";

import {
  addProfile,
  createLearningState,
  deleteProfile,
  getActiveProfile,
  loadLearningState,
  markTopicLearned,
  restoreLearningState,
  saveLearningState,
  selectProfile,
  setQuestionHistory,
  type LearningStorage,
} from "./learning-state";

class MemoryStorage implements LearningStorage {
  items = new Map<string, string>();

  getItem(key: string): string | null {
    return this.items.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.items.set(key, value);
  }
}

const createdAt = "2026-09-01T10:00:00.000Z";

describe("learning state", () => {
  it("creates, selects, and deletes independent profiles", () => {
    let state = addProfile(createLearningState(), {
      id: "child-1",
      label: "Otrok 1",
      age: 7,
      createdAt,
    });
    state = addProfile(state, {
      id: "child-2",
      label: "Otrok 2",
      age: 10,
      createdAt,
    });

    expect(getActiveProfile(state)?.id).toBe("child-2");
    state = selectProfile(state, "child-1");
    state = markTopicLearned(state, "child-1", "luna", createdAt);

    expect(getActiveProfile(state)?.learnedTopics).toEqual({ luna: createdAt });
    expect(state.profiles.find((profile) => profile.id === "child-2")?.learnedTopics).toEqual({});

    state = deleteProfile(state, "child-1");
    expect(state.profiles.map((profile) => profile.id)).toEqual(["child-2"]);
    expect(state.activeProfileId).toBe("child-2");
  });

  it("records question history only for the requested profile", () => {
    let state = addProfile(createLearningState(), {
      id: "child-1",
      label: "Otrok 1",
      age: 7,
      createdAt,
    });
    state = addProfile(state, {
      id: "child-2",
      label: "Otrok 2",
      age: 10,
      createdAt,
    });
    state = setQuestionHistory(state, "child-1", {
      questionId: "luna-001",
      lastSeen: "2026-09-01",
      nextDue: "2026-09-04",
      correctStreak: 1,
      attempts: 1,
      correct: 1,
    });

    expect(state.profiles[0].questionHistory["luna-001"]?.correct).toBe(1);
    expect(state.profiles[1].questionHistory).toEqual({});
  });

  it("saves, loads, and rejects malformed persisted data", () => {
    const storage = new MemoryStorage();
    const state = addProfile(createLearningState(), {
      id: "child-1",
      label: "Otrok 1",
      age: 7,
      createdAt,
    });

    expect(saveLearningState(storage, state)).toBe(true);
    expect(loadLearningState(storage)).toEqual(state);
    expect(restoreLearningState({ ...state, activeProfileId: "missing" })).toBeNull();

    storage.items.set("family-learning:v1:learning-state", "not json");
    expect(loadLearningState(storage)).toEqual(createLearningState());
  });

  it("tolerates unavailable storage and invalid profile input", () => {
    const unavailable: LearningStorage = {
      getItem: () => {
        throw new Error("blocked");
      },
      setItem: () => {
        throw new Error("blocked");
      },
    };
    const state = createLearningState();

    expect(loadLearningState(unavailable)).toEqual(state);
    expect(saveLearningState(unavailable, state)).toBe(false);
    expect(addProfile(state, { id: "bad", label: "", age: 4, createdAt })).toBe(state);
  });
});
