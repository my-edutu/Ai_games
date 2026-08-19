import { expect, test } from '@playwright/test';
import { beginMentorLesson, dragAcross, reachBuildSite } from './mentor-helpers';

test('formwork learner finds and physically corrects the weak support', async ({ page }) => {
  test.setTimeout(120_000);
  await reachBuildSite(page);
  const coach = await beginMentorLesson(page, 'Move near Daniel', 'Daniel Mensah', 'Formwork Readiness Inspection');

  for (const id of ['formwork-panel', 'formwork-waler', 'formwork-prop', 'formwork-brace']) await page.getByTestId(id).click();
  await expect(coach).toContainText('Step 2 / 6');

  await page.getByTestId('formwork-level-reference').click();
  await expect(coach).toContainText('Step 3 / 6');
  await page.getByTestId('formwork-brace-inspect').click();
  await expect(coach).toContainText('Step 4 / 6');
  await page.getByTestId('formwork-weak-prop').click();
  await expect(coach).toContainText('Step 5 / 6');

  await dragAcross(page, 'formwork-prop-drag', 0.18, 0.72);
  await expect(page.getByTestId('formwork-prop-state')).toHaveAttribute('data-seated', 'true');
  await dragAcross(page, 'formwork-brace-drag', 0.18, 0.82);
  await expect(page.getByTestId('formwork-brace-state')).toHaveAttribute('data-attached', 'true');
  await expect(coach).toContainText('Step 6 / 6');

  await page.getByTestId('formwork-final-verify').click();
  const complete = page.getByRole('dialog', { name: 'Skill Mentor lesson' });
  await expect(complete).toContainText('Skill complete');
});
