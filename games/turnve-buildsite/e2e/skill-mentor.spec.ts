import { expect, test } from '@playwright/test';
import { beginMentorLesson, dragAcross, reachBuildSite } from './mentor-helpers';

test('masonry learner performs the job on the live 3D workpiece', async ({ page }) => {
  test.setTimeout(120_000);
  await reachBuildSite(page);
  const scene = page.getByLabel('3D construction site');
  const coach = await beginMentorLesson(page, 'Move near Emeka', 'Emeka Nwosu', 'Block Laying Fundamentals');

  for (const id of ['masonry-tool-block', 'masonry-tool-mortar', 'masonry-tool-trowel', 'masonry-tool-level', 'masonry-tool-line']) {
    await page.getByTestId(id).click();
  }
  await expect(coach).toContainText('Step 2 / 5');

  await dragAcross(page, 'masonry-mortar-trace');
  await expect(page.getByTestId('masonry-bed-state')).toHaveAttribute('data-complete', 'true');
  await expect(coach).toContainText('Step 3 / 5');

  await dragAcross(page, 'masonry-block-drag', 0.2, 0.78);
  await expect(page.getByTestId('masonry-block-state')).toHaveAttribute('data-placed', 'true');
  await expect(coach).toContainText('Step 4 / 5');

  await dragAcross(page, 'masonry-align-drag', 0.25, 0.52);
  await expect(page.getByTestId('masonry-level-state')).toHaveAttribute('data-level', 'true');
  await expect(coach).toContainText('Step 5 / 5');

  await dragAcross(page, 'masonry-joint-trace');
  const complete = page.getByRole('dialog', { name: 'Skill Mentor lesson' });
  await expect(complete).toContainText('Skill complete');
  await expect(complete).toContainText(/\/100/);
  await complete.getByRole('button', { name: 'Return to site' }).click();
  await expect(scene).toHaveAttribute('data-skill-focus', 'none');
  await expect(page.getByLabel('Movement joystick')).toBeVisible();
});
