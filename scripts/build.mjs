import { readFileSync, writeFileSync, mkdirSync, cpSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const srcDir = join(root, "src");
const distDir = join(root, "dist");
const partialsDir = join(root, "partials");

mkdirSync(distDir, { recursive: true });

const header = readFileSync(join(partialsDir, "header.html"), "utf8");
const footer = readFileSync(join(partialsDir, "footer.html"), "utf8");

for (const file of readdirSync(srcDir)) {
  if (!file.endsWith(".html")) continue;
  let html = readFileSync(join(srcDir, file), "utf8");
  html = html.replaceAll("<!--#HEADER-->", header);
  html = html.replaceAll("<!--#FOOTER-->", footer);
  writeFileSync(join(distDir, file), html, "utf8");
  console.log("built", file);
}

cpSync(join(root, "assets"), join(distDir, "assets"), { recursive: true });
cpSync(join(root, "robots.txt"), join(distDir, "robots.txt"));

const DOMAIN = "https://iron-and-blade-773.netlify.app";
const pages = readdirSync(distDir)
  .filter((f) => f.endsWith(".html") && f !== "404.html")
  .sort((a, b) => (a === "index.html" ? -1 : b === "index.html" ? 1 : 0));
const lastmod = new Date().toISOString().slice(0, 10);
const urls = pages.map((p) => {
  const loc = p === "index.html" ? "" : p;
  return `  <url>\n    <loc>${DOMAIN}/${loc}</loc>\n    <lastmod>${lastmod}</lastmod>\n  </url>`;
}).join("");
writeFileSync(join(distDir, "sitemap.xml"), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`, "utf8");
console.log("generated sitemap.xml");
console.log("copied assets + robots.txt");