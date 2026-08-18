import { expect, test } from '@playwright/test';

const ppe = ['Hard hat', 'High-visibility vest', 'Safety boots', 'Safety glasses'];

test('guided pitch flow reaches the readiness report and resets', async ({ page }) => {
  await page.goto('/?demo=true');
  await expect(page.getByText('TURNVE BUILDSITE')).toBeVisible();
  await page.getByRole('button', { name: 'Skip fly-through' }).click();

  await expect(page.getByRole('heading', { name: 'Site induction: select your PPE' })).toBeVisible();
  for (const item of ppe) await page.getByRole('button', { name: new RegExp(item, 'i') }).click();
  await page.getByRole('button', { name: 'Present PPE to security' }).click();

  await expect(page.getByRole('heading', { name: /Maya Okafor/ })).toBeVisible();
  await page.getByRole('button', { name: 'Begin guided site walk' }).click();
  await expect(page.getByText('Inspect the site and record evidence.')).toBeVisible();

  await page.getByRole('button', { name: /Site Tablet/ }).click();
  await expect(page.getByRole('dialog', { name: 'Turnve Site Tablet' })).toBeVisible();
  await page.getByRole('button', { name: 'Drawings' }).click();
  await page.getByRole('button', { name: 'Record revision discrepancy' }).click();
  await expect(page.getByText(/Revision mismatch recorded/)).toBeVisible();
  await page.getByLabel('Close tablet').click();

  await page.keyboard.press('Shift+P');
  await expect(page.getByRole('dialog', { name: 'Pitch presenter controls' })).toBeVisible();
  await page.getByRole('button', { name: 'Apply recommended sequence' }).click();
  await page.getByRole('button', { name: 'Open final report' }).click();
  await expect(page.getByRole('heading', { name: 'Intern Readiness Report' })).toBeVisible();

  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'New simulation' }).click();
  await expect(page.getByRole('button', { name: 'Start Guided Internship' })).toBeVisible();
});
