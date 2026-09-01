# Family Learning

Family Learning turns a child’s question into a reviewed Slovenian **interactive learning story**. Instead of reading a long article, a family predicts, reveals, chooses, observes, discusses, and then recalls the key ideas.

The project addresses two practical problems:

- good AI-assisted explanations disappear inside chats;
- passive explanations rarely make children stop and reason.

Permanent knowledge therefore lives in Git as MDX and JSON. Astro builds it into a fast static site; no backend, account, database, or runtime AI is required.

## Current scope

Milestones 1–3 provide the interactive-story foundation, content contract, and topic quiz:

- a mobile-first Astro + MDX topic library;
- nine reusable learning components;
- validated topic metadata and reusable quiz data;
- a five-question topic quiz with immediate explanations and device-local progress;
- one complete topic, `Zakaj Luna ne pade na Zemljo?`.

Profiles, learned-topic history, spaced recall, PWA support, and deployment belong to later milestones. See [the V1 design](docs/design-v1.md#64-suggested-implementation-milestones) for the roadmap.

## Run locally

Use Node 24 LTS (pinned in `.nvmrc`) and npm 11 or newer.

```bash
nvm use
npm install
npm run dev
```

Before opening a pull request:

```bash
npm run validate
npm test
npm run test:subpath
npm run build
```

## Repository map

| Path | Purpose |
|---|---|
| `src/content/topics/<slug>/` | Self-contained story (`index.mdx`) and quiz (`quiz.json`) |
| `src/components/learning/` | Supported MDX interaction primitives |
| `src/content.config.ts` | Astro topic collection |
| `src/lib/content-schema.ts` | Topic and quiz contracts |
| `scripts/validate-content.ts` | Cross-file and story acceptance checks |
| `docs/topic-authoring.md` | How to research and add a topic |
| `docs/design-v1.md` | Product and architecture source of truth |

## Add a topic

1. Read [the authoring contract](docs/topic-authoring.md).
2. Copy the existing topic bundle and replace its content and quiz data.
3. Keep the directory name, frontmatter `slug`, and quiz `topic` identical.
4. Run `npm run validate`; the homepage and route are generated automatically.

Content should contain no child names, photos, birthdays, or learning results. AI may help research and author a proposal, but a parent reviews it before publication.
