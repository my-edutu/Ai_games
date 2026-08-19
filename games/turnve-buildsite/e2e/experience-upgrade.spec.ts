import { expect, test } from '@playwright/test';

const ppe = ['Hard hat', 'High-visibility vest', 'Safety boots', 'Safety glasses'];

test('personalizes the site, supports drag-look, coaches communication and renders weather state', async ({ page }) => {
  await page.goto('/?demo=true');

  await expect(page.getByRole('heading', { name: 'What should the site team call you?' })).toBeVisible();
  await page.getByLabel('Your name').fill('chidi okafor');
  await page.getByRole('button', { name: 'Enter BuildSite' }).click();

  await expect(page.getByText(/Chidi Okafor/)).toBeVisible();
  await page.getByRole('button', { name: 'Skip fly-through' }).click();
  for (const item of ppe) await page.getByRole('button', { name: new RegExp(item, 'i') }).click();
  await page.getByRole('button', { name: 'Present PPE to security' }).click();

  await expect(page.getByText(/Chidi Okafor/)).toBeVisible();
  await page.getByRole('button', { name: 'Begin guided site walk' }).click();

  const scene = page.getByLabel('3D construction site');
  await expect(scene).toHaveAttribute('data-look-control', 'drag');
  const box = await scene.boundingBox();
  if (!box) throw new Error('3D scene has no bounding box');
  await page.mouse.move(box.x + box.width * 0.65, box.y + box.height * 0.55);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * 0.52, box.y + box.height * 0.42, { steps: 8 });
  await page.mouse.up();
  expect(await page.evaluate(() => document.pointerLockElement)).toBeNull();

  await page.keyboard.down('KeyW');
  await page.waitForTimeout(2600);
  await page.keyboard.up('KeyW');
  await expect(page.locator('.communication-coach')).toBeVisible({ timeout: 7000 });
  await expect(page.locator('.communication-coach')).toContainText('Chidi');

  await page.keyboard.press('Shift+P');
  const presenter = page.getByRole('dialog', { name: 'Pitch presenter controls' });
  await presenter.getByRole('button', { name: 'Trigger rain' }).click();
  await presenter.getByRole('button', { name: '×' }).click();
  await expect(page.getByText('RAIN', { exact: true })).toBeVisible();
  await expect(scene).toHaveAttribute('data-weather', 'rain');
});
