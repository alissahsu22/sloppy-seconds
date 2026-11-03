import { resolve } from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

/**
 * One classic script Squarespace can load. React, GSAP, and the game are bundled.
 * The standalone site build does not use this config, and this build does not
 * copy public assets (those stay at the site origin).
 */
export default defineConfig({
  plugins: [react()],
  publicDir: false,
  define: {
    "process.env.NODE_ENV": JSON.stringify("production"),
  },
  build: {
    outDir: "dist/widget",
    emptyOutDir: true,
    cssCodeSplit: false,
    rollupOptions: {
      input: resolve("src/widget/main.tsx"),
      output: {
        // No `name`: an IIFE assignment would overwrite window.SloppySeconds
        // with the wrapper's return value after the script sets the API itself.
        format: "iife",
        entryFileNames: "sanctuary.js",
        inlineDynamicImports: true,
        assetFileNames: "sanctuary.[ext]",
      },
    },
  },
});
