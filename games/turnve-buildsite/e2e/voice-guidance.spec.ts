import { expect, test } from '@playwright/test';

const ppe = ['Hard hat', 'High-visibility vest', 'Safety boots', 'Safety glasses'];

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
  await page.getByRole('button', { name: 'Enter BuildSite' }).click();
  await expect.poll(() => page.evaluate(() => ((window as typeof window & { __spoken?: string[] }).__spoken ?? []).some((line) => line.includes('Amina')))).toBe(true);

  await page.getByRole('button', { name: 'Skip fly-through' }).click();
  for (const item of ppe) await page.getByRole('button', { name: new RegExp(item, 'i') }).click();
  await page.getByRole('button', { name: 'Present PPE to security' }).click();
  await page.getByRole('button', { name: 'Begin guided site walk' }).click();

  await page.keyboard.press('Shift+P');
  const presenter = page.getByRole('dialog', { name: 'Pitch presenter controls' });
  await presenter.getByRole('button', { name: 'Jump near Grace' }).click();
  await presenter.getByRole('button', { name: '×' }).click();

  await expect.poll(() => page.evaluate(() => ((window as typeof window & { __spoken?: string[] }).__spoken ?? []).some((line) => line.includes('Hello Amina') && line.includes('Grace'))), { timeout: 7000 }).toBe(true);
});
