import { quizSchema, type Quiz } from "./content-schema";

const meaningfulInteractions = [
  "Prediction",
  "Reveal",
  "Think",
  "Choice",
  "Experiment",
  "Visual",
];

export function validateStorySource(source: string): string[] {
  const errors: string[] = [];
  const interactionPattern = new RegExp(`<(${meaningfulInteractions.join("|")})\\b`, "g");
  const interactionCount = [...source.matchAll(interactionPattern)].length;

  if (interactionCount < 3) {
    errors.push("published stories need at least three meaningful inline interactions");
  }
  if (!source.includes("<KeyFacts")) {
    errors.push("published stories need a KeyFacts recap");
  }
  if (!source.includes("<ParentNote")) {
    errors.push("published stories need a ParentNote for caveats or discussion guidance");
  }

  return errors;
}

export function validateQuiz(input: unknown, expectedTopic: string): {
  data?: Quiz;
  errors: string[];
} {
  const result = quizSchema.safeParse(input);
  if (!result.success) {
    return {
      errors: result.error.issues.map(
        (issue) => `${issue.path.join(".") || "quiz"}: ${issue.message}`,
      ),
    };
  }

  const errors: string[] = [];
  if (result.data.topic !== expectedTopic) {
    errors.push(`topic must match directory slug "${expectedTopic}"`);
  }

  const seen = new Set<string>();
  for (const question of result.data.questions) {
    if (seen.has(question.id)) {
      errors.push(`duplicate question id "${question.id}"`);
    }
    seen.add(question.id);
  }

  return { data: result.data, errors };
}

