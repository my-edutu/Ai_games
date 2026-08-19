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

test('mobile learner enters a live lesson with compact guidance instead of a textbook overlay', async ({ page }) => {
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
  await prompt.getByRole('button', { name: 'Learn this job' }).click();

  await expect(scene).toHaveAttribute('data-skill-focus', 'masonry');
  const panel = page.getByRole('dialog', { name: 'Skill Mentor lesson' });
  await expect(panel.getByRole('heading', { name: 'Block Laying Fundamentals' })).toBeVisible();
  await panel.getByRole('button', { name: 'Begin practice' }).click();

  const coach = page.locator('.skill-coach');
  await expect(coach).toBeVisible();
  await expect(coach).toContainText('Emeka');
  await expect(coach).toContainText('Step 1 / 5');
  await expect(page.locator('.skill-lesson-panel')).toHaveCount(0);
  const coachBox = await coach.boundingBox();
  expect(coachBox).not.toBeNull();
  expect(coachBox!.height).toBeLessThan(190);

  const fallback = coach.locator('details.skill-accessibility-fallback');
  await expect(fallback.getByText('Keyboard / accessible controls')).toBeVisible();
  await expect(fallback.getByRole('button', { name: 'Identify materials and tools' })).not.toBeVisible();
  await fallback.locator('summary').click();

  for (const action of [
    'Identify materials and tools',
    'Prepare a level bed',
    'Place the block',
    'Align and level the block',
    'Finish the joint',
  ]) {
    const button = fallback.getByRole('button', { name: action });
    await expect(button).toBeVisible();
    await button.click();
  }

  const completePanel = page.getByRole('dialog', { name: 'Skill Mentor lesson' });
  await expect(completePanel).toContainText('Skill complete');
  await expect(completePanel).toContainText(/100\/100/);
  await completePanel.getByRole('button', { name: 'Return to site' }).click();
  await expect(scene).toHaveAttribute('data-skill-focus', 'none');
  await expect(page.getByLabel('Movement joystick')).toBeVisible();
});
