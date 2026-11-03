import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

// Works both from the repository and from the dependency-free handoff folder.
const root = fileURLToPath(new URL("../", import.meta.url));
const manifestPath = process.argv[3] || resolve(root, "release.json");
const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
const origin = (process.argv[2] || manifest.assetBase).replace(/\/+$/, "");
if (!origin.startsWith("https://") && !origin.startsWith("http://localhost:")) {
  throw new Error("Use a public HTTPS origin (or localhost for a local check).");
}
const failures = [];
let checked = 0;
// Check bytes, not just 200: static hosts sometimes return an HTML fallback.
const queue = [...manifest.files];
await Promise.all(
  Array.from({ length: 4 }, async () => {
    while (queue.length) {
      const file = queue.shift();
      const url = `${origin}/${file.path}?ss-check=${manifest.version}`;
      try {
        const response = await fetch(url, { signal: AbortSignal.timeout(20000), redirect: "follow" });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const type = response.headers.get("content-type") || "";
        if (type.includes("text/html")) throw new Error("received HTML instead of an asset");
        if (file.path.endsWith(".js") && !/javascript/.test(type))
          throw new Error(`incorrect script MIME type: ${type}`);
        if (file.path.startsWith("widget/") && response.headers.get("access-control-allow-origin") !== "*") {
          throw new Error("missing public cross-origin header required by the integrity-checked script");
        }
        const data = Buffer.from(await response.arrayBuffer());
        if (createHash("sha256").update(data).digest("hex") !== file.sha256)
          throw new Error("does not match this release");
        checked += 1;
      } catch (error) {
        failures.push(`${file.path}: ${error.message}`);
      }
    }
  }),
);
if (failures.length) {
  console.error(`NOT READY: ${failures.length} file(s) failed at ${origin}.\n${failures.join("\n")}`);
  process.exitCode = 1;
} else {
  console.log(`READY: ${checked} script and asset files match release ${manifest.version} at ${origin}.`);
}
