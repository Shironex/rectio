/** Browser checks shared by the shoot scripts. Each prints a short verdict, never a screenshot. */
import type { Page } from 'playwright';

declare global {
  interface Window {
    __rxMerchantSamples?: string[];
  }
}

/**
 * Starts sampling the dialog's Merchant field on every frame while the dialog is in the page. Call
 * it just before saving, then `dialogFieldsVerdict` once the dialog is gone: a saved form must keep
 * its text until the exit has finished, or the closing popup flashes an empty form.
 */
export async function watchDialogFields(page: Page) {
  await page.evaluate(() => {
    const samples: string[] = [];
    window.__rxMerchantSamples = samples;
    const tick = () => {
      const input = document.querySelector<HTMLInputElement>('[data-slot="dialog"] input');
      if (input === null) return;
      samples.push(input.value);
      requestAnimationFrame(tick);
    };
    tick();
  });
}

export async function dialogFieldsVerdict(page: Page) {
  const samples = await page.evaluate(() => window.__rxMerchantSamples ?? []);
  const firstFilled = samples.findIndex((value) => value !== '');
  const emptied = firstFilled >= 0 && samples.slice(firstFilled).some((value) => value === '');
  return emptied
    ? `FLASHED an empty form while closing (${String(samples.length)} frames)`
    : `kept its fields until gone (${String(samples.length)} frames)`;
}

/**
 * The smallest touch target among buttons, fields, select triggers and checkboxes on screen: the
 * larger of the element's box and its `::after` hit area.
 */
export async function smallestTouchTarget(page: Page) {
  return page.evaluate(() => {
    const selector =
      '[data-slot="button"], [data-slot="input"], [data-slot="select-trigger"], [data-slot="checkbox"], [data-slot="amount-input"] input, [data-slot="date-picker"], [data-slot="date-range-picker"], [data-slot="dialog"] button, [data-slot="data-table-sort"] button';
    let smallest = { size: Infinity, name: '' };
    for (const element of document.querySelectorAll<HTMLElement>(selector)) {
      const box = element.getBoundingClientRect();
      if (box.width === 0 || element.closest('[hidden], [aria-hidden="true"]') !== null) continue;
      const after = getComputedStyle(element, '::after');
      const hit =
        after.position === 'absolute'
          ? Math.min(Number.parseFloat(after.width), Number.parseFloat(after.height))
          : 0;
      const field = element.closest('[data-slot="amount-input"], [data-slot="date-picker"]');
      const height = field === null ? box.height : field.getBoundingClientRect().height;
      const size = Math.max(Math.min(box.width, height), hit);
      if (size < smallest.size)
        smallest = {
          size,
          name: element.getAttribute('aria-label') ?? element.textContent.trim().slice(0, 24),
        };
    }
    return `${smallest.size.toFixed(1)}px (${smallest.name})`;
  });
}
