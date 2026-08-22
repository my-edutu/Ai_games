import { expect, test, type Locator, type Page } from '@playwright/test';

const ppe = ['Hard hat', 'High-visibility vest', 'Safety boots', 'Safety glasses'];
const clickFlow = (locator: Locator) => locator.evaluate((element) => (element as HTMLElement).click());

async function signIn(page: Page, name = 'Amina Yusuf') {
  await page.getByLabel('Your name').fill(name);
  await clickFlow(page.getByRole('button', { name: 'Enter BuildSite' }));
  await clickFlow(page.getByRole('button', { name: 'Start Guided Internship' }));
}

test('guided pitch flow reaches an evidence-backed readiness report with simplified work UI', async ({ page }) => {
  test.setTimeout(60_000);

  await page.goto('/?demo=true&render=lite');
  await signIn(page);
  await expect(page.getByText(/Amina Yusuf/).first()).toBeVisible();
  await clickFlow(page.getByRole('button', { name: 'Skip fly-through' }));

  await expect(page.getByRole('heading', { name: 'Site induction: select your PPE' })).toBeVisible();
  expect(await page.evaluate(() => document.pointerLockElement)).toBeNull();
  for (const item of ppe) {
    const button = page.getByRole('button', { name: new RegExp(item, 'i') });
    await clickFlow(button);
    await expect(button).toHaveClass(/selected/);
  }
  await clickFlow(page.getByRole('button', { name: 'Present PPE to security' }));

  await expect(page.getByRole('heading', { name: /Maya Okafor/ })).toBeVisible();
  await expect(page.locator('.briefing-human .quote')).toContainText('Amina Yusuf');
  await clickFlow(page.getByRole('button', { name: 'Begin guided site walk' }));
  await expect(page.getByText('Inspect the site and record evidence.')).toBeVisible();
  await expect(page.locator('.metric-card')).toHaveCount(0);
  await expect(page.getByLabel('3D construction site')).toHaveAttribute('data-render-mode', 'automation-lite');

  await clickFlow(page.getByRole('button', { name: 'Site Tablet' }));
  const tablet = page.getByRole('dialog', { name: 'Turnve Site Tablet' });
  await expect(tablet).toBeVisible();
  await expect(tablet.locator('nav button')).toHaveCount(3);
  for (const area of ['Today', 'Site', 'Work']) await expect(tablet.getByRole('button', { name: area, exact: true })).toBeVisible();
  await expect(tablet.getByRole('button', { name: 'People', exact: true })).toHaveCount(0);

  await clickFlow(tablet.getByRole('button', { name: 'Site', exact: true }));
  await expect(page.getByRole('heading', { name: 'Site readiness' })).toBeVisible();
  await clickFlow(tablet.getByRole('button', { name: 'Work', exact: true }));
  await clickFlow(page.getByRole('button', { name: 'Record revision discrepancy' }));
  await expect(page.getByText(/Revision mismatch recorded/).first()).toBeVisible();
  await clickFlow(page.getByLabel('Close tablet'));

  await page.keyboard.press('Shift+P');
  const presenter = page.getByRole('dialog', { name: 'Pitch presenter controls' });
  await expect(presenter).toBeVisible();
  await clickFlow(page.getByRole('button', { name: 'Jump to artifact moment' }));
  await page.keyboard.press('Shift+P');
  await expect(presenter).toHaveCount(0);
  await expect.poll(() => page.evaluate(() => document.pointerLockElement === null)).toBe(true);

  await clickFlow(page.getByRole('button', { name: 'Open Work' }));
  await expect(page.getByText('Professional evidence')).toBeVisible();
  const openArtifact = page.locator('.artifact-disclosure[open]').first();
  await expect(openArtifact).toBeVisible();
  const assist = openArtifact.getByRole('button', { name: 'Use collected evidence' });
  await clickFlow(assist);
  await expect(openArtifact.locator('textarea').first()).not.toHaveValue('');
  await clickFlow(page.getByLabel('Close tablet'));

  await page.keyboard.press('Shift+P');
  await expect(presenter).toBeVisible();
  await clickFlow(page.getByRole('button', { name: 'Open evidence-backed report' }));
  await expect(page.getByRole('heading', { name: 'Intern Readiness Report' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'What this run proves' })).toBeVisible();

  await page.keyboard.press('Escape');
  await clickFlow(page.getByRole('button', { name: 'New simulation' }));
  await expect(page.getByRole('button', { name: 'Start Guided Internship' })).toBeVisible();
});