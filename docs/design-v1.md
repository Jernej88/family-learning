# Family Learning — V1 Design Document

**Status:** Prototype specification  
**Target:** Usable, likeable family learning application suitable for everyday use  
**Primary language:** Slovenian  
**Audience:** Children approximately 7 and 10 years old, with additional material for parents  
**Source of truth:** GitHub repository  
**Hosting:** GitHub Pages  
**Research/authoring:** ChatGPT Work + Deep Research  
**Runtime AI dependency:** None  
**Backend:** None in V1

---

## 1. Product vision

Family Learning is a small interactive knowledge system for exploring topics together with children.

A parent should be able to ask a question such as:

> Zakaj vulkani izbruhnejo?

ChatGPT researches the topic and prepares a structured Slovenian **interactive learning story**. The module is added to GitHub and automatically published as a mobile-friendly webpage.

The child-facing material should be understandable to a seven-year-old while allowing an older child to explore deeper explanations.

Parents should have optional expandable sections containing:

- more precise explanations;
- caveats and simplifications;
- discussion suggestions;
- useful background information;
- links to authoritative sources.

Each topic contains interactions throughout the learning experience and ends with a reusable quiz.

Previously learned material feeds into a daily recall system that repeatedly asks older questions using a simple spaced-repetition strategy.

Topics whose facts may change are periodically identified for review and can be researched again.

The long-term concept is:

```text
Question
   ↓
Research
   ↓
Interactive learning story
   ↓
Family knowledge repository
   ↓
Explore + predict + reveal + discuss
   ↓
Quiz
   ↓
Spaced recall
   ↓
Knowledge foundation
```

V1 should prove that this workflow is useful before implementing a more autonomous agent platform.

---

# 2. Core pedagogical model: interactive learning stories

Interactive learning stories are a **central V1 requirement**, not a later enhancement.

The primary topic experience should not be:

```text
long explanation
    ↓
more explanation
    ↓
quiz
```

Instead, topics should regularly require the learner to think, predict, choose, reveal, discuss, observe or try something.

Preferred rhythm:

```text
hook
  ↓
predict
  ↓
reveal
  ↓
explain
  ↓
visual / example
  ↓
think or choose
  ↓
explain deeper
  ↓
experiment / connection
  ↓
recap
  ↓
quiz
```

The exact sequence can vary by topic.

The goal is to turn reading into active learning without turning the application into a game.

A normal topic should contain at least **three meaningful learner interactions before the final quiz**.

These interactions must contribute to understanding. Decorative buttons or unnecessary animation do not count.

---

# 3. Example interactive learning story

A topic such as:

> Zakaj Luna ne pade na Zemljo?

might be structured like:

```text
🌙 Zakaj Luna ne pade na Zemljo?

Poglej Luno. Zemlja jo ves čas privlači.

🤔 Kaj misliš, kaj se zgodi?

[A] Luna ne čuti gravitacije
[B] Luna ves čas pada proti Zemlji
[C] Sonce jo drži na mestu

        ↓ choose

💡 Pravzaprav Luna ves čas pada!

[diagram showing orbit]

Toda hkrati se premika tako hitro vstran,
da Zemljino površje ves čas "zgreši".

        ↓

🎯 Poskusi razmisliti

Kaj bi se zgodilo, če bi se Luna nenadoma
nehala premikati?

        ↓ reveal / discuss

🔎 Poglej globlje

Kaj pomeni orbita?

        ↓

👨‍👩‍👧 Za starše

Newtonov miselni poskus s topovsko kroglo ...

        ↓

🧠 Kaj si zapomnimo?

        ↓

🎯 Preveri znanje
```

The important property is that the learner **does something every few sections**.

---

# 4. Design principles

## 4.1 Repository is the source of truth

The permanent knowledge base must not live inside ChatGPT conversations.

Git contains:

- topics;
- quizzes;
- sources;
- metadata;
- update history;
- website source code.

ChatGPT is an author and researcher, not the database.

---

## 4.2 Static first

V1 should require:

- no application server;
- no database;
- no user accounts;
- no authentication;
- no runtime LLM calls.

The entire site should be buildable from the Git repository and deployable as static files.

This keeps the prototype inexpensive, understandable and easy to maintain.

---

## 4.3 AI writes; deterministic software manages

Use AI where judgment is valuable:

- research;
- explanation;
- designing the learning story;
- choosing effective analogies;
- creating predictions and interactive questions;
- simplifying difficult concepts;
- creating quiz questions;
- comparing sources;
- detecting meaningful factual changes.

Use ordinary code where deterministic logic is sufficient:

- rendering interactions;
- evaluating multiple-choice answers;
- selecting due quiz questions;
- calculating review dates;
- finding stale topics;
- validating metadata;
- building the website;
- deployment;
- checking links.

---

## 4.4 Human review before publication

V1 should not automatically publish AI-generated educational content.

Preferred lifecycle:

```text
ChatGPT research
       ↓
proposed learning story
       ↓
Git commit / PR
       ↓
parent review
       ↓
merge
       ↓
automatic deployment
```

This is particularly important for:

- current affairs;
- legislation;
- science news;
- controversial topics;
- topics where ChatGPT significantly simplified the explanation.

---

## 4.5 Content contract, not rigid article template

Every topic should follow the same technical and pedagogical contract, but not necessarily the same table of contents.

A history topic may begin with:

> Predstavljaj si, da se zbudiš kot otrok v Pompejih ...

A physics topic may begin with:

