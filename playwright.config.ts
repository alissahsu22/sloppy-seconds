import { defineConfig, devices } from "@playwright/test";

const PORT = 4174;

/** Runs against the production build, at the sizes the layout bends around. */
export default defineConfig({
  testDir: "e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: { baseURL: `http://localhost:${PORT}/`, trace: "retain-on-failure" },
  webServer: {
    command: `npm run build && npx vite preview --port ${PORT} --strictPort`,
    port: PORT,
    reuseExistingServer: !process.env.CI,
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"], viewport: { width: 1280, height: 800 } } },
    {
      name: "phone",
      use: { ...devices["Desktop Chrome"], viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true },
    },
    {
      name: "landscape-phone",
      use: { ...devices["Desktop Chrome"], viewport: { width: 568, height: 320 }, hasTouch: true, isMobile: true },
    },
  ],
});
