import { access, readFile, readdir } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const repository = process.env.GITHUB_REPOSITORY?.split("/")[1] ?? "family-learning";
const configuredBase = process.env.BASE_PATH ?? `/${repository}`;
const baseSegment = configuredBase.replace(/^\/+|\/+$/g, "");
const base = baseSegment === "" ? "/" : `/${baseSegment}/`;
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

const manifestPath = path.join(outputDirectory, "manifest.webmanifest");
const serviceWorkerPath = path.join(outputDirectory, "sw.js");
try {
  await Promise.all([access(manifestPath), access(serviceWorkerPath)]);
  const manifest = JSON.parse(await readFile(manifestPath, "utf8")) as {
    id?: string;
    start_url?: string;
    scope?: string;
    display?: string;
    lang?: string;
    icons?: Array<{ src?: string; sizes?: string; purpose?: string }>;
  };
  if (manifest.id !== base || manifest.start_url !== base || manifest.scope !== base) {
    errors.push("manifest does not use the configured deployment base for id, start_url, and scope");
  }
  if (manifest.display !== "standalone" || manifest.lang !== "sl") {
    errors.push("manifest does not declare standalone Slovenian application metadata");
  }
  const icons = manifest.icons ?? [];
  for (const size of ["192x192", "512x512"]) {
    if (!icons.some((icon) => icon.sizes === size && icon.src?.startsWith(base))) {
      errors.push(`manifest does not contain a ${size} icon below ${base}`);
    }
  }
  if (!icons.some((icon) => icon.purpose === "maskable" && icon.src?.startsWith(base))) {
    errors.push("manifest does not contain a base-aware maskable icon");
  }

  const serviceWorker = await readFile(serviceWorkerPath, "utf8");
  if (!serviceWorker.includes("const PRECACHE =") || !serviceWorker.includes(JSON.stringify(base))) {
    errors.push("service worker does not contain a base-aware precache manifest");
  }
  for (const requiredUrl of [base, `${base}review/`, `${base}manifest.webmanifest`]) {
    if (!serviceWorker.includes(JSON.stringify(requiredUrl))) {
      errors.push(`service worker does not precache ${requiredUrl}`);
    }
  }
} catch {
  errors.push("PWA manifest or service worker was not generated");
}

if (errors.length > 0) {
  console.error(`Subpath build validation failed:\n${errors.map((error) => `- ${error}`).join("\n")}`);
  process.exitCode = 1;
} else {
  console.log(`Validated ${htmlFiles.length} HTML file(s) under ${base}.`);
}
