import { defineConfig, devices } from "@playwright/test";

const externalBaseUrl = process.env.DEMO_BASE_URL;

export default defineConfig({
  testDir: "./tests",
  webServer: externalBaseUrl
    ? undefined
    : {
        command: "npm run dev -- --host 127.0.0.1",
        url: "http://127.0.0.1:5178",
        reuseExistingServer: true,
      },
  use: {
    baseURL: externalBaseUrl ?? "http://127.0.0.1:5178",
    trace: "retain-on-failure",
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],
});
