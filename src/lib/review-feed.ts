import { z } from "astro/zod";

import type { Topic } from "./content-schema";

const reviewDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export const reviewFeedSchema = z.object({
  version: z.literal(1),
  topics: z.array(
    z.object({
      slug: z.string().min(1),
      title: z.string().min(1),
      stability: z.enum(["stable", "developing", "changing"]),
      last_verified: reviewDateSchema,
      review_interval_days: z.number().int().positive(),
    }),
  ),
});

export type ReviewFeed = z.infer<typeof reviewFeedSchema>;
export type ReviewFeedTopic = ReviewFeed["topics"][number];

export function createReviewFeed(topics: Topic[]): ReviewFeed {
  return {
    version: 1,
    topics: topics
      .filter((topic) => topic.status === "published")
      .map((topic) => ({
        slug: topic.slug,
        title: topic.title,
        stability: topic.stability,
        last_verified: topic.last_verified.toISOString().slice(0, 10),
        review_interval_days: topic.review_interval_days,
      }))
      .sort((left, right) => left.slug.localeCompare(right.slug)),
  };
}
