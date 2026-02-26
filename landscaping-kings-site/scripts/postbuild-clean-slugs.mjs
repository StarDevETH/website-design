import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const projectRoot = process.cwd();
const distDir = resolve(projectRoot, "dist");
const cNamePath = resolve(projectRoot, "public", "CNAME");
const cleanPageMap = {
  services: "services.html",
  gallery: "gallery.html",
  "work-with-us": "work-with-us.html",
  contact: "contact.html"
};

function normalizeSiteUrl(hostname) {
  const cleanHost = String(hostname || "")
    .trim()
    .replace(/^https?:\/\//i, "")
    .replace(/\/+$/, "");
  return cleanHost ? `https://${cleanHost}` : "https://dmlandscapingkings.com";
}

function xmlEscape(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

async function getSiteUrl() {
  try {
    const hostname = await readFile(cNamePath, "utf8");
    return normalizeSiteUrl(hostname);
  } catch (_) {
    return "https://dmlandscapingkings.com";
  }
}

async function ensureCleanRoute(routeSlug, sourceHtml) {
  const sourcePath = resolve(distDir, sourceHtml);
  const routeDir = resolve(distDir, routeSlug);
  const routeIndex = resolve(routeDir, "index.html");
  const html = await readFile(sourcePath, "utf8");

  await mkdir(routeDir, { recursive: true });
  await writeFile(routeIndex, html, "utf8");
}

async function writeSeoFiles(siteUrl) {
  const lastmod = new Date().toISOString().slice(0, 10);
  const urls = [
    `${siteUrl}/`,
    `${siteUrl}/services/`,
    `${siteUrl}/gallery/`,
    `${siteUrl}/work-with-us/`,
    `${siteUrl}/contact/`
  ];

  const sitemap = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...urls.map(
      (url) =>
        `  <url><loc>${xmlEscape(url)}</loc><lastmod>${lastmod}</lastmod><changefreq>weekly</changefreq><priority>${url === `${siteUrl}/` ? "1.0" : "0.8"}</priority></url>`
    ),
    "</urlset>",
    ""
  ].join("\n");

  const robots = [
    "User-agent: *",
    "Allow: /",
    "",
    `Sitemap: ${siteUrl}/sitemap.xml`,
    ""
  ].join("\n");

  await writeFile(resolve(distDir, "sitemap.xml"), sitemap, "utf8");
  await writeFile(resolve(distDir, "robots.txt"), robots, "utf8");
}

async function main() {
  await Promise.all(
    Object.entries(cleanPageMap).map(([slug, file]) => ensureCleanRoute(slug, file))
  );

  const siteUrl = await getSiteUrl();
  await writeSeoFiles(siteUrl);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
