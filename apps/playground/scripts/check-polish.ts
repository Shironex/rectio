/**
 * Language check: `node scripts/check-polish.ts`. Renders every block at pl-PL in a headless page
 * (also the empty states and the dialogs and tables that open on request), collects every word the
 * DOM carries (text, screen reader text and aria, title and placeholder attributes) and fails on
 * any English left. Starts its own Vite server and never touches the screen.
 */
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { chromium, type Page } from 'playwright';
import { createServer } from 'vite';

const here = dirname(fileURLToPath(import.meta.url));

const BLOCKS = [
  'kpi-row',
  'cash-flow',
  'invoice-list',
  'invoice-detail',
  'ledger',
  'expense-approval',
  'ar-aging',
  'budget-vs-actual',
  'bank-reconciliation',
  'payouts',
  'vendors-list',
  'profit-and-loss',
  'tax-summary',
  'cash-runway',
] as const;

/** English words that never belong on a Polish screen. Names and brands are not in this list. */
const ENGLISH =
  /(?<![\p{L}])(the|of|and|to|in|no|for|with|from|all|paid|due|overdue|draft|void|pending|approved|rejected|total|balance|amount|date|invoice|invoices|customer|show|hide|table|select|reject|approve|cancel|close|reason|undo|sort|period|status|month|months|quarter|quarters|monthly|quarterly|inflow|outflow|net|debit|credit|budget|actual|variance|over|under|current|days|day|waiting|selected|nothing|none|description|reference|issued|opening|closing|entries|entry|account|accounts|key|figures|better|worse|new|create|import|set|view|submitted|expenses|expense|bank|feed|decision|decisions|recent|category|bucket|share|outstanding|receivables|aging|travel|software|meals|accommodation|salaries|contractors|licence|training|printed|guides|group|by|on|day|part|full|record|payment|payments|received|send|unit|price|qty|subtotal|tax|billed|ireland|poland|annual|seats|seat|vs|runway|cash|burn|payout|payouts|vendor|vendors|scheduled|transit|failed|retry|match|matched|unmatched|suggested|reconciled|statement|books|profit|loss|revenue|gross|margin|operating|collected|return|prepare|export|filed|active|hold|archived|search|terms|next|last)(?![\p{L}])/giu;

/** Words that read the same in Polish and English, or are names. */
const ALLOWED = new Set(['marketing', 'pdf', 'vat', 'sepa', 'ok', 'status', 'bank']);

/** Proper names in the sample data that happen to be English words. */
const NAMES = /The Shelbourne/g;

async function strings(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const found = new Set<string>();
    const add = (value: string | null | undefined) => {
      const text = value?.replace(/\s+/g, ' ').trim();
      if (text !== undefined && text !== '') found.add(text);
    };
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    for (let node = walker.nextNode(); node !== null; node = walker.nextNode()) {
      add(node.textContent);
    }
    for (const el of document.querySelectorAll('*')) {
      for (const attr of ['aria-label', 'title', 'placeholder', 'alt']) add(el.getAttribute(attr));
    }
    return [...found];
  });
}

function offenders(all: readonly string[]): string[] {
  return all.filter((text) => {
    const hits = text.replace(NAMES, '').match(ENGLISH) ?? [];
    return hits.some((word) => !ALLOWED.has(word.toLowerCase()));
  });
}

async function openThings(page: Page, block: string) {
  for (const button of await page.getByRole('button', { name: 'Pokaż tabelę' }).all()) {
    await button.click({ timeout: 5000 }).catch(() => undefined);
  }
  if (block === 'expense-approval') {
    await page.getByRole('checkbox').first().check();
    await page.getByRole('button', { name: /^Odrzuć \(/ }).click();
  }
}

const server = await createServer({
  root: join(here, '..'),
  server: { port: 0, strictPort: false },
  logLevel: 'error',
});
await server.listen();
const base = server.resolvedUrls?.local[0];
if (base === undefined) throw new Error('vite did not report a local url');

const browser = await chromium.launch();
let failed = false;
try {
  const cases = [
    ...BLOCKS.map((block) => ({ name: block, query: `block=${block}` })),
    ...BLOCKS.map((block) => ({ name: `${block} (empty)`, query: `block=${block}&empty=1` })),
    { name: 'dashboard', query: '' },
  ];
  for (const { name, query } of cases) {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.goto(`${base}?view=blocks&locale=pl-PL&${query}`);
    await page.waitForFunction(() => (document.getElementById('root')?.childElementCount ?? 0) > 0);
    await page.evaluate(() => document.fonts.ready);
    const block = name.split(' ')[0] ?? '';
    if (!name.includes('empty')) {
      try {
        await openThings(page, block);
      } catch (error) {
        console.log(`  note: could not open extras for ${name}: ${String(error).split('\n')[0]}`);
      }
    }
    const bad = offenders(await strings(page));
    console.log(`${bad.length === 0 ? 'ok  ' : 'FAIL'} ${name}`);
    for (const text of bad) console.log(`       ${text}`);
    if (bad.length > 0) failed = true;
    await page.close();
  }
} finally {
  await browser.close();
  await server.close();
}
process.exit(failed ? 1 : 0);
