import remarkMdx from "remark-mdx";
import remarkParse from "remark-parse";
import { unified } from "unified";
import { visit } from "unist-util-visit";

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
  const components: string[] = [];

  try {
    const tree = unified().use(remarkParse).use(remarkMdx).parse(source);
    visit(tree, "mdxJsxFlowElement", (node) => {
      if (typeof node.name === "string") components.push(node.name);
    });
  } catch (error) {
    return [`published story contains invalid MDX: ${String(error)}`];
  }

  const recapIndex = components.indexOf("KeyFacts");
  const preRecapComponents = recapIndex === -1 ? components : components.slice(0, recapIndex);
  const interactionCount = preRecapComponents.filter((name) =>
    meaningfulInteractions.includes(name),
  ).length;

  if (interactionCount < 3) {
    errors.push(
      "published stories need at least three meaningful inline interactions before the KeyFacts recap",
    );
  }
  if (recapIndex === -1) {
    errors.push("published stories need a KeyFacts recap");
  }
  if (!components.includes("ParentNote")) {
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
