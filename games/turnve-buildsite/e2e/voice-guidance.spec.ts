import { expect, test, type Locator } from '@playwright/test';

const ppe = ['Hard hat', 'High-visibility vest', 'Safety boots', 'Safety glasses'];
const clickFlow = (locator: Locator) => locator.evaluate((element) => (element as HTMLElement).click());

test('voice guide personalizes onboarding and greets nearby site people by learner name', async ({ page }) => {
  await page.addInitScript(() => {
    const w = window as typeof window & { __spoken?: string[] };
    w.__spoken = [];
    class MockUtterance {
      text: string;
      lang = '';
      rate = 1;
      pitch = 1;
      volume = 1;
      voice: SpeechSynthesisVoice | null = null;
      onstart: (() => void) | null = null;
      onend: (() => void) | null = null;
      onerror: (() => void) | null = null;
      constructor(text: string) { this.text = text; }
    }
    Object.defineProperty(window, 'SpeechSynthesisUtterance', { configurable: true, value: MockUtterance });
    Object.defineProperty(window, 'speechSynthesis', {
      configurable: true,
      value: {
        cancel() {},
        getVoices() { return []; },
        speak(utterance: MockUtterance) {
          w.__spoken!.push(utterance.text);
          utterance.onstart?.();
          window.setTimeout(() => utterance.onend?.(), 180);
        },
      },
    });
  });

  await page.goto('/?demo=true');
  await page.getByLabel('Your name').fill('Amina Yusuf');
  await clickFlow(page.getByRole('button', { name: 'Enter BuildSite' }));
  await expect.poll(() => page.evaluate(() => ((window as typeof window & { __spoken?: string[] }).__spoken ?? []).some((line) => line.includes('Amina')))).toBe(true);

  await clickFlow(page.getByRole('button', { name: 'Skip fly-through' }));
  for (const item of ppe) await clickFlow(page.getByRole('button', { name: new RegExp(item, 'i') }));
  await clickFlow(page.getByRole('button', { name: 'Present PPE to security' }));
  await clickFlow(page.getByRole('button', { name: 'Begin guided site walk' }));

  await page.keyboard.press('Shift+P');
  const presenter = page.getByRole('dialog', { name: 'Pitch presenter controls' });
  await clickFlow(presenter.getByRole('button', { name: 'Jump near Grace' }));
  await clickFlow(presenter.getByRole('button', { name: '×' }));

  await expect.poll(() => page.evaluate(() => ((window as typeof window & { __spoken?: string[] }).__spoken ?? []).some((line) => line.includes('Hello Amina') && line.includes('Grace'))), { timeout: 7000 }).toBe(true);
});
