import { expect, type Page } from '@playwright/test';

const ppe = ['Hard hat', 'High-visibility vest', 'Safety boots', 'Safety glasses'];

export async function reachBuildSite(page: Page, viewport = { width: 390, height: 844 }) {
  await page.setViewportSize(viewport);
  await page.goto('/?demo=true');
  await page.getByLabel('Your name').fill('Amina Yusuf');
  await page.getByRole('button', { name: 'Enter BuildSite' }).click();
  await page.getByRole('button', { name: 'Skip fly-through' }).click();
  for (const item of ppe) await page.getByRole('button', { name: new RegExp(item, 'i') }).click();
  await page.getByRole('button', { name: 'Present PPE to security' }).click();
  await page.getByRole('button', { name: 'Begin guided site walk' }).click();
  await expect(page.locator('canvas')).toHaveCount(1);
}

export async function beginMentorLesson(page: Page, presenterAction: string, mentorName: string, skillTitle: string) {
  await page.keyboard.press('Shift+P');
  const presenter = page.getByRole('dialog', { name: 'Pitch presenter controls' });
  await expect(presenter).toBeVisible();
  await presenter.getByRole('button', { name: presenterAction }).click();
  await presenter.locator('header button').click();

  const prompt = page.locator('.skill-mentor-prompt');
  await expect(prompt).toBeVisible({ timeout: 7000 });
  await expect(prompt).toContainText(mentorName);
  await prompt.getByRole('button', { name: 'Learn this job' }).click();

  const gate = page.getByRole('dialog', { name: 'Skill Mentor lesson' });
  await expect(gate.getByRole('heading', { name: skillTitle })).toBeVisible();
  await gate.getByRole('button', { name: 'Begin practice' }).click();

  const coach = page.locator('.skill-coach');
  await expect(coach).toBeVisible();
  await expect(page.locator('.skill-lesson-panel')).toHaveCount(0);
  await expect(coach.locator('details.skill-accessibility-fallback')).not.toHaveAttribute('open', '');
  return coach;
}

export async function dragAcross(page: Page, testId: string, from = 0.15, to = 0.85) {
  const target = page.getByTestId(testId);
  await expect(target).toBeVisible();
  const box = await target.boundingBox();
  if (!box) throw new Error(`${testId} has no bounding box`);
  const y = box.y + box.height / 2;
  await page.mouse.move(box.x + box.width * from, y);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * to, y, { steps: 10 });
  await page.mouse.up();
}
