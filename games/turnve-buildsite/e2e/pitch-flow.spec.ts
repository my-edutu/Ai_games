import { expect, type Locator, type Page, test } from '@playwright/test';

const ppe = ['Hard hat', 'High-visibility vest', 'Safety boots', 'Safety glasses'];

async function realPointerClick(page: Page, locator: Locator) {
  await expect(locator).toBeVisible();
  const box = await locator.boundingBox();
  expect(box).not.toBeNull();
  const center = { x: box!.x + box!.width / 2, y: box!.y + box!.height / 2 };
  await page.mouse.move(center.x, center.y);
  const receiver = await locator.evaluate((element, point) => {
    const top = document.elementFromPoint(point.x, point.y);
    return {
      receivesPointer: top === element || (top !== null && element.contains(top)),
      topTag: top?.tagName ?? null,
      topClass: typeof top?.className === 'string' ? top.className : '',
      pointerLock: document.pointerLockElement?.tagName ?? null,
    };
  }, center);
  console.log(`POINTER_TARGET ${JSON.stringify(receiver)}`);
  expect(receiver.receivesPointer).toBe(true);
  await page.mouse.click(center.x, center.y);
}

test('guided pitch flow reaches the readiness report and resets', async ({ page }) => {
  await page.goto('/?demo=true');
  await expect(page.getByText('TURNVE BUILDSITE')).toBeVisible();
  await realPointerClick(page, page.getByRole('button', { name: 'Skip fly-through' }));

  await expect(page.getByRole('heading', { name: 'Site induction: select your PPE' })).toBeVisible();
  expect(await page.locator('.modal-backdrop').count()).toBe(1);
  for (const item of ppe) {
    const button = page.getByRole('button', { name: new RegExp(item, 'i') });
    await realPointerClick(page, button);
    await expect(button).toHaveClass(/selected/);
  }
  await realPointerClick(page, page.getByRole('button', { name: 'Present PPE to security' }));

  await expect(page.getByRole('heading', { name: /Maya Okafor/ })).toBeVisible();
  await realPointerClick(page, page.getByRole('button', { name: 'Begin guided site walk' }));
  await expect(page.getByText('Inspect the site and record evidence.')).toBeVisible();

  await realPointerClick(page, page.getByRole('button', { name: /Site Tablet/ }));
  await expect(page.getByRole('dialog', { name: 'Turnve Site Tablet' })).toBeVisible();
  await realPointerClick(page, page.getByRole('button', { name: 'Drawings' }));
  await realPointerClick(page, page.getByRole('button', { name: 'Record revision discrepancy' }));
  await expect(page.getByText(/Revision mismatch recorded/)).toBeVisible();
  await realPointerClick(page, page.getByLabel('Close tablet'));

  await page.keyboard.press('Shift+P');
  await expect(page.getByRole('dialog', { name: 'Pitch presenter controls' })).toBeVisible();
  await realPointerClick(page, page.getByRole('button', { name: 'Apply recommended sequence' }));
  await realPointerClick(page, page.getByRole('button', { name: 'Open final report' }));
  await expect(page.getByRole('heading', { name: 'Intern Readiness Report' })).toBeVisible();

  await page.keyboard.press('Escape');
  await realPointerClick(page, page.getByRole('button', { name: 'New simulation' }));
  await expect(page.getByRole('button', { name: 'Start Guided Internship' })).toBeVisible();
});
