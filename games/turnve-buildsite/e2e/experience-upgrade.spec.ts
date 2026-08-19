import { expect, test, type Locator } from '@playwright/test';

const ppe = ['Hard hat', 'High-visibility vest', 'Safety boots', 'Safety glasses'];
const clickFlow = (locator: Locator) => locator.evaluate((element) => (element as HTMLElement).click());

test('personalizes the site, supports drag-look, coaches communication and renders weather state', async ({ page }) => {
  test.setTimeout(60_000);
  await page.goto('/?demo=true');

  await expect(page.getByRole('heading', { name: 'What should the site team call you?' })).toBeVisible();
  await page.getByLabel('Your name').fill('chidi okafor');
  await clickFlow(page.getByRole('button', { name: 'Enter BuildSite' }));

  await expect(page.getByText(/Chidi Okafor/).first()).toBeVisible();
  await clickFlow(page.getByRole('button', { name: 'Skip fly-through' }));
  for (const item of ppe) await clickFlow(page.getByRole('button', { name: new RegExp(item, 'i') }));
  await clickFlow(page.getByRole('button', { name: 'Present PPE to security' }));

  await expect(page.locator('.briefing-human .quote')).toContainText('Chidi Okafor');
  await clickFlow(page.getByRole('button', { name: 'Begin guided site walk' }));

  const scene = page.getByLabel('3D construction site');
  await expect(scene).toHaveAttribute('data-look-control', 'drag');

  // Presenter jumps are operator-only shortcuts; real learner proximity remains camera driven.
  await page.keyboard.press('Shift+P');
  let presenter = page.getByRole('dialog', { name: 'Pitch presenter controls' });
  await clickFlow(presenter.getByRole('button', { name: 'Jump near Grace' }));
  await clickFlow(presenter.locator('header button'));
  await expect(page.locator('.communication-coach')).toBeVisible({ timeout: 7000 });
  await expect(page.locator('.communication-coach')).toContainText('Chidi');
  await expect(page.locator('.communication-coach')).toContainText('Grace Adebayo');
  await clickFlow(page.locator('.communication-coach').getByRole('button', { name: 'Not now' }));

  const box = await scene.boundingBox();
  if (!box) throw new Error('3D scene has no bounding box');
  await page.mouse.move(box.x + box.width * 0.65, box.y + box.height * 0.55);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * 0.52, box.y + box.height * 0.42, { steps: 8 });
  await page.mouse.up();
  expect(await page.evaluate(() => document.pointerLockElement)).toBeNull();

  await page.keyboard.press('Shift+P');
  presenter = page.getByRole('dialog', { name: 'Pitch presenter controls' });
  await clickFlow(presenter.getByRole('button', { name: 'Trigger rain' }));
  await clickFlow(presenter.locator('header button'));
  await expect(page.locator('.weather-chip')).toContainText(/rain/i);
  await expect(scene).toHaveAttribute('data-weather', 'rain');
});
