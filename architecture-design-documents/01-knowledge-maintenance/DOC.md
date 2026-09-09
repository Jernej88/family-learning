# Design Document: Knowledge Maintenance

| Field | Value |
|-------|-------|
| **Status** | Accepted |
| **Author** | Jernej and Codex |
| **Created** | 2026-09-02 |
| **Last Updated** | 2026-09-03 |
| **Epic** | — |
| **Related Issues** | — |

---

## 1. Overview

### 1.1 Problem Statement

Topic frontmatter already records `last_verified`, `stability`, and
`review_interval_days`, and the topic layout displays the verification date.
However, the repository has no machine-readable review catalog and no process
that tells the parent when published knowledge becomes stale. A review date can
therefore silently pass even though the source metadata itself is valid.

The V1 design requires a deterministic GitHub Actions workflow that identifies
such topics. It must not research the web, call an AI service, or change topic
content. Its role is to place the factual-review decision in one visible queue
for the parent.

### 1.2 Proposed Solution

1. Generate and commit `review-feed.json`, a stable catalog of all published
   topics and their review metadata.
2. Validate that the committed feed matches the topic frontmatter on every
   normal validation run.
3. Run a daily GitHub workflow that calculates due topics from the committed
   feed and the current UTC date.
4. Create or update one labeled GitHub Issue containing the review queue; close
   it when the queue is empty.
5. Document the parent-led factual-review loop for topic authors.

### 1.3 Terminology

| Term | Definition |
|------|------------|
| **Review feed** | Committed JSON catalog of review metadata for every published topic. |
| **Due topic** | A topic where `last_verified + review_interval_days` is on or before the evaluation date. |
| **Knowledge-review issue** | The single GitHub Issue maintained by the workflow for currently due topics. |
| **Evaluation date** | A UTC calendar date used to calculate whether a topic is due. |

## 2. Architecture

### 2.1 Current Flow

```text
Topic index.mdx frontmatter
  → topicSchema validation
  → Astro topic layout displays last_verified

# No review catalog, scheduled evaluation, or issue exists.
```

### 2.2 Proposed Flow

```text
Published topic index.mdx frontmatter
  → generate-review-feed.ts                     # NEW
  → review-feed.json (committed)
  → npm run validate verifies it is current      # CHANGED

review-due.yml (daily / manual)
  → read committed review-feed.json              # NEW
  → review-schedule.ts calculates due topics     # NEW
  → update one labeled GitHub Issue               # NEW
```

Key differences:

- The feed is date-independent and only changes when published topic metadata changes.
- Due status is calculated at workflow runtime, so daily runs need no bot commits.
- Draft topics are excluded from both the feed and maintenance queue.
- The workflow reports review work but never researches, edits, or publishes content.

## 3. Impacted Modules

| Module | Change |
|--------|--------|
| `src/lib/` | Pure UTC date calculation and review-feed types. |
| `scripts/` | Generate the stable JSON feed and verify its checked-in content. |
| `package.json` | Add generation and validation scripts. |
| `.github/workflows/` | Add the daily `review-due.yml` workflow. |
| `docs/` | Explain review intervals, feed regeneration, and parent review. |
| Root | Add committed `review-feed.json`. |

## 4. Review-Feed Contract

`review-feed.json` contains a versioned, prettified JSON object with entries
sorted by slug. Each entry has exactly the topic fields needed by the scheduled
workflow: `slug`, `title`, `stability`, `last_verified`, and
`review_interval_days`. It includes only topics whose status is `published`.

The feed does not contain an evaluation timestamp or a `due` boolean. Those
values change with time and would require unnecessary automated commits.

## 5. Workflow Behaviour

The workflow runs daily at 06:15 UTC and can be started manually. It reads the
committed feed and evaluates `last_verified + review_interval_days <= today`
using UTC calendar-date arithmetic.

If one or more topics are due, it finds or creates the single open issue labeled
`knowledge-review`, with the title `Knowledge review due`. The body is replaced
with a deterministic checkbox list ordered by due date, then slug. Each item
shows the slug, last verification date, interval, and due date. If no topics are
due, the workflow closes that labeled open issue if it exists.

## 6. Edge Cases & Behaviour

1. **Topic due today:** A topic is included when its calculated due date equals
   the evaluation date; there is no one-day delay.
2. **Overdue topic:** It remains in the issue until a human updates and commits
   its `last_verified` value and regenerated feed.
3. **No due topics:** The open labeled issue is closed rather than replaced with
   an empty issue.
