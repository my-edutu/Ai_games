import { expect, test } from '@playwright/test';

test('opening site tour loops before start and exits only when the learner starts', async ({ page }) => {
  test.setTimeout(60_000);
  await page.goto('/');

  const scene = page.getByLabel('3D construction site');
  await expect(scene).toHaveAttribute('data-cinematic-mode', 'prestart-loop');
  await expect(scene.locator('canvas')).toBeVisible();

  await page.getByLabel('Your name').fill('Amina Yusuf');
  await page.getByRole('button', { name: 'Enter BuildSite' }).click();
  await expect(scene).toHaveAttribute('data-cinematic-mode', 'prestart-loop');

  await page.getByRole('button', { name: 'Start Guided Internship' }).click();
  await expect(scene).toHaveAttribute('data-cinematic-mode', 'entry-transition');
  await expect(page.getByText(/welcome to site/i)).toBeVisible();
});
