import type { Quiz } from "./content-schema";
import { validateQuiz } from "./content-validation";

const quizFiles = import.meta.glob("../content/topics/*/quiz.json", {
  eager: true,
  import: "default",
});

export function getTopicQuiz(slug: string): Quiz {
  const path = `../content/topics/${slug}/quiz.json`;
  const result = validateQuiz(quizFiles[path], slug);
  if (!result.data || result.errors.length > 0) {
    throw new Error(`${path}: ${result.errors.join("; ") || "quiz file not found"}`);
  }
  return result.data;
}
