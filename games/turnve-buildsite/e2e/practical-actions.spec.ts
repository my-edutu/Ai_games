import { expect, test, type Locator, type Page } from '@playwright/test';

const ppe = ['Hard hat', 'High-visibility vest', 'Safety boots', 'Safety glasses'];
const clickFlow = (locator: Locator) => locator.click({ force: true });

async function reachSite(page: Page) {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/?demo=true');
  await page.getByLabel('Your name').fill('Amina Yusuf');
  await clickFlow(page.getByRole('button', { name: 'Enter BuildSite' }));
  await clickFlow(page.getByRole('button', { name: 'Skip fly-through' }));
  for (const item of ppe) await clickFlow(page.getByRole('button', { name: new RegExp(item, 'i') }));
  await clickFlow(page.getByRole('button', { name: 'Present PPE to security' }));
  await clickFlow(page.getByRole('button', { name: 'Begin guided site walk' }));
}

async function focusStation(page: Page, buttonName: string) {
  await page.keyboard.press('Shift+P');
  const presenter = page.getByRole('dialog', { name: 'Pitch presenter controls' });
  await expect(presenter).toBeVisible();
  await clickFlow(presenter.getByRole('button', { name: buttonName }));
  await clickFlow(presenter.locator('header button'));
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
  await clickFlow(pick);
  await expect(page.locator('.object-action-sheet')).toHaveCount(0);
  await expect(page.locator('.practical-status')).toContainText('Carrying');

  let dropSheet = await focusStation(page, 'Focus brick laydown');
  await clickFlow(dropSheet.getByRole('button', { name: 'Place carried brick' }));

  for (let transfer = 0; transfer < 2; transfer++) {
    const sourceSheet = await focusStation(page, 'Focus brick practice');
    await clickFlow(sourceSheet.getByRole('button', { name: 'Pick up one brick' }));
    dropSheet = await focusStation(page, 'Focus brick laydown');
    await clickFlow(dropSheet.getByRole('button', { name: 'Place carried brick' }));
  }

  dropSheet = await focusStation(page, 'Focus brick laydown');
  await expect(dropSheet).toContainText('100/100');
  await expect(dropSheet).toContainText('3/3 delivered');
  await expect(dropSheet).toContainText('Material-handling practice completed');
  await clickFlow(dropSheet.getByLabel('Close object details'));

  const weldSheet = await focusStation(page, 'Focus welding practice');
  await expect(weldSheet.getByRole('heading', { name: 'Welding Practice Bay' })).toBeVisible();
  await clickFlow(weldSheet.getByRole('button', { name: 'Begin guided practice' }));
  await clickFlow(weldSheet.getByRole('button', { name: 'Confirm welding PPE & clear bay' }));
  await clickFlow(weldSheet.getByRole('button', { name: 'Secure and check practice coupon' }));

  const trace = weldSheet.getByRole('slider', { name: 'Practice welding pass from start to end' });
  await expect(trace).toBeVisible();
  await expect(trace).toHaveAttribute('type', 'range');
  const traceBox = await trace.boundingBox();
  expect(traceBox).not.toBeNull();
  expect(traceBox!.height).toBeGreaterThanOrEqual(44);
  await trace.fill('45');
  await trace.fill('72');
  await trace.fill('95');

  await expect(weldSheet.getByText('Travel-control score')).toBeVisible();
  await clickFlow(weldSheet.getByRole('button', { name: 'Inspect practice bead' }));
  await expect(weldSheet).toContainText('Welding practice learning sequence completed');
  await expect(weldSheet).toContainText(/8\d\/100|9\d\/100|100\/100/);
  await clickFlow(weldSheet.getByLabel('Close object details'));

  await page.keyboard.press('Shift+P');
  const presenter = page.getByRole('dialog', { name: 'Pitch presenter controls' });
  await clickFlow(presenter.getByRole('button', { name: 'Open evidence-backed report' }));
  const practicalReport = page.locator('.practical-report');
  await expect(practicalReport.getByRole('heading', { name: 'Practical action performance' })).toBeVisible();
  await expect(practicalReport).toContainText('3/3 bricks delivered');
  await expect(practicalReport).toContainText('Safety-first sequence complete');
});
