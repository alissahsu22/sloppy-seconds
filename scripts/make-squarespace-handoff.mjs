import { createHash } from "node:crypto";
import { cp, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { resolve } from "node:path";
import { releaseSnippets } from "./squarespace-snippets.mjs";

const config = JSON.parse(await readFile("squarespace/install.json", "utf8"));
const script = await readFile("dist/widget/sanctuary.js");
const snippets = releaseSnippets(config, script);
const root = resolve("handoff");
const folder = resolve(root, "sloppy-seconds-squarespace");
await rm(folder, { recursive: true, force: true });
await mkdir(folder, { recursive: true });
// Asset-pack prompts sit in public/ for local work but must not be published.
const publishable = (path) => !path.endsWith("CURSOR_PROMPT.txt");
await cp("dist", resolve(folder, "hosting"), { recursive: true, filter: publishable });
const vercel = JSON.parse(await readFile("vercel.json", "utf8"));
await writeFile(
  resolve(folder, "hosting/vercel.json"),
  JSON.stringify({ ...vercel, framework: null, buildCommand: null, outputDirectory: "." }, null, 2),
);
await cp("docs/squarespace-handoff.md", resolve(folder, "INSTALL.md"));
await cp("docs/squarespace.md", resolve(folder, "DEVELOPER-GUIDE.md"));
await cp("docs/SQUARESPACE_WIDGET_INSTALL.md", resolve(folder, "SQUARESPACE_WIDGET_INSTALL.md"));
await cp("docs/CLIENT_AI_INSTALL_PROMPT.md", resolve(folder, "CLIENT_AI_INSTALL_PROMPT.md"));
await writeFile(resolve(folder, "01-footer-injection.html"), snippets.footer);
await writeFile(resolve(folder, "02-launcher-code-block.html"), snippets.launcher);
await mkdir(resolve(folder, "scripts"));
await cp("scripts/verify-hosted-widget.mjs", resolve(folder, "scripts/verify-hosted-widget.mjs"));
const files = [];
async function inventory(path) {
  for (const entry of await readdir(resolve("dist", path), { withFileTypes: true })) {
    const name = `${path}/${entry.name}`;
    if (entry.isDirectory()) await inventory(name);
    else if (publishable(name)) {
      const bytes = await readFile(resolve("dist", name));
      files.push({ path: name, bytes: bytes.length, sha256: createHash("sha256").update(bytes).digest("hex") });
    }
  }
}
await inventory("widget");
await inventory("assets");
const manifest = {
  version: snippets.version,
  builtAt: new Date().toISOString(),
  siteUrl: config.siteUrl,
  assetBase: config.assetBase,
  scriptIntegrity: snippets.integrity,
  deployment: "Not deployed by this package. Run the public hosting verifier after upload.",
  files: files.sort((a, b) => a.path.localeCompare(b.path)),
};
await writeFile(resolve(folder, "release.json"), JSON.stringify(manifest, null, 2));
// Explicit allowlist: never copy .env, .vercel, .git, node_modules, or credentials.
const source = resolve(folder, "source");
await mkdir(source);
for (const path of [
  "src",
  "public",
  "fixtures",
  "e2e",
  "scripts",
  "squarespace",
  "docs",
  ".github",
  "package.json",
  "package-lock.json",
  "tsconfig.json",
  "vite.config.ts",
  "vite.widget.config.ts",
  "playwright.config.ts",
  "playwright.squarespace.config.ts",
  "eslint.config.js",
  ".prettierrc.json",
  ".prettierignore",
  ".gitignore",
  "index.html",
  "README.md",
  "vercel.json",
]) {
  await cp(path, resolve(source, path), { recursive: true, filter: publishable });
}
try {
  const qa = JSON.parse(await readFile("artifacts/squarespace-qa/results.json", "utf8"));
  if (qa.version !== snippets.version || qa.results.some((result) => !result.passed)) {
    throw new Error("Browser evidence is stale or failed. Run npm run check:squarespace-page before packaging.");
  }
  await cp("artifacts/squarespace-qa", resolve(folder, "qa"), { recursive: true });
} catch (error) {
  if (error.code !== "ENOENT") throw error;
  console.log("No real-page browser evidence found. Run npm run check:squarespace-page to include it.");
}
await mkdir(resolve(folder, "third-party"));
for (const pkg of ["react", "react-dom", "scheduler"])
  await cp(`node_modules/${pkg}/LICENSE`, resolve(folder, `third-party/${pkg}-LICENSE.txt`));
await writeFile(
  resolve(folder, "third-party/GSAP.txt"),
  "GSAP and @gsap/react: https://gsap.com/standard-license/\nGoogle Fonts: Jost, Silkscreen, Source Sans 3 are loaded from fonts.googleapis.com at runtime.\n",
);
await writeFile(
  resolve(folder, "START-HERE.html"),
  `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Sloppy Seconds · Squarespace handoff</title><style>body{font:18px/1.6 system-ui,sans-serif;max-width:760px;margin:50px auto;padding:0 24px;color:#203a32;background:#faf7ef}h1{line-height:1.15}li{margin:12px 0}a{color:#245b43}code{font-size:.9em}small{color:#58665f}</style><p>SLOPPY SECONDS · RELEASE ${snippets.version}</p><h1>Ready for your Squarespace installer.</h1><p>This package adds Wilbur, Toodles, the games and Field Guide to the existing Animals page. Hand over this entire folder.</p><ol><li><strong>Host first.</strong> Publish the included <code>hosting/</code> folder to the existing Vercel project, then run the included hosting check.</li><li><strong>Add the launcher.</strong> Paste <a href="02-launcher-code-block.html">02-launcher-code-block.html</a> into one HTML Code block on Our Animals.</li><li><strong>Add the script.</strong> Paste <a href="01-footer-injection.html">01-footer-injection.html</a> into site-wide Footer Code Injection.</li><li><strong>Check as a visitor.</strong> Open the home page in a private window, navigate to Our Animals, play both stories and check on a phone.</li></ol><p><strong>Read <a href="INSTALL.md">INSTALL.md</a> for exact steps, hosting commands, verification, updates and removal.</strong> Open the snippet files in a text editor to copy their contents; browsers may display the snippets as an empty page.</p><p>Public target: <a href="${config.siteUrl}">${config.siteUrl}</a><br>Expected asset host: ${config.assetBase}</p><small>Prepared for installation. This archive does not publish the files or change the live Squarespace site. Hosting and the final paste/save are the installer's steps. Source, assets, checksums and browser evidence are included.</small></html>`,
);
const archive = resolve(root, "sloppy-seconds-squarespace.zip");
await rm(archive, { force: true });
execFileSync("zip", ["-qr", archive, "sloppy-seconds-squarespace"], { cwd: root });
const hash = createHash("sha256")
  .update(await readFile(archive))
  .digest("hex");
await writeFile(`${archive}.sha256`, `${hash}  sloppy-seconds-squarespace.zip\n`);
console.log(
  `Prepared release ${snippets.version}: ${archive}\n${files.length} hosted files with checksums. No credentials included.`,
);
