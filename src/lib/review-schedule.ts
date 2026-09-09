import type { ReviewFeedTopic } from "./review-feed";

export interface DueReview extends ReviewFeedTopic {
  due_date: string;
}

export function addDays(date: string, days: number): string {
  const value = parseDate(date);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}

export function getDueReviews(topics: ReviewFeedTopic[], today: string): DueReview[] {
  parseDate(today);

  return topics
    .map((topic) => ({ ...topic, due_date: addDays(topic.last_verified, topic.review_interval_days) }))
    .filter((topic) => topic.due_date <= today)
    .sort((left, right) => left.due_date.localeCompare(right.due_date) || left.slug.localeCompare(right.slug));
}

export function formatReviewIssue(dueReviews: DueReview[], today: string): string {
  const header = [
    "# Knowledge review due",
    "",
    `Topics due for factual review on ${today}. This queue is deterministic; review and update content manually.`,
  ];

  if (dueReviews.length === 0) return `${header.join("\n")}\n`;

  const items = dueReviews.flatMap((topic) => [
    "",
    `- [ ] \`${topic.slug}\` — ${topic.title}`,
    `  - Last verified: ${topic.last_verified}`,
    `  - Review interval: ${topic.review_interval_days} days (${topic.stability})`,
    `  - Due: ${topic.due_date}`,
  ]);

  return `${[...header, ...items].join("\n")}\n`;
}

function parseDate(value: string): Date {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new Error(`Expected a UTC calendar date in YYYY-MM-DD format, received "${value}".`);
  }

  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.valueOf()) || date.toISOString().slice(0, 10) !== value) {
    throw new Error(`Expected a valid UTC calendar date, received "${value}".`);
  }

  return date;
}
