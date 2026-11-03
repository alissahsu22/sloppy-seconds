import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { defineConfig, type Plugin } from "vitest/config";
import react from "@vitejs/plugin-react";

/** Serves the host-page fixture in dev and preview without adding it to the site build. */
function hostFixture(): Plugin {
  const serve: Plugin["configureServer"] = (server) => {
    server.middlewares.use((req, res, next) => {
      const url = req.url?.split("?")[0];
      if (url !== "/fixtures/host.html") {
        next();
        return;
      }
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.end(readFileSync(resolve("fixtures/host.html")));
    });
  };
  return {
    name: "host-fixture",
    configureServer: serve,
    configurePreviewServer: serve,
  };
}

export default defineConfig({
  plugins: [react(), hostFixture()],
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
