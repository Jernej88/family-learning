import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";

import { topicSchema } from "./lib/content-schema";

const topics = defineCollection({
  loader: glob({
    base: "./src/content/topics",
    pattern: "**/index.mdx",
  }),
  schema: topicSchema,
});

export const collections = { topics };

