import { expect, test } from '@playwright/test';
import { reachBuildSite } from './mentor-helpers';

const truck = ['cab','grille','windshield','mirror-left','mirror-right','front-wheel-left','front-wheel-right','rear-dual-left','rear-dual-right','drum','hopper','chute','ladder'];
const wheelbarrow = ['tray','rim','frame','wheel','axle','leg-left','leg-right','handle-left','handle-right'];
const crane = ['mast','jib','counter-jib','counterweight','cab','trolley','hook'];
const generator = ['frame','engine','fuel-tank','control-panel','exhaust','wheel-left','wheel-right','handle'];
const scaffold = ['base-plates','uprights','ledgers','transoms','braces','platform','guard-rail','toe-board'];

test('close-range construction equipment exposes complete component structure', async ({ page }) => {
  test.setTimeout(90_000);
  await reachBuildSite(page, { width: 1280, height: 820 });

  for (const part of truck) await expect(page.getByTestId(`truck-${part}`)).toHaveCount(1);
  for (const part of wheelbarrow) await expect(page.getByTestId(`wheelbarrow-${part}`)).toHaveCount(1);
  for (const part of crane) await expect(page.getByTestId(`crane-${part}`)).toHaveCount(1);
  for (const part of generator) await expect(page.getByTestId(`generator-${part}`)).toHaveCount(1);
  for (const part of scaffold) await expect(page.getByTestId(`scaffold-${part}`)).toHaveCount(1);

  await expect(page.getByTestId('truck-drivetrain-state')).toHaveAttribute('data-drum-animated', 'true');
  await expect(page.getByTestId('crane-motion-state')).toHaveAttribute('data-trolley-animated', 'true');
});
