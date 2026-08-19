import { expect, test } from '@playwright/test';

const ppe = ['Hard hat', 'High-visibility vest', 'Safety boots', 'Safety glasses'];

test('touch viewport exposes thumb movement, drag-look and mobile-first work UI', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/?demo=true');
  await page.getByLabel('Your name').fill('Amina Yusuf');
  await page.getByRole('button', { name: 'Enter BuildSite' }).click();
  await page.getByRole('button', { name: 'Skip fly-through' }).click();
  for (const item of ppe) await page.getByRole('button', { name: new RegExp(item, 'i') }).click();
  await page.getByRole('button', { name: 'Present PPE to security' }).click();
  await page.getByRole('button', { name: 'Begin guided site walk' }).click();

  const joystick = page.getByLabel('Movement joystick');
  const inspect = page.getByRole('button', { name: 'Inspect nearby issue' });
  const scene = page.getByLabel('3D construction site');
  await expect(scene.locator('canvas')).toBeVisible();
  await expect(scene).not.toHaveAttribute('data-render-mode', 'automation-lite');
  await expect(joystick).toBeVisible();
  await expect(inspect).toBeVisible();
  await expect(scene).toHaveAttribute('data-look-control', 'drag');
  await expect(page.getByText('DRAG THE SITE TO LOOK')).toBeVisible();

  const box = await joystick.boundingBox();
  expect(box).not.toBeNull();
  const centerX = box!.x + box!.width / 2;
  const centerY = box!.y + box!.height / 2;
  await page.mouse.move(centerX, centerY);
  await page.mouse.down();
  await page.mouse.move(centerX + 28, centerY - 34, { steps: 3 });
  await expect(page.locator('.touch-stick')).not.toHaveCSS('transform', 'none');
  await page.waitForTimeout(150);
  await page.mouse.up();
  await expect(page.locator('.touch-stick')).toHaveAttribute('style', /translate\(0px, 0px\)/);

  const sceneBox = await scene.boundingBox();
  expect(sceneBox).not.toBeNull();
  await page.mouse.move(sceneBox!.x + sceneBox!.width * .72, sceneBox!.y + sceneBox!.height * .48);
  await page.mouse.down();
  await page.mouse.move(sceneBox!.x + sceneBox!.width * .58, sceneBox!.y + sceneBox!.height * .35, { steps: 4 });
  await page.mouse.up();
  expect(await page.evaluate(() => document.pointerLockElement)).toBeNull();
  await expect(page.getByText('Inspect the site and record evidence.')).toBeVisible();

  await page.getByRole('button', { name: 'Site Tablet' }).click();
  const tablet = page.getByRole('dialog', { name: 'Turnve Site Tablet' });
  await expect(tablet).toBeVisible();
  await expect(tablet.locator('nav button')).toHaveCount(3);
  await expect(tablet.getByRole('button', { name: 'Today', exact: true })).toBeVisible();
  await expect(tablet.getByRole('button', { name: 'Site', exact: true })).toBeVisible();
  await expect(tablet.getByRole('button', { name: 'Work', exact: true })).toBeVisible();
  const tabletBox = await tablet.boundingBox();
  expect(tabletBox).not.toBeNull();
  expect(tabletBox!.width).toBeGreaterThanOrEqual(380);
});
