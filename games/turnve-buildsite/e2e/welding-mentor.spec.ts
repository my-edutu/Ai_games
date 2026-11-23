import { expect, test } from '@playwright/test';
import { beginMentorLesson, dragAcross, reachBuildSite } from './mentor-helpers';

test('welding learner inspects real bay components and traces the seam', async ({ page }) => {
  test.setTimeout(120_000);
  await reachBuildSite(page);
  const coach = await beginMentorLesson(page, 'Move near Tunde', 'Tunde Balogun', 'Welding Travel Control');

  for (const id of ['welding-ppe-helmet', 'welding-ppe-gloves', 'welding-ppe-jacket', 'welding-hot-zone']) await page.getByTestId(id).click();
  await expect(coach).toContainText('Step 2 / 5');

  for (const id of ['welding-holder', 'welding-lead', 'welding-return', 'welding-table']) await page.getByTestId(id).click();
  await expect(coach).toContainText('Step 3 / 5');

  await dragAcross(page, 'welding-clamp-drag', 0.18, 0.82);
  await expect(page.getByTestId('welding-clamp-state')).toHaveAttribute('data-secured', 'true');
  await expect(coach).toContainText('Step 4 / 5');

  await dragAcross(page, 'welding-seam-trace', 0.08, 0.92);
  await expect(page.getByTestId('welding-bead-state')).toHaveAttribute('data-rendered', 'true');
  await expect(coach).toContainText('Step 5 / 5');

  await page.getByTestId('welding-bead-inspect').click();
  await expect(coach).toContainText('Skill complete');
  await expect(coach).toContainText(/\/100/);
  await expect(page.locator('.skill-lesson-panel')).toHaveCount(0);
});