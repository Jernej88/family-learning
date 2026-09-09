import { describe, expect, it } from "vitest";

import { addDays, formatReviewIssue, getDueReviews } from "./review-schedule";

describe("addDays", () => {
  it("uses UTC calendar-day arithmetic across calendar boundaries", () => {
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDays("2024-02-29", 365)).toBe("2025-02-28");
  });

  it("rejects malformed and impossible dates", () => {
    expect(() => addDays("2026-2-1", 1)).toThrow("YYYY-MM-DD");
    expect(() => addDays("2026-02-30", 1)).toThrow("valid UTC calendar date");
  });
});

describe("getDueReviews", () => {
  const topics = [
    {
      slug: "later",
      title: "Later",
      stability: "stable" as const,
      last_verified: "2026-09-01",
      review_interval_days: 365,
    },
    {
      slug: "due-today",
      title: "Due today",
      stability: "changing" as const,
      last_verified: "2026-08-26",
      review_interval_days: 7,
    },
    {
      slug: "overdue-z",
      title: "Overdue Z",
      stability: "changing" as const,
      last_verified: "2026-08-20",
      review_interval_days: 7,
    },
    {
      slug: "overdue-a",
      title: "Overdue A",
      stability: "developing" as const,
      last_verified: "2026-08-20",
      review_interval_days: 7,
    },
  ];

  it("includes due-today and overdue topics in stable order", () => {
    expect(getDueReviews(topics, "2026-09-02")).toEqual([
      { ...topics[3], due_date: "2026-08-27" },
      { ...topics[2], due_date: "2026-08-27" },
      { ...topics[1], due_date: "2026-09-02" },
    ]);
  });

  it("does not include a healthy topic before its due date", () => {
    expect(getDueReviews(topics, "2026-09-01")).toHaveLength(2);
  });
});

describe("formatReviewIssue", () => {
  it("renders a deterministic GitHub issue body", () => {
    const body = formatReviewIssue(
      [
        {
          slug: "zakon",
          title: "Kako nastane zakon?",
          stability: "changing",
          last_verified: "2026-08-20",
          review_interval_days: 7,
          due_date: "2026-08-27",
        },
      ],
      "2026-09-02",
    );

    expect(body).toContain("- [ ] `zakon` — Kako nastane zakon?");
    expect(body).toContain("Due: 2026-08-27");
  });
});