> Spusti žogico. Zakaj pade na tla, Luna pa ne?

A civics topic may begin with:

> Predstavljaj si, da želi tvoja družina predlagati pravilo za vso Slovenijo ...

The authoring agent should choose the best narrative path for each topic.

Standardization applies to:

- metadata;
- supported interaction primitives;
- child-readable core;
- deeper layer;
- parent notes;
- key concepts;
- sources;
- final quiz;
- recall question schema.

---

# 5. V1 scope

V1 must support six core capabilities.

### 1. Topic library

Browse and read learning modules.

### 2. Interactive learning stories

Topics combine explanation with prediction, reveal, choices, thinking prompts, simple activities and visuals.

### 3. Layered explanations

Each topic supports:

- basic explanation;
- deeper material;
- parent notes.

### 4. Topic quizzes

Each topic contains a reusable bank of questions.

### 5. Daily recall

The application selects questions from previously learned topics using local learning history.

### 6. Knowledge maintenance

Topics contain verification metadata, and GitHub Actions identify topics requiring review.

---

# 6. Explicit non-goals for V1

Do **not** implement yet:

- backend database;
- logins;
- cloud synchronization of quiz progress;
- OpenAI API calls from GitHub;
- autonomous topic generation;
- autonomous commits;
- autonomous publication;
- full knowledge graph;
- multiplayer features;
- leaderboards;
- complex achievements;
- AI evaluation of free-text answers;
- automatic curriculum generation;
- native mobile applications;
- a fully generic no-code lesson authoring engine;
- complex simulations.

These can be considered after the system has been used for approximately 10–20 real topics.

---

# 7. High-level architecture

```text
                        PARENT
                          │
                 question from phone
                          │
                          ▼
                ┌──────────────────┐
                │   ChatGPT Work   │
                │                  │
                │ Deep Research    │
                │ Story design     │
                │ Topic authoring  │
                │ Quiz generation  │
                └────────┬─────────┘
                         │
                  proposed content
                         │
                         ▼
                ┌──────────────────┐
                │      GitHub      │
                │                  │
                │ topics           │
                │ quizzes          │
                │ sources          │
                │ metadata         │
                │ app source       │
                └───────┬──────────┘
                        │
                 GitHub Actions
                        │
          ┌─────────────┼─────────────┐
          │             │             │
       validate       review        deploy
                       due
          │             │             │
          └─────────────┴─────────────┘
                        │
                        ▼
               ┌─────────────────┐
               │ GitHub Pages    │
               │                 │
               │ Family Learning │
               │ PWA             │
               └────────┬────────┘
                        │
                        ▼
                   phone/tablet


             separate optional process

               ChatGPT Scheduled
                     Task
                       │
                       ▼
              monitor changing topics
                       │
                       ▼
              notify parent if needed
```

---

# 8. Recommended technology

## Frontend

Use:

**Astro + TypeScript + MDX**

Reasons:

- excellent fit for content-heavy static sites;
- Markdown-like authoring remains readable in Git;
- MDX allows embedding a small set of interactive learning components;
- generates normal static HTML;
- JavaScript can remain limited to actual interactions;
- deploys cleanly to GitHub Pages;
- good mobile performance;
- easy to keep content and application code separate.

Use Astro content collections for topic metadata and schema validation.

Use MDX only where interaction components are needed.

Client-side JavaScript should primarily be used for:

- prediction / choice interactions;
- reveal interactions;
- quizzes;
- learning profiles;
- review history;
- daily recall;
- PWA behaviour.

React is not required for V1.

Astro components plus small client-side TypeScript components are sufficient.

If implementation becomes awkward, lightweight framework islands are acceptable, but should not become the default architecture.

---

# 9. Interactive learning primitives

V1 should provide a small, deliberate set of reusable learning components.

Do not build a generic educational component framework.

Recommended initial primitives:

| Component | Purpose |
|---|---|
| `Prediction` | Ask the learner to predict before seeing the explanation |
| `Reveal` | Hide an explanation until the learner chooses to reveal it |
| `Think` | Prompt learner/family to pause and reason or discuss |
| `Choice` | Embedded mini-question with immediate feedback |
| `Experiment` | Simple safe real-world activity or thought experiment |
| `Visual` | Diagram, illustration or step-through visual explanation |
| `DeepDive` | Optional more advanced material |
| `ParentNote` | Optional adult explanation/caveat |
| `KeyFacts` | Short recap of essential facts |

A topic does not need every primitive.

The authoring agent should select only those that improve the explanation.

---

# 10. Interaction design requirements

Interactions should:

- work by touch;
- work on phone and tablet;
- provide immediate feedback where appropriate;
- remain understandable without animation;
- use normal accessible buttons;
- avoid hover-only behaviour;
- avoid unnecessary gamification;
- not prevent the learner from reading the topic linearly;
- preserve the explanation even if JavaScript fails where practical.

Interactive elements should be brief.

They should create cognitive pauses, not interrupt the story every few sentences.

As a rough guideline, a typical 5–10 minute topic should contain approximately **3–6 meaningful interactions** before its final quiz.

---

# 11. Repository structure

Recommended initial layout:

