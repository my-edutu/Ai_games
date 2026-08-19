import { expect, test } from '@playwright/test';

const ppe = ['Hard hat', 'High-visibility vest', 'Safety boots', 'Safety glasses'];

test('touch viewport exposes and responds to first-person movement controls', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/?demo=true');
  await page.getByRole('button', { name: 'Skip fly-through' }).click();
  for (const item of ppe) await page.getByRole('button', { name: new RegExp(item, 'i') }).click();
  await page.getByRole('button', { name: 'Present PPE to security' }).click();
  await page.getByRole('button', { name: 'Begin guided site walk' }).click();

  const joystick = page.getByLabel('Movement joystick');
  const look = page.getByLabel('Look around');
  const inspect = page.getByRole('button', { name: 'Inspect nearby issue' });
  await expect(joystick).toBeVisible();
  await expect(look).toBeVisible();
  await expect(inspect).toBeVisible();
  await expect(page.getByText('WASD move')).toHaveCount(0);

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

  const lookBox = await look.boundingBox();
  expect(lookBox).not.toBeNull();
  await page.mouse.move(lookBox!.x + lookBox!.width * .65, lookBox!.y + lookBox!.height * .45);
  await page.mouse.down();
  await page.mouse.move(lookBox!.x + lookBox!.width * .52, lookBox!.y + lookBox!.height * .38, { steps: 3 });
  await page.mouse.up();
  await expect(page.getByText('Inspect the site and record evidence.')).toBeVisible();
});
