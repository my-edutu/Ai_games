import { expect, test, type Page } from '@playwright/test';

const ppe = ['Hard hat', 'High-visibility vest', 'Safety boots', 'Safety glasses'];

async function reachSite(page: Page) {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/?demo=true');
  await page.getByLabel('Your name').fill('Amina Yusuf');
  await page.getByRole('button', { name: 'Enter BuildSite' }).click();
  await page.getByRole('button', { name: 'Skip fly-through' }).click();
  for (const item of ppe) await page.getByRole('button', { name: new RegExp(item, 'i') }).click();
  await page.getByRole('button', { name: 'Present PPE to security' }).click();
  await page.getByRole('button', { name: 'Begin guided site walk' }).click();
}

async function focusStation(page: Page, buttonName: string) {
  await page.keyboard.press('Shift+P');
  const presenter = page.getByRole('dialog', { name: 'Pitch presenter controls' });
  await expect(presenter).toBeVisible();
  await presenter.getByRole('button', { name: buttonName }).click();
  await presenter.locator('header button').click();
  return page.locator('.object-action-sheet');
}

test('mobile learner can carry materials and complete a scored welding practice', async ({ page }) => {
  test.setTimeout(80_000);
  await reachSite(page);

  const firstSheet = await focusStation(page, 'Focus brick practice');
  await expect(firstSheet.getByRole('heading', { name: 'Block & Brick Stack' })).toBeVisible();
  const sheetBox = await firstSheet.boundingBox();
  expect(sheetBox).not.toBeNull();
  expect(sheetBox!.width).toBeGreaterThan(370);
  expect(Math.abs((sheetBox!.y + sheetBox!.height) - 844)).toBeLessThan(3);
  const pick = firstSheet.getByRole('button', { name: 'Pick up one brick' });
  const pickBox = await pick.boundingBox();
  expect(pickBox).not.toBeNull();
  expect(pickBox!.height).toBeGreaterThanOrEqual(48);
  await pick.click();
  await expect(page.locator('.object-action-sheet')).toHaveCount(0);
  await expect(page.locator('.practical-status')).toContainText('Carrying');

  let dropSheet = await focusStation(page, 'Focus brick laydown');
  await dropSheet.getByRole('button', { name: 'Place carried brick' }).click();

  for (let transfer = 0; transfer < 2; transfer++) {
    const sourceSheet = await focusStation(page, 'Focus brick practice');
    await sourceSheet.getByRole('button', { name: 'Pick up one brick' }).click();
    dropSheet = await focusStation(page, 'Focus brick laydown');
    await dropSheet.getByRole('button', { name: 'Place carried brick' }).click();
  }

  dropSheet = await focusStation(page, 'Focus brick laydown');
  await expect(dropSheet).toContainText('100/100');
  await expect(dropSheet).toContainText('3/3 delivered');
  await expect(dropSheet).toContainText('Material-handling practice completed');
  await dropSheet.getByLabel('Close object details').click();

  const weldSheet = await focusStation(page, 'Focus welding practice');
  await expect(weldSheet.getByRole('heading', { name: 'Welding Practice Bay' })).toBeVisible();
  await weldSheet.getByRole('button', { name: 'Begin guided practice' }).click();
  await weldSheet.getByRole('button', { name: 'Confirm welding PPE & clear bay' }).click();
  await weldSheet.getByRole('button', { name: 'Secure and check practice coupon' }).click();

  const trace = weldSheet.getByRole('button', { name: 'Practice welding pass from start to end' });
  await expect(trace).toBeVisible();
  const traceBox = await trace.boundingBox();
  expect(traceBox).not.toBeNull();
  const y = traceBox!.y + traceBox!.height / 2;
  const startX = traceBox!.x + traceBox!.width * 0.08;
  const endX = traceBox!.x + traceBox!.width * 0.94;
  await page.mouse.move(startX, y);
  await page.mouse.down();
  await page.mouse.move(endX, y + 1, { steps: 7 });
  await page.mouse.up();

  await expect(weldSheet.getByText('Travel-control score')).toBeVisible();
  await weldSheet.getByRole('button', { name: 'Inspect practice bead' }).click();
  await expect(weldSheet).toContainText('Welding practice learning sequence completed');
  await expect(weldSheet).toContainText(/9\d\/100|100\/100/);
  await weldSheet.getByLabel('Close object details').click();

  await page.keyboard.press('Shift+P');
  const presenter = page.getByRole('dialog', { name: 'Pitch presenter controls' });
  await presenter.getByRole('button', { name: 'Open evidence-backed report' }).click();
  const practicalReport = page.locator('.practical-report');
  await expect(practicalReport.getByRole('heading', { name: 'Practical action performance' })).toBeVisible();
  await expect(practicalReport).toContainText('3/3 bricks delivered');
  await expect(practicalReport).toContainText('Safety-first sequence complete');
});
