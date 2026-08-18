import { expect, test } from '@playwright/test';

const ppe = ['Hard hat', 'High-visibility vest', 'Safety boots', 'Safety glasses'];

test('guided pitch flow reaches the readiness report and resets', async ({ page }) => {
  await page.goto('/?demo=true');
  await expect(page.getByText('TURNVE BUILDSITE')).toBeVisible();
  await page.getByRole('button', { name: 'Skip fly-through' }).click();

  await expect(page.getByRole('heading', { name: 'Site induction: select your PPE' })).toBeVisible();
  const firstPpe = page.getByRole('button', { name: /Hard hat/i });
  const hitTest = await firstPpe.evaluate((element) => {
    const rect = element.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    return {
      backdropCount: document.querySelectorAll('.modal-backdrop').length,
      center: { x, y },
      stack: document.elementsFromPoint(x, y).slice(0, 8).map((node) => ({
        tag: node.tagName,
        className: typeof node.className === 'string' ? node.className : '',
        text: (node.textContent ?? '').trim().slice(0, 80),
      })),
    };
  });
  console.log(`PPE_HIT_TEST ${JSON.stringify(hitTest)}`);
  expect(hitTest.backdropCount).toBe(1);
  expect(hitTest.stack[0]?.tag).toBe('BUTTON');

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
