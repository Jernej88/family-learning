import mdx from "@astrojs/mdx";
import { defineConfig } from "astro/config";

const repository = process.env.GITHUB_REPOSITORY?.split("/")[1] ?? "family-learning";
const owner = process.env.GITHUB_REPOSITORY_OWNER ?? "example";

export default defineConfig({
  site: process.env.SITE_URL ?? `https://${owner}.github.io`,
  base: process.env.BASE_PATH ?? `/${repository}`,
  integrations: [mdx()],
  output: "static",
});
