import { expect, test } from '@playwright/test';

const ppe = ['Hard hat', 'High-visibility vest', 'Safety boots', 'Safety glasses'];

test('guided pitch flow reaches an evidence-backed readiness report and resets', async ({ page }) => {
  await page.goto('/?demo=true');
  await expect(page.getByText('TURNVE BUILDSITE')).toBeVisible();
  await page.getByRole('button', { name: 'Skip fly-through' }).click();

  await expect(page.getByRole('heading', { name: 'Site induction: select your PPE' })).toBeVisible();
  expect(await page.evaluate(() => document.pointerLockElement)).toBeNull();
  expect(await page.locator('.modal-backdrop').count()).toBe(1);
  for (const item of ppe) {
    const button = page.getByRole('button', { name: new RegExp(item, 'i') });
    await button.click();
    await expect(button).toHaveClass(/selected/);
  }
  await page.getByRole('button', { name: 'Present PPE to security' }).click();

  await expect(page.getByRole('heading', { name: /Maya Okafor/ })).toBeVisible();
  await page.getByRole('button', { name: 'Begin guided site walk' }).click();
  await expect(page.getByText('Inspect the site and record evidence.')).toBeVisible();
  await expect(page.getByText('GUIDED SITE COACH')).toBeVisible();

  await page.getByRole('button', { name: /Site Tablet/ }).click();
  await expect(page.getByRole('dialog', { name: 'Turnve Site Tablet' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'The Concrete Pour Decision' })).toBeVisible();
  await page.getByRole('button', { name: 'Site Map' }).click();
  await expect(page.getByRole('heading', { name: 'Live site map' })).toBeVisible();
  await page.getByRole('button', { name: 'Drawings' }).click();
  await page.getByRole('button', { name: 'Record revision discrepancy' }).click();
  await expect(page.getByText(/Revision mismatch recorded/)).toBeVisible();
  await page.getByLabel('Close tablet').click();

  await page.keyboard.press('Shift+P');
  const presenter = page.getByRole('dialog', { name: 'Pitch presenter controls' });
  await expect(presenter).toBeVisible();
  await page.getByRole('button', { name: 'Jump to artifact moment' }).click();
  await presenter.getByRole('button', { name: '×' }).click();
  await expect.poll(() => page.evaluate(() => document.pointerLockElement === null)).toBe(true);

  const openArtifacts = page.getByRole('button', { name: 'Open Artifacts' });
  await expect(openArtifacts).toBeVisible();
  await openArtifacts.click();
  await expect(page.getByText('Turn evidence into professional records')).toBeVisible();
  const assist = page.getByRole('button', { name: 'Use collected evidence' }).first();
  await assist.click();
  await expect(page.locator('.artifact-card textarea').first()).not.toHaveValue('');
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