```text
family-learning/
│
├── .github/
│   └── workflows/
│       ├── validate.yml
│       ├── deploy.yml
│       └── review-due.yml
│
├── docs/
│   ├── design-v1.md
│   ├── topic-authoring.md
│   ├── topic-updating.md
│   └── content-guidelines.md
│
├── src/
│   ├── components/
│   │   ├── learning/
│   │   │   ├── Prediction.astro
│   │   │   ├── Reveal.astro
│   │   │   ├── Think.astro
│   │   │   ├── Choice.astro
│   │   │   ├── Experiment.astro
│   │   │   ├── Visual.astro
│   │   │   ├── DeepDive.astro
│   │   │   ├── ParentNote.astro
│   │   │   └── KeyFacts.astro
│   │   │
│   │   ├── TopicCard.astro
│   │   ├── Quiz.astro
│   │   └── DailyReview.astro
│   │
│   ├── content/
│   │   └── topics/
│   │       ├── zakaj-je-nebo-modro/
│   │       │   ├── index.mdx
│   │       │   └── quiz.json
│   │       │
│   │       └── vulkani/
│   │           ├── index.mdx
│   │           └── quiz.json
│   │
│   ├── layouts/
│   │   ├── BaseLayout.astro
│   │   └── TopicLayout.astro
│   │
│   ├── lib/
│   │   ├── quiz.ts
│   │   ├── review.ts
│   │   ├── profiles.ts
│   │   └── storage.ts
│   │
│   ├── pages/
│   │   ├── index.astro
│   │   ├── topics/
│   │   ├── review.astro
│   │   └── progress.astro
│   │
│   └── styles/
│
├── scripts/
│   ├── validate-content.ts
│   └── find-due-reviews.ts
│
├── public/
│   ├── icons/
│   └── manifest.webmanifest
│
├── astro.config.mjs
├── package.json
├── tsconfig.json
└── README.md
```

Topics are deliberately self-contained:

```text
topic/
   index.mdx
   quiz.json
   assets later if needed
```

This makes topics easy to add, review, move or delete.

It also avoids one enormous global quiz JSON file causing merge conflicts.

---

# 12. Topic data model

Each topic is primarily an MDX document with YAML front matter.

Example:

```yaml
---
title: "Kako nastane zakon v Sloveniji?"
slug: "kako-nastane-zakon"
description: "Od predloga zakona do glasovanja v državnem zboru."

category: "družba"
tags:
  - slovenija
  - parlament
  - zakonodaja

created: 2026-08-31
last_updated: 2026-08-31
last_verified: 2026-08-31

stability: changing
review_interval_days: 14

recommended_age_min: 7
recommended_age_max: 12

estimated_minutes: 8

status: published

sources:
  - title: "Državni zbor Republike Slovenije"
    url: "..."
    language: "sl"
    authority: primary
  - title: "GOV.SI"
    url: "..."
    language: "sl"
    authority: primary
---
```

Allowed stability values:

```text
stable
developing
changing
```

Suggested defaults:

| Stability | Typical review |
|---|---:|
| stable | 365 days |
| developing | 60–90 days |
| changing | 7–30 days |

The explicit interval remains stored per topic so exceptions are easy.

---

# 13. Topic authoring model

Topics are written as a sequence of narrative prose and learning components.

Example:

```mdx
---
title: "Zakaj Luna ne pade na Zemljo?"
...
---

# Zakaj Luna ne pade na Zemljo?

Poglej Luno. Zemlja jo zaradi gravitacije ves čas privlači.

<Prediction
  question="Kaj misliš, zakaj Luna ne pade na Zemljo?"
  options={[
    "Ker nanjo ne deluje gravitacija",
    "Ker ves čas pada in zgreši Zemljo",
    "Ker jo Sonce drži na mestu"
  ]}
  correct={1}
  explanation="Luna je pravzaprav ves čas v prostem padu okoli Zemlje."
/>

<Reveal title="Kaj se v resnici dogaja?">

Presenetljivo: **Luna dejansko ves čas pada proti Zemlji.**

Hkrati pa se zelo hitro premika vstran.

</Reveal>

<Visual
  type="orbit"
  caption="Luna med padanjem ves čas zgreši Zemljo."
/>

<Think question="Kaj bi se zgodilo, če bi se Luna nenadoma nehala premikati vstran?">
Razmislite skupaj, preden odprete odgovor.
</Think>

## Kaj pomeni orbita?

...

<DeepDive title="Poglej globlje">

Newton je isto idejo razlagal z miselnim poskusom topovske krogle ...

</DeepDive>

<ParentNote>

Tu poenostavljamo orbito kot kombinacijo gibanja naprej in prostega pada ...

</ParentNote>

<KeyFacts items={[
  "Na Luno deluje Zemljina gravitacija.",
  "Luna je ves čas v prostem padu.",
  "Ker se premika vstran, Zemljo ves čas zgreši."
]} />
```

Exact component APIs can evolve during implementation.

The important contract is conceptual consistency.

---

# 14. Topic story structure

Do not enforce one rigid sequence, but the authoring agent should normally create a learning arc with most of the following:

### Hook

A surprising question, scenario, observation or short story.

### Prediction

Ask what the learner currently thinks.

### Reveal

Expose the surprising or central idea.

### Explanation

Explain it simply.

### Interaction

Prediction, choice, think prompt, visual or experiment.

### Deeper understanding

Add detail or connect concepts.

### Connection

Relate the idea to something the child already knows.

### Recap

Emphasize the most important concepts.

### Final quiz

Test recall and understanding.

This is a pedagogical guideline rather than a fixed document schema.

---

# 15. Deep dive

Displayed as:

> 🔎 Poglej globlje

Designed primarily for the older child.

Contains:

- additional details;
- slightly harder terminology;
- numbers;
- exceptions;
- deeper explanations.

