import { expect, test } from '@playwright/test';
import { beginMentorLesson, reachBuildSite } from './mentor-helpers';

test('rebar learner measures spacing and cover then marks the quality mismatch', async ({ page }) => {
  test.setTimeout(120_000);
  await reachBuildSite(page);
  const coach = await beginMentorLesson(page, 'Jump near Grace', 'Grace Adebayo', 'Rebar & Quality Control');

  await page.getByTestId('rebar-latest-detail').click();
  await expect(coach).toContainText('Step 2 / 6');

  await page.getByTestId('rebar-spacing-a').click();
  await page.getByTestId('rebar-spacing-b').click();
  await expect(page.getByTestId('rebar-measurement')).toContainText('200 mm');
  await expect(coach).toContainText('Step 3 / 6');

  await page.getByTestId('rebar-cover-a').click();
  await page.getByTestId('rebar-cover-b').click();
  await expect(page.getByTestId('rebar-measurement')).toContainText('40 mm');
  await expect(coach).toContainText('Step 4 / 6');

  await page.getByTestId('rebar-mismatch-zone').click();
  await expect(page.getByTestId('rebar-mark-state')).toHaveAttribute('data-marked', 'true');
  await expect(coach).toContainText('Step 5 / 6');

  await page.getByTestId('rebar-record-action').click();
  await expect(coach).toContainText('Step 6 / 6');
  await page.getByTestId('rebar-request-inspection').click();

  const complete = page.getByRole('dialog', { name: 'Skill Mentor lesson' });
  await expect(complete).toContainText('Skill complete');
});
