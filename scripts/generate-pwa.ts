import { createHash } from "node:crypto";
import { readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const repository = process.env.GITHUB_REPOSITORY?.split("/")[1] ?? "family-learning";
const configuredBase = process.env.BASE_PATH ?? `/${repository}`;
const baseSegment = configuredBase.replace(/^\/+|\/+$/g, "");
const base = baseSegment === "" ? "/" : `/${baseSegment}/`;
const outputDirectory = path.resolve("dist");

function publicUrl(relativePath: string): string {
  return `${base}${relativePath.replace(/^\/+/, "")}`;
}

async function findFiles(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map((entry) => {
      const target = path.join(directory, entry.name);
      return entry.isDirectory() ? findFiles(target) : Promise.resolve([target]);
    }),
  );
  return nested.flat();
}

function cacheUrl(file: string): string | undefined {
  const relative = path.relative(outputDirectory, file).split(path.sep).join("/");
  if (relative === "sw.js") return undefined;
  if (relative === "index.html") return base;
  if (relative.endsWith("/index.html")) return publicUrl(relative.slice(0, -"index.html".length));
  return publicUrl(relative);
}

const manifest = {
  id: base,
  name: "Družinsko učenje",
  short_name: "Učenje",
  description: "Interaktivne zgodbe za radovedne družine.",
  lang: "sl",
  start_url: base,
  scope: base,
  display: "standalone",
  background_color: "#fbfaf5",
  theme_color: "#173f4f",
  icons: [
    {
      src: publicUrl("icons/icon-192.png"),
      sizes: "192x192",
      type: "image/png",
    },
    {
      src: publicUrl("icons/icon-512.png"),
      sizes: "512x512",
      type: "image/png",
    },
    {
      src: publicUrl("icons/icon-maskable-512.png"),
      sizes: "512x512",
      type: "image/png",
      purpose: "maskable",
    },
  ],
};

await writeFile(path.join(outputDirectory, "manifest.webmanifest"), `${JSON.stringify(manifest, null, 2)}\n`);

const files = await findFiles(outputDirectory);
const precache = files.flatMap((file) => {
  const url = cacheUrl(file);
  return url ? [url] : [];
});
const contents = await Promise.all(files.filter((file) => cacheUrl(file)).map((file) => readFile(file)));
const revision = createHash("sha256")
  .update(JSON.stringify(precache))
  .update(Buffer.concat(contents))
  .digest("hex")
  .slice(0, 12);
const cacheName = `family-learning-${revision}`;

const serviceWorker = `const CACHE_NAME = ${JSON.stringify(cacheName)};
const PRECACHE = ${JSON.stringify(precache, null, 2)};

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE)));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((names) => Promise.all(names.filter((name) => name.startsWith("family-learning-") && name !== CACHE_NAME).map((name) => caches.delete(name))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") self.skipWaiting();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          return response;
        })
        .catch(() => caches.match(event.request).then((response) => response ?? caches.match(${JSON.stringify(base)}))),
    );
    return;
  }

  event.respondWith(caches.match(event.request).then((cached) => cached ?? fetch(event.request)));
});
`;

await writeFile(path.join(outputDirectory, "sw.js"), serviceWorker);
console.log(`Generated PWA manifest and service worker with ${precache.length} precached file(s).`);