Collapsed by default unless UX testing shows otherwise.

---

# 16. Parent notes

Displayed as:

> 👨‍👩‍👧 Za starše

Collapsed by default.

May contain:

- what was simplified;
- scientific/legal caveats;
- uncertainty;
- context;
- suggested discussion questions;
- common misconceptions;
- links to more detailed material.

Parent notes should not interrupt the child-facing narrative.

---

# 17. Writing style

All main learning content should be Slovenian.

The basic layer should approximately target what an interested seven-year-old can understand when reading with an adult.

Rules:

- short paragraphs;
- explain difficult terms;
- concrete examples;
- avoid unnecessary jargon;
- do not talk down to children;
- analogies should be clearly distinguishable from literal explanations;
- important numbers should have relatable comparisons where useful;
- uncertainty must not be presented as certainty;
- questions should encourage reasoning rather than merely guessing trivia.

The deeper layer can target roughly age 10–12.

Parent notes should use normal adult language.

---

# 18. Interaction quality rules

Interactions should test or activate understanding, not merely facts.

Prefer:

> Kaj misliš, kaj se zgodi, če ...?

over:

> Katerega leta se je zgodilo ...?

when the goal is conceptual learning.

Good interaction patterns include:

- predict before reveal;
- compare two explanations;
- put events in conceptual order;
- identify a misconception;
- inspect a diagram;
- perform a simple safe experiment;
- explain what would happen if one condition changed;
- connect a new idea to a previously learned concept.

Trivia-style questions are acceptable where factual recall itself matters, especially in the final quiz.

---

# 19. Visuals

Visuals should be used where they genuinely improve understanding.

Potential V1 forms:

- simple SVG diagrams;
- labeled illustrations;
- timelines;
- before/after diagrams;
- step-by-step visual sequences;
- small static maps where appropriate;
- photographs or sourced illustrations if licensing/use permits.

Do not require generated illustrations for every topic.

V1 should prefer clear diagrams over decorative imagery.

The `Visual` component should start simple.

Complex interactive simulations are explicitly out of scope for V1.

---

# 20. Source policy

Research quality is important.

Preferred source order:

1. authoritative Slovenian primary sources;
2. Slovenian educational/scientific sources;
3. reputable international primary sources;
4. universities, museums and scientific institutions;
5. high-quality reference publications.

Examples:

```text
gov.si
dz-rs.si
pisrs.si
stat.si
nijz.si
arso.gov.si

NASA
ESA
WHO
European Commission
universities
museums
scientific societies
```

For each topic, prefer approximately 3–8 strong sources rather than dozens of weak links.

Slovenian sources are preferred where their quality is comparable.

English sources are acceptable where better information is available.

Important claims in changing topics should be traceable to a source.

---

# 21. Source UX

The child should not see citation clutter throughout every sentence.

The story should remain readable.

Use:

- unobtrusive reference markers where needed;
- a clear "Viri in dodatno branje" section;
- source title;
- institution;
- language;
- link.

Parent notes can contain more explicit sourcing.

---

# 22. Quiz model

Each topic has its own:

```text
quiz.json
```

A normal topic should contain approximately:

**15–30 reusable questions.**

Example:

```json
{
  "topic": "vulkani",
  "questions": [
    {
      "id": "vulkani-001",
      "type": "multiple_choice",
      "concept": "magma-lava",
      "difficulty": 1,
      "age_min": 7,
      "question": "Kako imenujemo staljeno kamnino pod površjem Zemlje?",
      "options": [
        "Lava",
        "Magma",
        "Pepel",
        "Bazalt"
      ],
      "correct": 1,
      "explanation": "Pod površjem jo imenujemo magma. Ko pride na površje, govorimo o lavi."
    }
  ]
}
```

The final quiz is separate from inline learning interactions.

Inline interactions support learning during the story.

The quiz supports testing and later spaced recall.

---

# 23. Supported V1 quiz question types

Start with only:

### Multiple choice

Automatic evaluation.

### True / false

Automatic evaluation.

Avoid free-text answers in V1.

They introduce:

- fuzzy matching;
- language issues;
- ambiguous correctness;
- pressure to add runtime AI.

They can be added later.

---

# 24. Question metadata

Each reusable quiz question should contain:

```text
id
type
concept
difficulty
age_min
question
answer
explanation
```

Optional later:

```text
source
related_topics
image
```

`concept` is important.

For example:

```text
gravity
magma-lava
roman-government
photosynthesis-energy
```

It provides a future migration path toward knowledge graphs without requiring one now.

---

# 25. Topic quiz UX

After answering:

```text
✓ Pravilen odgovor!

Magma je staljena kamnina pod zemeljskim površjem.
Ko doseže površje, jo imenujemo lava.

[Naslednje vprašanje]
```

For incorrect answers:

```text
Ni čisto.

Pravilen odgovor je: magma.

Magma je ...

[Poskusi naslednje]
```

The explanation is important.

The quiz should teach, not merely grade.

---

# 26. Daily recall

Daily review is generated entirely on the device.

No GitHub Action or ChatGPT call is necessary.

Entry point:

> 🧠 Današnji izziv

Default:

**5 questions per person**

with an option to continue afterward.

---

# 27. Local profiles

V1 supports simple device-local profiles.

Example:

```text
👦 Otrok 1
👦 Otrok 2
👨 Oče
👩 Mama
```

Do not store names or identifying information in Git.

Profiles are stored only in browser `localStorage`.

The application should allow:

