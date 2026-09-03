import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

import { reviewFeedSchema } from "../src/lib/review-feed";
import { formatReviewIssue, getDueReviews } from "../src/lib/review-schedule";

const outputPath = getRequiredArgument("--output");
const today = process.env.REVIEW_DATE || new Date().toISOString().slice(0, 10);
const source = await readFile(path.resolve("review-feed.json"), "utf8");
const feed = reviewFeedSchema.parse(JSON.parse(source));
const dueReviews = getDueReviews(feed.topics, today);

await writeFile(
  outputPath,
  `${JSON.stringify({ body: formatReviewIssue(dueReviews, today), dueReviews }, null, 2)}\n`,
);

function getRequiredArgument(name: string): string {
  const index = process.argv.indexOf(name);
  const value = index === -1 ? undefined : process.argv[index + 1];
  if (!value) throw new Error(`Missing required ${name} argument.`);
  return value;
}
