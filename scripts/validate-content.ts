import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

import matter from "gray-matter";

import { topicSchema } from "../src/lib/content-schema";
import { validateQuiz, validateStorySource } from "../src/lib/content-validation";

const topicsRoot = path.resolve("src/content/topics");
const errors: string[] = [];
const allQuestionIds = new Map<string, string>();

function report(file: string, message: string): void {
  errors.push(`${path.relative(process.cwd(), file)}: ${message}`);
}

const entries = await readdir(topicsRoot, { withFileTypes: true });
const topicDirectories = entries.filter((entry) => entry.isDirectory());

if (topicDirectories.length === 0) {
  errors.push("src/content/topics: at least one topic bundle is required");
}

for (const directory of topicDirectories) {
  const slug = directory.name;
  const topicFile = path.join(topicsRoot, slug, "index.mdx");
  const quizFile = path.join(topicsRoot, slug, "quiz.json");

  let topicSource: string;
  let quizSource: string;
  try {
    [topicSource, quizSource] = await Promise.all([
      readFile(topicFile, "utf8"),
      readFile(quizFile, "utf8"),
    ]);
  } catch (error) {
    report(path.join(topicsRoot, slug), `bundle must contain index.mdx and quiz.json (${error})`);
    continue;
  }

  const parsedMatter = matter(topicSource);
  const topicResult = topicSchema.safeParse(parsedMatter.data);
  if (!topicResult.success) {
    for (const issue of topicResult.error.issues) {
      report(topicFile, `${issue.path.join(".") || "frontmatter"}: ${issue.message}`);
    }
  } else {
    if (topicResult.data.slug !== slug) {
      report(topicFile, `slug must match directory name "${slug}"`);
    }
    if (topicResult.data.status === "published") {
      for (const message of validateStorySource(parsedMatter.content)) report(topicFile, message);
    }
  }

  let quizInput: unknown;
  try {
    quizInput = JSON.parse(quizSource);
  } catch (error) {
    report(quizFile, `invalid JSON (${error})`);
    continue;
  }

  const quizResult = validateQuiz(quizInput, slug);
  for (const message of quizResult.errors) report(quizFile, message);

  if (topicResult.success && topicResult.data.status === "published" && quizResult.data) {
    if (quizResult.data.questions.length < 15) {
      report(quizFile, "published topics need at least 15 reusable quiz questions");
    }
  }

  for (const question of quizResult.data?.questions ?? []) {
    const previousFile = allQuestionIds.get(question.id);
    if (previousFile) {
      report(quizFile, `question id "${question.id}" is already used in ${previousFile}`);
    } else {
      allQuestionIds.set(question.id, path.relative(process.cwd(), quizFile));
    }
  }
}

if (errors.length > 0) {
  console.error(`Content validation failed with ${errors.length} error(s):\n`);
  for (const error of errors) console.error(`- ${error}`);
  process.exitCode = 1;
} else {
  console.log(`Validated ${topicDirectories.length} topic bundle(s).`);
}