- creating profile;
- selecting profile;
- selecting approximate age;
- deleting profile.

---

# 28. Learning history

Store locally per question:

```json
{
  "questionId": "vulkani-001",
  "lastSeen": "2026-09-01",
  "nextDue": "2026-09-04",
  "correctStreak": 2,
  "attempts": 3,
  "correct": 2
}
```

No cloud synchronization in V1.

This means progress differs between devices.

That limitation is acceptable for the prototype and should be documented.

---

# 29. Spaced-repetition algorithm

Do not implement SM-2, FSRS or another sophisticated algorithm initially.

Use a transparent sequence:

```text
first correct answer → 3 days
second              → 7 days
third               → 14 days
fourth              → 30 days
fifth                → 60 days
later                → 90 days
```

Incorrect answer:

```text
next review → tomorrow
correct streak → reset/reduce
```

The exact interval table should live in one configuration structure so it can later be changed.

---

# 30. Daily question selection

Priority order:

### 1. Overdue questions

Questions past `nextDue`.

### 2. Weak questions

Low historical success rate.

### 3. Recently learned concepts

Some reinforcement from recent topics.

### 4. Older random material

Provides desirable recall variability.

For five questions, a typical mixture might be:

```text
2 overdue
1 weak
1 recent
1 old/random
```

Do not guarantee this exact distribution if insufficient questions exist.

---

# 31. Topic completion

The user can explicitly mark:

> ✓ Tema prebrana

Only learned topics should normally contribute to daily review.

This prevents browsing a topic for five seconds from polluting the recall queue.

Inline learning interactions do not independently create spaced-repetition items in V1.

Only questions from `quiz.json` enter the long-term review pool.

---

# 32. Home page

V1 home page should feel like a learning application rather than documentation.

Suggested structure:

```text
┌─────────────────────────────┐
│ Kaj bomo danes odkrili?     │
│                             │
│ 🧠 Današnji izziv           │
│ 5 vprašanj                  │
│                             │
│ [ ZAČNI ]                   │
├─────────────────────────────┤
│ Nadaljuj raziskovanje       │
│                             │
│ 🌋 Vulkani                  │
│ 🌙 Luna                     │
│ 🏛 Rimsko cesarstvo         │
├─────────────────────────────┤
│ Vse teme                    │
└─────────────────────────────┘
```

Do not overwhelm the home screen with administration functionality.

---

# 33. Topic discovery

Support:

- category;
- tags;
- simple text search;
- recently added;
- already learned indicator.

Full-text server search is unnecessary.

A static client-side index is sufficient.

---

# 34. Visual direction

The application should be:

- clean;
- modern;
- calm;
- visual;
- touch-friendly;
- suitable for children without appearing designed for toddlers.

Avoid excessive:

- cartoon decorations;
- badges;
- animations;
- gamification;
- brightly competing colors.

Use generous spacing and large touch targets.

The interactive story should feel closer to an excellent illustrated science/history article than to a school worksheet.

---

# 35. Mobile/tablet requirements

Mobile is a first-class environment.

Minimum UX requirements:

- no horizontal scrolling;
- buttons easily usable with fingers;
- readable text without zooming;
- parent sections easy to expand;
- inline interactions easy to use;
- quiz choices large enough to tap;
- diagrams remain readable;
- navigation works well on portrait phone and tablet landscape;
- site loads quickly on mobile connections.

---

# 36. PWA

The site should be installable as a Progressive Web App.

V1 requirements:

- web manifest;
- application icon;
- standalone display mode;
- basic caching of application shell and previously opened content.

Goal:

On a tablet it should approximately behave like:

```text
Family Learning
```

rather than requiring the family to remember a browser URL.

Offline support does not need to be perfect.

Previously visited learning pages and quizzes should preferably remain usable offline.

---

# 37. Topic research and story-authoring workflow

New topics are parent initiated.

Example:

> Pripravi novo temo: Zakaj se menjajo letni časi?

ChatGPT Work should perform:

1. understand the actual question;
2. research authoritative sources;
3. prioritize Slovenian sources;
4. identify uncertainty or disagreement;
5. identify the key concepts the child should understand;
6. choose an effective story/hook;
7. create a narrative learning path;
8. insert at least three meaningful learner interactions;
9. prepare basic explanations;
10. prepare appropriate visuals/visual descriptions;
11. prepare deep-dive sections;
12. prepare parent notes;
13. create key facts;
14. create 15–30 reusable quiz questions;
15. classify topic stability;
16. choose review interval;
17. list sources.

Output should conform to the repository schemas.

---

# 38. ChatGPT Work authoring contract

Store permanent authoring instructions in:

```text
docs/topic-authoring.md
```

That document becomes the common contract between:

- ChatGPT Work;
- Codex;
- humans.

The important rule is:

> Agents should conform to repository format and the interactive-story model rather than inventing a new content format for every topic.

When creating a topic, the expected outputs are:

```text
src/content/topics/<slug>/index.mdx
src/content/topics/<slug>/quiz.json
```

plus assets only if necessary.

---

# 39. Minimum story acceptance rules

A normal published topic should satisfy all of the following:

- has a clear hook or opening question;
- contains a child-readable narrative core;
- contains at least **3 meaningful inline learner interactions** before the final quiz;
- interactions are integrated with the explanation;
- includes at least one reasoning/prediction interaction where appropriate;
- includes a recap / key facts section;
- has optional deeper material where useful;
- has parent notes for important caveats/simplifications;
- ends with or clearly links to a final quiz;
- contains authoritative sources;
- contains verification metadata.

