import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const repository = process.env.GITHUB_REPOSITORY?.split("/")[1] ?? "family-learning";
const configuredBase = process.env.BASE_PATH ?? `/${repository}`;
const base = `/${configuredBase.replace(/^\/+|\/+$/g, "")}/`;
const outputDirectory = path.resolve("dist");

async function findHtmlFiles(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(
    entries.map((entry) => {
      const target = path.join(directory, entry.name);
      return entry.isDirectory() ? findHtmlFiles(target) : Promise.resolve([target]);
    }),
  );
  return files.flat().filter((file) => file.endsWith(".html"));
}

const errors: string[] = [];
const htmlFiles = await findHtmlFiles(outputDirectory);

for (const file of htmlFiles) {
  const html = await readFile(file, "utf8");
  for (const match of html.matchAll(/\b(?:href|src)="(\/[^"#]*)/g)) {
    const url = match[1];
    if (!url.startsWith(base)) {
      errors.push(`${path.relative(process.cwd(), file)} contains root-hosted URL "${url}"`);
    }
  }
}

if (errors.length > 0) {
  console.error(`Subpath build validation failed:\n${errors.map((error) => `- ${error}`).join("\n")}`);
  process.exitCode = 1;
} else {
  console.log(`Validated ${htmlFiles.length} HTML file(s) under ${base}.`);
}

