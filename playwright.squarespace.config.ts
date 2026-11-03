import { defineConfig, devices } from "@playwright/test";
import base from "./playwright.config";

/** Additional engines for the embed. Chromium sizes run in the main suite. */
export default defineConfig({
  ...base,
  testMatch: "widget.spec.ts",
  workers: 3,
  projects: [
    { name: "firefox", use: { ...devices["Desktop Firefox"], viewport: { width: 1280, height: 800 } } },
    { name: "safari", use: { ...devices["Desktop Safari"], viewport: { width: 1280, height: 800 } } },
    { name: "iphone", use: { ...devices["iPhone 13"] } },
    { name: "iphone-landscape", use: { ...devices["iPhone 13 landscape"] } },
  ],
});
