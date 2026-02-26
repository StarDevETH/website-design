import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const distDir = resolve(process.cwd(), "dist");
const cleanPageMap = {
  services: "services.html",
  gallery: "gallery.html",
  "work-with-us": "work-with-us.html",
  contact: "contact.html"
};

async function ensureCleanRoute(routeSlug, sourceHtml) {
  const sourcePath = resolve(distDir, sourceHtml);
  const routeDir = resolve(distDir, routeSlug);
  const routeIndex = resolve(routeDir, "index.html");
  const html = await readFile(sourcePath, "utf8");

  await mkdir(routeDir, { recursive: true });
  await writeFile(routeIndex, html, "utf8");
}

async function main() {
  await Promise.all(
    Object.entries(cleanPageMap).map(([slug, file]) => ensureCleanRoute(slug, file))
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});