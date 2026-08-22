import { expect, test } from '@playwright/test';
import { reachBuildSite } from './mentor-helpers';

const truck = ['cab','grille','windshield','mirror-left','mirror-right','front-wheel-left','front-wheel-right','rear-dual-left','rear-dual-right','drum','hopper','chute','ladder'];
const wheelbarrow = ['tray','rim','frame','wheel','axle','leg-left','leg-right','handle-left','handle-right'];
const crane = ['mast','jib','counter-jib','counterweight','cab','trolley','hook'];
const generator = ['frame','engine','fuel-tank','control-panel','exhaust','wheel-left','wheel-right','handle'];
const scaffold = ['base-plates','uprights','ledgers','transoms','braces','platform','guard-rail','toe-board'];

const expectedIds = [
  ...truck.map((part) => `truck-${part}`),
  ...wheelbarrow.map((part) => `wheelbarrow-${part}`),
  ...crane.map((part) => `crane-${part}`),
  ...generator.map((part) => `generator-${part}`),
  ...scaffold.map((part) => `scaffold-${part}`),
  'truck-drivetrain-state',
  'crane-motion-state',
];

test('close-range construction equipment exposes complete component structure', async ({ page }) => {
  test.setTimeout(120_000);
  await reachBuildSite(page, { width: 1280, height: 820 });

  const ids = await page.locator('[data-testid]').evaluateAll((elements) => elements
    .map((element) => element.getAttribute('data-testid'))
    .filter((value): value is string => Boolean(value)));

  for (const id of expectedIds) expect(ids, `missing equipment part: ${id}`).toContain(id);

  await expect(page.getByTestId('truck-drivetrain-state')).toHaveAttribute('data-drum-animated', 'true');
  await expect(page.getByTestId('crane-motion-state')).toHaveAttribute('data-trolley-animated', 'true');
});
