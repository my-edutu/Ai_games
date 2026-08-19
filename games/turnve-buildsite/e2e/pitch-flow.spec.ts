import { expect, test } from '@playwright/test';

const ppe = ['Hard hat', 'High-visibility vest', 'Safety boots', 'Safety glasses'];

async function signIn(page: import('@playwright/test').Page, name = 'Amina Yusuf') {
  await page.getByLabel('Your name').fill(name);
  await page.getByRole('button', { name: 'Enter BuildSite' }).click();
}

test('guided pitch flow reaches an evidence-backed readiness report with simplified work UI', async ({ page }) => {
  test.setTimeout(60_000);

  await page.goto('/?demo=true');
  await signIn(page);
  await expect(page.getByText(/Amina Yusuf/).first()).toBeVisible();
  await page.getByRole('button', { name: 'Skip fly-through' }).click();

  await expect(page.getByRole('heading', { name: 'Site induction: select your PPE' })).toBeVisible();
  expect(await page.evaluate(() => document.pointerLockElement)).toBeNull();
  for (const item of ppe) {
    const button = page.getByRole('button', { name: new RegExp(item, 'i') });
    await button.click();
    await expect(button).toHaveClass(/selected/);
  }
  await page.getByRole('button', { name: 'Present PPE to security' }).click();

  await expect(page.getByRole('heading', { name: /Maya Okafor/ })).toBeVisible();
  await expect(page.locator('.briefing-human .quote')).toContainText('Amina Yusuf');
  await page.getByRole('button', { name: 'Begin guided site walk' }).click();
  await expect(page.getByText('Inspect the site and record evidence.')).toBeVisible();
  await expect(page.locator('.metric-card')).toHaveCount(0);

  await page.getByRole('button', { name: 'Site Tablet' }).click();
  const tablet = page.getByRole('dialog', { name: 'Turnve Site Tablet' });
  await expect(tablet).toBeVisible();
  await expect(tablet.locator('nav button')).toHaveCount(3);
  for (const area of ['Today', 'Site', 'Work']) await expect(tablet.getByRole('button', { name: area, exact: true })).toBeVisible();
  await expect(tablet.getByRole('button', { name: 'People', exact: true })).toHaveCount(0);

  await tablet.getByRole('button', { name: 'Site', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Site readiness' })).toBeVisible();
  await tablet.getByRole('button', { name: 'Work', exact: true }).click();
  await page.getByRole('button', { name: 'Record revision discrepancy' }).click();
  await expect(page.getByText(/Revision mismatch recorded/).first()).toBeVisible();
  await page.getByLabel('Close tablet').click();

  await page.keyboard.press('Shift+P');
  const presenter = page.getByRole('dialog', { name: 'Pitch presenter controls' });
  await expect(presenter).toBeVisible();
  await page.getByRole('button', { name: 'Jump to artifact moment' }).click();
  await presenter.getByRole('button', { name: '×' }).click();
  await expect.poll(() => page.evaluate(() => document.pointerLockElement === null)).toBe(true);

  await page.getByRole('button', { name: 'Open Work' }).click();
  await expect(page.getByText('Professional evidence')).toBeVisible();
  const assist = page.getByRole('button', { name: 'Use collected evidence' }).first();
  await assist.click();
  await expect(page.locator('.artifact-disclosure[open] textarea').first()).not.toHaveValue('');
  await page.getByLabel('Close tablet').click();

  await page.keyboard.press('Shift+P');
  await expect(presenter).toBeVisible();
  await page.getByRole('button', { name: 'Open evidence-backed report' }).click();
  await expect(page.getByRole('heading', { name: 'Intern Readiness Report' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'What this run proves' })).toBeVisible();

  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'New simulation' }).click();
  await expect(page.getByRole('button', { name: 'Start Guided Internship' })).toBeVisible();
});