Exceptions are allowed for very short topics, but should be deliberate.

---

# 40. V1 ChatGPT workflow

V1 does not require an OpenAI API key.

Preferred initial workflow:

```text
Parent
  ↓
ChatGPT Work
  ↓
research + interactive topic files
  ↓
review
  ↓
apply to Git repository
  ↓
commit / PR
  ↓
GitHub Actions validation
  ↓
merge
  ↓
deploy
```

If ChatGPT has appropriate GitHub repository integration available, PR creation can later become part of the Work workflow.

The system must not depend on that capability.

Codex should be able to apply generated topic bundles directly.

---

# 41. Dynamic topic lifecycle

Some facts change.

Every topic therefore carries:

```text
last_verified
stability
review_interval_days
```

Example:

```text
Vulkani
stable
365 days
```

versus:

```text
Predlog novega zakona
changing
7 days
```

---

# 42. GitHub review workflow

GitHub Action:

```text
review-due.yml
```

runs periodically.

Weekly is sufficient initially.

Its job is deterministic:

```text
for every topic:

    due =
        last_verified
        + review_interval_days
        <= today
```

The Action **does not research the web**.

It produces or updates one GitHub Issue:

```text
Knowledge review due

- [ ] predlog-zakona-x
      last verified: 2026-08-20
      interval: 7 days

- [ ] ai-in-izobrazevanju
      last verified: 2026-06-01
      interval: 60 days
```

Avoid creating dozens of individual issues unnecessarily.

---

# 43. Optional ChatGPT Scheduled Task

ChatGPT Scheduled Tasks complement GitHub Actions.

They do not replace them.

Suggested task:

> Periodically review changing topics from the Family Learning knowledge base. Check authoritative current sources and notify me only if there has been a meaningful factual development that could require updating a topic.

Its purpose is:

**human notification and judgment.**

Not repository orchestration.

Example notification:

```text
Topic update detected

Predlog zakona X

The parliamentary committee accepted an amended version
on 14 September.

The current learning article says the proposal still awaits
committee consideration.

This topic should be updated.
```

Parent can then invoke Work:

> Posodobi to temo.

---

# 44. Updating an interactive story

When a topic changes, the updater must not only patch factual paragraphs.

It should check whether the change affects:

- the main explanation;
- prediction/reveal interactions;
- diagrams;
- parent notes;
- key facts;
- quiz questions.

Example:

If a legislative proposal changes status, any embedded question asking:

> Kaj se mora zgoditi naslednje?

may also need updating.

The update workflow therefore treats the **whole learning story and quiz as one educational unit**.

---

# 45. Change history

Changing articles should not silently rewrite history where changes themselves are educationally useful.

Optional section:

```md
## Kaj se je spremenilo?

**14. 9. 2026**

Predlog zakona je po obravnavi odbora spremenjen ...

**31. 8. 2026**

Prvotna različica ...
```

Git itself remains the authoritative detailed change history.

The article changelog is for meaningful educational changes only.

---

# 46. GitHub Actions

V1 contains three workflows.

---

## validate.yml

Runs on pull requests and pushes.

Checks:

- application builds;
- MDX compiles;
- Markdown/front matter validates;
- required fields exist;
- quiz JSON validates;
- question IDs are unique;
- referenced topics exist;
- dates are valid;
- URLs have valid syntax;
- required topic acceptance metadata exists.

Where practical, validation should also detect obviously malformed interactive components.

A malformed topic must fail CI.

---

## deploy.yml

Runs on merge/push to the main branch.

Performs:

```text
install
test
validate content
build
deploy GitHub Pages
```

---

## review-due.yml

Runs approximately weekly.

Performs:

```text
read topic metadata
calculate due reviews
update/create review issue
```

No LLM.

No external AI API.

---

# 47. Link checking

Broken link checking is useful but should not make normal development painful.

Recommended:

- periodically check external source URLs;
- do not perform every external HTTP request during every local build;
- run link checking on a scheduled GitHub workflow.

This can either be part of `review-due.yml` initially or separated later.

---

# 48. Privacy

The Git repository should contain no information identifying the children.

Do not commit:

- names;
- birthdays;
- personal learning results;
- photos;
- family information.

Use generic profile data locally.

Example:

```text
profile-id: child-1
age: 7
```

Browser learning history remains local.

This makes a public static knowledge repository substantially less problematic.

---

# 49. GitHub Pages visibility

For the simplest V1, treat learning content as non-sensitive.

Do not rely on an obscure GitHub Pages URL as an access-control mechanism.

If private access becomes important later, move deployment behind proper authentication, for example:

```text
GitHub repository
       ↓
Cloudflare Pages
       ↓
Cloudflare Access
```

This does not require changing the underlying content architecture.

---

# 50. Required setup

Before development:

## GitHub

Create repository:

```text
family-learning
```

Recommended:

```text
main branch protected
pull requests preferred
GitHub Actions enabled
GitHub Pages enabled
```

A public repository is simplest for the prototype if it contains no personal data.

---

## Local development

Install:

- Git;
- a currently supported Node.js LTS release;
- npm;
- VS Code/Codex environment.

Pin the Node version in the repository.

---

## ChatGPT

Useful capabilities:

- ChatGPT Work;
- web research / Deep Research;
- Scheduled Tasks.

Optional:

- connect GitHub to ChatGPT if repository integration is available and useful.

V1 does **not** require:

```text
OPENAI_API_KEY
```

