import { defineConfig } from "@playwright/test"

// DHelm's first real Playwright suite (previously only an unused
// devDependency in homm-booking) — establishing the pattern here. Runs the
// actual app + Reverb server, not mocks, since the whole point is verifying
// realtime multi-browser sync.
export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false, // tests share one running app instance/board — see beforeEach's DB reset
  retries: 0,
  reporter: "list",
  use: {
    baseURL: "http://127.0.0.1:8123",
    trace: "retain-on-failure",
  },
  webServer: [
    {
      command: "php artisan serve --host=127.0.0.1 --port=8123",
      url: "http://127.0.0.1:8123/up",
      reuseExistingServer: !process.env.CI,
      timeout: 30_000,
    },
    {
      // Must stay on the port already baked into the built frontend bundle
      // via .env's REVERB_PORT at `npm run build` time (Vite env vars are
      // compile-time, not overridable per-process here) — not the app's own
      // HTTP port above.
      command: "php artisan reverb:start --host=127.0.0.1",
      port: 8080,
      reuseExistingServer: !process.env.CI,
      timeout: 30_000,
    },
  ],
})
