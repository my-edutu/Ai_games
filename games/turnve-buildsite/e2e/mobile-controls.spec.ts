import { expect, test } from '@playwright/test';

const ppe = ['Hard hat', 'High-visibility vest', 'Safety boots', 'Safety glasses'];

test('touch viewport exposes first-person movement, look and inspect controls', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/?demo=true');
  await page.getByRole('button', { name: 'Skip fly-through' }).click();
  for (const item of ppe) await page.getByRole('button', { name: new RegExp(item, 'i') }).click();
  await page.getByRole('button', { name: 'Present PPE to security' }).click();
  await page.getByRole('button', { name: 'Begin guided site walk' }).click();

  await expect(page.getByLabel('Movement joystick')).toBeVisible();
  await expect(page.getByLabel('Look around')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Inspect nearby issue' })).toBeVisible();
  await expect(page.getByText('WASD move')).toHaveCount(0);
});