---

# 51. Development environment

Recommended commands:

```text
npm install

npm run dev

npm run validate

npm test

npm run build
```

These should work locally and in GitHub Actions.

Avoid CI-only functionality where possible.

---

# 52. Schema validation

Use explicit schemas.

Suggested:

- Zod for TypeScript runtime validation;
- Astro content collection schema for topic metadata;
- Zod schema for quiz JSON.

Do not rely on TypeScript interfaces alone because content is loaded from files.

Errors should identify the offending topic and field.

Example:

```text
ERROR

src/content/topics/vulkani/quiz.json

question vulkani-014:
missing required property "explanation"
```

---

# 53. Testing strategy

V1 does not need extensive test coverage.

Prioritize tests around logic where mistakes affect behaviour.

Unit tests:

- review interval calculation;
- spaced repetition;
- daily question selection;
- profile storage serialization;
- quiz validation;
- learning-component state where non-trivial.

Build-time validation handles most content problems.

Add a small browser/end-to-end test for critical flows:

```text
open topic
complete an inline interaction
expand parent note
mark learned
take quiz
reload
progress remains
```

Do not build a large E2E suite yet.

---

# 54. Accessibility

Basic accessibility is required even for the prototype.

Use:

- semantic headings;
- sufficient contrast;
- keyboard-accessible controls;
- visible focus states;
- semantic disclosure components where practical;
- descriptive button labels;
- no information communicated only using color;
- interaction feedback readable by assistive technology.

Quiz status should include text:

```text
✓ Pravilen odgovor
```

rather than only green styling.

Prediction and reveal interactions must remain usable with keyboard and touch.

---

# 55. Performance goals

The static-first architecture should naturally produce a fast site.

Aim for:

- minimal JavaScript on article pages;
- hydrate only interactive components;
- lazy-loaded images;
- no runtime API calls;
- no large frontend framework bundle unless justified;
- normal HTML available immediately.

The reading experience should remain fast even on an older tablet.

---

# 56. Initial example topics

Development should use 3–5 realistic topics rather than lorem ipsum.

Suggested test set:

### Stable science

```text
Zakaj je nebo modro?
```

Useful for prediction + simple visual.

### Stable science with strong interactive story

```text
Zakaj Luna ne pade na Zemljo?
```

Useful for prediction, reveal, diagram and thought experiment.

### History

```text
Kako so živeli Rimljani?
```

Useful for narrative/story-driven learning.

### Current/changeable topic

```text
Kako nastane zakon v Sloveniji?
```

Useful for changing metadata and process visualization.

These exercise different parts of the content, interaction and review system.

---

# 57. V1 user journey

## Learn

Parent or child opens:

```text
Family Learning
```

Selects:

> Zakaj Luna ne pade na Zemljo?

The story begins with a question.

The child predicts an answer.

The explanation is revealed.

A diagram explains the orbit.

The family pauses at a thinking prompt.

Older child optionally expands:

> 🔎 Poglej globlje

Parent optionally expands:

> 👨‍👩‍👧 Za starše

The story ends with key facts.

Child selects:

> ✓ Tema prebrana

---

## Immediate quiz

Select:

> Preveri znanje

Complete approximately 5 questions from this topic.

Answers receive explanations.

Questions enter review history.

---

## Another day

Open app.

Home screen says:

```text
🧠 Današnji izziv
5 vprašanj
```

Questions come from older topics.

No AI request occurs.

---

## Changing knowledge

GitHub Action determines that a topic is due for verification.

Separately, ChatGPT monitoring may detect an important development.

Parent receives notification.

Parent tells ChatGPT Work:

> Posodobi temo X glede na najnovejše informacije.

Work researches and updates the entire learning story where necessary.

Parent reviews and merges.

Site redeploys.

---

# 58. Likeable prototype requirements

"Prototype" should mean limited scope, **not poor UX**.

V1 should already feel pleasant enough that the family wants to use it.

Therefore V1 includes:

- coherent typography;
- polished topic cards;
- responsive layout;
- good empty states;
- clear disclosure interactions;
- polished prediction/reveal blocks;
- simple readable diagrams;
- clear quiz feedback;
- progress indicator during quizzes;
- useful home screen;
- PWA icon;
- sensible loading/error states;
- visually distinct parent and deep-dive sections.

V1 should not look like rendered GitHub Markdown.

More importantly, it should not feel like a static article with a quiz bolted onto the end.

---

# 59. Suggested navigation

Mobile:

```text
🏠 Domov
📚 Teme
🧠 Ponovi
```

Progress/profile selection can be accessible from the header/menu.

Avoid more than approximately four primary navigation destinations.

---

# 60. Administration

Do not build an administration web UI.

Administration happens through Git:

```text
topics
metadata
quiz files
commits
pull requests
```

This is intentional.

If managing MDX manually eventually becomes a problem, an authoring UI can be considered later.

---

# 61. Content review indicator

Every topic page should display understated metadata near the bottom:

```text
Nazadnje preverjeno: 31. avgust 2026
```

For changing content:

```text
⚠ Ta tema opisuje področje, ki se lahko spreminja.

Nazadnje preverjeno: 31. avgust 2026
```

This teaches both adults and children that knowledge may have temporal context.

---

# 62. Generated review manifest

During build, generate a machine-readable file such as:

```text
/review-feed.json
```

Example:

```json
[
  {
    "slug": "kako-nastane-zakon",
    "title": "Kako nastane zakon v Sloveniji?",
    "stability": "changing",
    "lastVerified": "2026-08-31",
    "reviewIntervalDays": 14
  }
]
```

