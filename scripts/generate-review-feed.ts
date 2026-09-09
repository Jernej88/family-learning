import { readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

import matter from "gray-matter";

import { topicSchema, type Topic } from "../src/lib/content-schema";
import { createReviewFeed } from "../src/lib/review-feed";

const topicsRoot = path.resolve("src/content/topics");
const reviewFeedPath = path.resolve("review-feed.json");
const checkOnly = process.argv.includes("--check");

const topics = await readTopics();
const generated = `${JSON.stringify(createReviewFeed(topics), null, 2)}\n`;

if (checkOnly) {
  let current: string;
  try {
    current = await readFile(reviewFeedPath, "utf8");
  } catch (error) {
    console.error(`Unable to read review-feed.json (${String(error)}). Run npm run generate:review-feed.`);
    process.exitCode = 1;
    process.exit();
  }

  if (current !== generated) {
    console.error("review-feed.json is out of date. Run npm run generate:review-feed and commit the result.");
    process.exitCode = 1;
  } else {
    console.log(`Verified review feed for ${topics.length} topic bundle(s).`);
  }
} else {
  await writeFile(reviewFeedPath, generated);
  console.log(`Generated review feed for ${topics.length} topic bundle(s).`);
}

async function readTopics(): Promise<Topic[]> {
  const entries = await readdir(topicsRoot, { withFileTypes: true });
  const directories = entries.filter((entry) => entry.isDirectory());
  const topics: Topic[] = [];
  const errors: string[] = [];

  for (const directory of directories) {
    const file = path.join(topicsRoot, directory.name, "index.mdx");
    let source: string;
    try {
      source = await readFile(file, "utf8");
    } catch (error) {
      errors.push(`${path.relative(process.cwd(), file)}: unable to read topic (${String(error)})`);
      continue;
    }

    const result = topicSchema.safeParse(matter(source).data);
    if (!result.success) {
      for (const issue of result.error.issues) {
        errors.push(`${path.relative(process.cwd(), file)}: ${issue.path.join(".")}: ${issue.message}`);
      }
      continue;
    }

    if (result.data.slug !== directory.name) {
      errors.push(`${path.relative(process.cwd(), file)}: slug must match directory name "${directory.name}"`);
      continue;
    }

    topics.push(result.data);
  }

  if (errors.length > 0) {
    console.error(`Unable to generate review feed with ${errors.length} error(s):\n`);
    for (const error of errors) console.error(`- ${error}`);
    process.exitCode = 1;
    process.exit();
  }

  return topics;
}
