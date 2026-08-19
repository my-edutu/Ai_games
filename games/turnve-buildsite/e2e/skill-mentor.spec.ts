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

test('mobile learner can approach a mentor, zoom into a live skill lesson and retain skill evidence', async ({ page }) => {
  test.setTimeout(90_000);
  await reachSite(page);

  const scene = page.getByLabel('3D construction site');
  await page.keyboard.press('Shift+P');
  const presenter = page.getByRole('dialog', { name: 'Pitch presenter controls' });
  await presenter.getByRole('button', { name: 'Move near Emeka' }).click();
  await presenter.locator('header button').click();

  const prompt = page.locator('.skill-mentor-prompt');
  await expect(prompt).toBeVisible({ timeout: 7000 });
  await expect(prompt).toContainText('Emeka Nwosu');
  await expect(prompt).toContainText('Block Laying Fundamentals');
  const learnButton = prompt.getByRole('button', { name: 'Learn this job' });
  const learnBox = await learnButton.boundingBox();
  expect(learnBox).not.toBeNull();
  expect(learnBox!.height).toBeGreaterThanOrEqual(44);
  await learnButton.click();

  await expect(scene).toHaveAttribute('data-skill-focus', 'masonry');
  const panel = page.getByRole('dialog', { name: 'Skill Mentor lesson' });
  await expect(panel).toBeVisible();
  await expect(panel.getByRole('heading', { name: 'Block Laying Fundamentals' })).toBeVisible();
  await expect(panel).toContainText('Emeka Nwosu');
  await panel.getByRole('button', { name: 'Begin practice' }).click();

  for (const action of [
    'Identify materials and tools',
    'Prepare a level bed',
    'Place the block',
    'Align and level the block',
    'Finish the joint',
  ]) {
    await expect(panel.getByRole('button', { name: action })).toBeVisible();
    await panel.getByRole('button', { name: action }).click();
  }

  await expect(panel).toContainText('Skill complete');
  await expect(panel).toContainText(/100\/100/);
  await panel.getByRole('button', { name: 'Return to site' }).click();
  await expect(panel).toHaveCount(0);
  await expect(scene).toHaveAttribute('data-skill-focus', 'none');
  await expect(page.getByLabel('Movement joystick')).toBeVisible();

  await page.keyboard.press('Shift+P');
  await page.getByRole('dialog', { name: 'Pitch presenter controls' }).getByRole('button', { name: 'Open evidence-backed report' }).click();
  const skills = page.locator('.skills-learned-report');
  await expect(skills.getByRole('heading', { name: 'Skills learned' })).toBeVisible();
  await expect(skills).toContainText('Block Laying Fundamentals');
  await expect(skills).toContainText('100/100');
});