This has several future uses:

- GitHub Actions;
- ChatGPT monitoring;
- external tools;
- future agent automation.

It costs almost nothing to support now and avoids scraping article HTML later.

---

# 63. Future-compatible design decisions

V1 should deliberately leave migration paths for:

### Cloud profiles

Replace `localStorage` with backend persistence.

### Advanced spaced repetition

Replace interval strategy with FSRS or similar.

### Knowledge graph

Use existing `concept` metadata.

### Automatic PR generation

GitHub Action + OpenAI API.

### AI-assisted short answers

Add runtime API.

### Suggested next topics

Use concepts and related topic metadata.

### Personalized learning path

Use profile knowledge history.

### Richer learning interactions

Add carefully selected components such as:

- ordering;
- labeling;
- timeline interaction;
- richer diagrams;
- simple simulations.

These should be added based on actual use, not anticipated complexity.

None are required now.

---

# 64. Suggested implementation milestones

## Milestone 1 — Interactive story foundation

Implement:

- Astro + MDX;
- base styling;
- homepage;
- topic collection;
- topic page;
- `Prediction`;
- `Reveal`;
- `Think`;
- `DeepDive`;
- `ParentNote`;
- `KeyFacts`;
- one polished real topic: **Zakaj Luna ne pade na Zemljo?**

Success criterion:

A family can complete the topic on a phone/tablet and it feels like an interactive learning experience rather than an article.

---

## Milestone 2 — Content contract

Implement:

- topic schema;
- MDX authoring conventions;
- quiz schema;
- validation;
- `docs/topic-authoring.md`;
- sample content;
- remaining V1 interaction primitives: `Choice`, `Experiment`, `Visual`.

Success criterion:

An agent can create a new interactive learning story without changing application code.

---

## Milestone 3 — Topic quiz

Implement:

- multiple choice;
- true/false;
- explanations;
- question progress;
- local result storage.

Success criterion:

A child can complete a topic quiz and reload the page without losing history.

---

## Milestone 4 — Daily recall

Implement:

- local profiles;
- learned-topic state;
- spaced repetition;
- daily question selection;
- review page.

Success criterion:

Questions answered on previous days automatically reappear when due.

---

## Milestone 5 — PWA/polish

Implement:

- manifest;
- icons;
- mobile UX;
- caching;
- final visual polish;
- interaction polish.

Success criterion:

The application can be added to the tablet/phone home screen and feels application-like.

---

## Milestone 6 — CI/CD

Implement:

- `validate.yml`;
- `deploy.yml`;
- GitHub Pages.

Success criterion:

Merging a valid topic automatically publishes it.

Invalid topic data fails CI.

---

## Milestone 7 — Knowledge maintenance

Implement:

- `last_verified`;
- stability;
- review intervals;
- `review-feed.json`;
- `review-due.yml`;
- review GitHub Issue.

Success criterion:

Changing topics automatically appear in a review queue when stale.

---

## Milestone 8 — ChatGPT workflow

Create/refine:

```text
docs/topic-authoring.md
docs/topic-updating.md
```

Test the process with several real questions.

Success criterion:

The parent can ask ChatGPT for a new topic and receive files that:

- form a coherent interactive learning story;
- use the supported primitives appropriately;
- contain at least three meaningful interactions;
- pass repository validation without manual restructuring.

---

# 65. V1 acceptance criteria

V1 is complete when all of the following are true.

## Authoring

Given:

> Zakaj je nebo modro?

ChatGPT can produce a topic bundle matching the repository format.

## Interactive story

The topic is not merely text followed by a quiz.

A normal topic contains at least three meaningful learner interactions integrated into the learning flow.

## Publishing

Adding that bundle and merging it publishes a new topic automatically.

## Reading

The resulting page is comfortable to use on phone and tablet.

## Layering

The page provides:

```text
child-readable core
interactive learning flow
deep dive
parent notes
```

## Quiz

Topic contains reusable automatically evaluated questions.

## Recall

Questions from learned topics return according to review history.

## Profiles

Multiple family members can maintain independent progress on one device.

## Knowledge maintenance

Changing topics have a visible verification date.

GitHub automatically identifies overdue topics.

## Reliability

Malformed content fails validation before publication.

## Independence

The published application works without ChatGPT or OpenAI API calls.

---

# 66. First implementation decision record

For V1:

```text
CONTENT
MDX + JSON

FRONTEND
Astro + TypeScript

LEARNING MODEL
interactive learning stories

INTERACTION COMPONENTS
Prediction
Reveal
Think
Choice
Experiment
Visual
DeepDive
ParentNote
KeyFacts

STATE
browser localStorage

DATABASE
Git repository

HOSTING
GitHub Pages

CI/CD
GitHub Actions

RESEARCH
ChatGPT Work / Deep Research

RECURRING KNOWLEDGE CHECK
GitHub review schedule
+
optional ChatGPT Scheduled Task

AI API
none

AUTHENTICATION
none

PERSONAL DATA IN REPOSITORY
none
```

---

# 67. Central architectural rule

When implementation choices become ambiguous, use this rule:

> Keep permanent knowledge in Git, keep personal learning state on the device, use deterministic code for mechanics, use ChatGPT where research or reasoning adds value, and make every topic an active learning experience rather than a passive article.

This should keep V1 small enough to build and maintain while preserving a straightforward path toward a considerably more capable family learning system later.