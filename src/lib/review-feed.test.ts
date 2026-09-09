import { describe, expect, it } from "vitest";

import type { Topic } from "./content-schema";
import { createReviewFeed } from "./review-feed";

type ChildTopic = Extract<Topic, { audience: "child" }>;

function topic(overrides: Partial<ChildTopic>): ChildTopic {
  return {
    title: "Topic",
    slug: "topic",
    description: "A sufficiently long topic description.",
    category: "vesolje",
    tags: ["tema"],
    audience: "child",
    created: new Date("2026-01-01T00:00:00.000Z"),
    last_updated: new Date("2026-01-01T00:00:00.000Z"),
    last_verified: new Date("2026-01-01T00:00:00.000Z"),
    stability: "stable",
    review_interval_days: 365,
    recommended_age_min: 7,
    recommended_age_max: 12,
    estimated_minutes: 8,
    status: "published",
    sources: [
      {
        title: "Source",
        url: "https://example.com",
        language: "en",
        authority: "primary",
      },
    ],
    ...overrides,
  };
}

describe("createReviewFeed", () => {
  it("includes published topics in slug order and excludes drafts", () => {
    const feed = createReviewFeed([
      topic({
        slug: "zvezde",
        title: "Zvezde",
        stability: "stable",
        last_verified: new Date("2026-09-01T00:00:00.000Z"),
        review_interval_days: 365,
        status: "published",
      }),
      topic({
        slug: "asteroid",
        title: "Asteroid",
        stability: "changing",
        last_verified: new Date("2026-09-02T00:00:00.000Z"),
        review_interval_days: 7,
        status: "draft",
      }),
      topic({
        slug: "luna",
        title: "Luna",
        stability: "developing",
        last_verified: new Date("2026-08-01T00:00:00.000Z"),
        review_interval_days: 60,
        status: "published",
      }),
    ]);

    expect(feed).toEqual({
      version: 1,
      topics: [
        {
          slug: "luna",
          title: "Luna",
          stability: "developing",
          last_verified: "2026-08-01",
          review_interval_days: 60,
        },
        {
          slug: "zvezde",
          title: "Zvezde",
          stability: "stable",
          last_verified: "2026-09-01",
          review_interval_days: 365,
        },
      ],
    });
  });
});