4. **Draft topic:** It is excluded even if its metadata would otherwise be due.
5. **Calendar boundaries:** Date calculation uses UTC calendar dates, including
   month, year, and leap-year boundaries, avoiding local-time-zone shifts.
6. **Repeated workflow run:** The workflow updates the existing labeled issue;
   it does not create duplicate issues.

## 7. User Stories / Journeys

**US-1:** As a parent, I see every published topic requiring factual review in
one GitHub Issue, so that I can decide what to verify.
**Acceptance test:** workflow manual-dispatch smoke test with known due feed data.

**US-2:** As a topic author, I cannot merge changed review metadata without
updating the committed review feed, so that the scheduled queue remains based on
the reviewed repository state.
**Acceptance test:** review-feed validation test.

**US-3:** As a parent, after I update a reviewed topic's `last_verified` date,
the topic disappears from the next daily queue if it is no longer due.
**Acceptance test:** `src/lib/review-schedule.test.ts`.

**US-4:** As a maintainer, I run the workflow repeatedly without accumulating
duplicate review issues.
**Acceptance test:** workflow manual-dispatch smoke test.

## 8. Decisions Made

1. **Daily schedule:** Run once daily at 06:15 UTC, plus manual dispatch. Daily
   detection matches the maximum meaningful granularity of date-only metadata.
2. **Committed feed:** Commit a date-independent catalog rather than a daily
   due snapshot. This keeps review inputs auditable without automated commits.
3. **Published topics only:** Exclude drafts because they are not yet maintained
   knowledge and should not create review work.
4. **One issue:** Maintain one labeled issue instead of one per topic to keep
   the review queue compact.
5. **Deterministic mechanics only:** Do not fetch sources, use AI, update topic
   metadata, or publish content from the workflow; human judgment remains
   required.
6. **UTC date arithmetic:** Use date-only UTC logic so the result is independent
   of the GitHub runner location or daylight-saving changes.

## 9. Upgrade Paths

### 9.1 External source link checking

A separate scheduled workflow could check external source URLs and report
failures. It is deferred because it is not part of deterministic staleness
calculation and could make a source temporarily appear broken for network
reasons.

### 9.2 Parent-configured reminders

Notifications beyond GitHub Issues, such as email or calendar reminders, may be
added after actual maintenance usage establishes a need. They require an
external integration and are out of V1 scope.

### 9.3 ChatGPT scheduled research

An optional ChatGPT task may identify meaningful developments in changing
topics. It complements but does not replace this deterministic review queue.
The post-V1 design for turning those findings into human-reviewed draft PRs is
defined in
[`02-automated-knowledge-review-proposals`](../02-automated-knowledge-review-proposals/DOC.md).

## 10. Implementation Plan

```text
Task 1: review-schedule.ts + unit tests
  ↓
Task 2: generate-review-feed.ts + committed feed
  ↓
Task 3: validate feed freshness
  ↓
Task 4: review-due.yml
  ↓
Task 5: authoring and README documentation
```

1. **Add review scheduling library and tests** (`src/lib/`). Implement pure
   date calculations, due filtering, and stable ordering. Verify with `npm test`.
2. **Generate the committed feed** (`scripts/`, root JSON file). Read published
   topic frontmatter, produce the stable feed, and add generation tests. Verify
   byte-identical output for unchanged input.
3. **Enforce feed freshness** (`package.json`, validation script). Make normal
   validation fail if the committed feed differs from generated output. Verify
   that metadata edits require feed regeneration.
4. **Add the daily GitHub workflow** (`.github/workflows/review-due.yml`).
   Implement issue create/update/close behavior using `contents: read` and
   `issues: write` only. Verify by manual dispatch.
5. **Document the review loop** (`docs/topic-authoring.md`, `README.md`).
   Describe intervals, regeneration, and human factual review. Verify with the
   standard `npm run validate`, `npm test`, and build checks.

## 11. Files

| File | Change |
|------|--------|
| `src/lib/review-schedule.ts` | New date and queue calculation functions. |
| `src/lib/review-schedule.test.ts` | New unit tests. |
| `scripts/generate-review-feed.ts` | New feed generator/checker. |
| `review-feed.json` | New committed generated review catalog. |
| `package.json` | New generation and freshness-validation commands. |
| `.github/workflows/review-due.yml` | New daily issue-maintenance workflow. |
| `docs/topic-authoring.md` | Updated authoring review-loop guidance. |
| `README.md` | Updated Milestone 7 status and maintenance description. |

## 12. Changelog

2026-09-03 — Jernej — Accepted the daily schedule, committed date-independent feed, and published-topics-only scope.
