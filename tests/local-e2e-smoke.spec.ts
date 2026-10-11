/**
 * COMPLYPRO R5 - LOCAL browser smoke test.
 *
 * Scope: bounded, localhost-only journeys against the Vite dev server,
 * unauthenticated only. App-mode (protected) journeys require a real saved
 * session; the login API route does not exist on this server, so those flows
 * are documented as manual/blocked in the R5 report - never faked or bypassed.
 */
import { test, expect } from '@playwright/test';

// Vite dev cold-compile of the SPA graph can exceed the 30s default on first hit.
test.use({ navigationTimeout: 90_000 });

const pageErrors: string[] = [];

test.beforeEach(async ({ page }) => {
  page.on('pageerror', (err) => pageErrors.push(String(err)));
});

test('S1: application boots and renders the public landing view', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Build with your framework');
  await expect(page.getByText('ComplyPRO').first()).toBeVisible();
});

test('S2: unauthenticated deep-links to protected routes fall back to the landing view', async ({ page }) => {
  for (const path of ['/agents', '/discover', '/evidence', '/settings']) {
    await page.goto(path);
    // onForceLanding only flips React state - the URL keeps the deep-link path.
    expect(page.url()).toContain(path);
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Build with your framework');
    await expect(page.getByRole('button', { name: 'Sign In' })).toBeVisible();
  }
});

test('S3: Sign In entry opens the real auth modal (email/password + submit)', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Sign In' }).click();
  await expect(page.getByPlaceholder('name@enterprise.com')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Sign In to Workspace' })).toBeVisible();
});

test('S4: no fabricated session or user claims while unauthenticated', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('Sign Out')).toHaveCount(0);
  await expect(page.getByText('roberto.silva@enterprise.ai')).toHaveCount(0);
});

test('S5: public proof surface is explicitly marked DEMO with an honesty notice', async ({ page }) => {
  await page.goto('/');
  const notice = page.getByText(/Demonstration data/);
  await notice.first().scrollIntoViewIfNeeded();
  await expect(notice.first()).toBeVisible();
  await expect(page.getByText('EVIDENCE LEDGER (DEMO)').first()).toBeVisible();
  await expect(page.getByText(/not live execution or verified evidence/).first()).toBeVisible();
});

test('S6: landing runtime-proof copy carries the DEMO/fallback honesty markers', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText(/Passport: fixture/).first()).toBeVisible();
  await expect(page.getByText(/demo fixture/).first()).toBeVisible();
});

test('S7: no critical browser console (page) errors across the session', async () => {
  expect(pageErrors, `page errors: ${pageErrors.join(' | ')}`).toEqual([]);
});
