import { defineConfig, devices } from '@playwright/test';

/**
 * COMPLYPRO E2E ACCEPTANCE & REGRESSION CONFIGURATION
 * 
 * Safety Rules:
 * 1. COMPLYPRO_E2E_TARGET must be explicitly set to 'production' to target the live domain.
 * 2. If COMPLYPRO_E2E_TARGET is not 'production' and COMPLYPRO_BASE_URL is not set,
 *    an unroutable invalid URL is used so no accidental requests touch production.
 * 3. Never store credentials in storageState.
 * 4. Screenshots, traces, and videos are retained ONLY on failure.
 */

const target = process.env.COMPLYPRO_E2E_TARGET;
const customBaseUrl = process.env.COMPLYPRO_BASE_URL;

let baseURL: string;
if (target === 'production') {
  baseURL = 'https://www.complypro.pt';
} else if (customBaseUrl) {
  baseURL = customBaseUrl;
} else {
  // Safe default: no silent fallback to production
  baseURL = 'https://unconfigured-e2e-target.invalid';
}

export default defineConfig({
  testDir: './tests',
  testMatch: /.*\.spec\.ts/,
  timeout: 60000,
  expect: {
    timeout: 10000
  },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [
    ['list'],
    ['html', { open: 'never', outputFolder: 'playwright-report' }]
  ],
  use: {
    baseURL,
    headless: true,
    viewport: { width: 1366, height: 768 },
    actionTimeout: 15000,
    navigationTimeout: 30000,
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
    video: 'retain-on-failure',
    ignoreHTTPSErrors: false
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] }
    }
  ]
});
