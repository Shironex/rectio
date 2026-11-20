/**
 * The README and social preview images, captured from the built site (`pnpm --filter @rectio/site
 * build` first) with @noctcore/showcase-kit. One config per color scheme, both from this list:
 * `pnpm --filter @rectio/site showcase` runs them and writes assets/showcase/ at the repo root.
 * .github/social-preview.png is a copy of hero-dark.png, for the repository settings.
 */
const PORT = 4362;
const URL = `http://127.0.0.1:${String(PORT)}/`;

/** Every view the README shows, light and dark. */
const SHOTS = [
  { id: 'finance-app', title: 'Finance app template', nav: '/preview/finance-app/' },
  { id: 'saas-admin', title: 'SaaS admin template', nav: '/preview/saas-admin/' },
  {
    id: 'saas-landing',
    title: 'SaaS landing template',
    // The template opens with its cookie banner; the shot shows the page behind it.
    nav: async (page) => {
      await page.goto(`${URL}preview/saas-landing/`);
      await page.getByRole('button', { name: 'Reject all' }).click();
    },
  },
  { id: 'docs-template', title: 'Docs template', nav: '/preview/docs/' },
  { id: 'data-table', title: 'DataTable docs page', nav: '/docs/components/data-table' },
  { id: 'cash-flow', title: 'Cash flow block', nav: '/docs/blocks/cash-flow' },
];

/** @param {'light' | 'dark'} scheme */
export function rectioShowcase(scheme) {
  const dark = scheme === 'dark';
  return {
    name: 'rectio',
    root: '../../..',
    target: {
      mode: 'url',
      url: URL,
      start: 'node apps/site/scripts/serve.ts',
      env: { PORT: String(PORT) },
    },
    ready: 'body',
    viewport: { width: 1440, height: 900 },
    colorScheme: scheme,
    deviceScaleFactor: 1.5,
    shots: SHOTS,
    frame: {
      style: 'browser',
      theme: scheme,
      address: 'shironex.github.io/rectio',
      background: dark
        ? { type: 'gradient', from: '#14171f', to: '#1e3a8a', angle: 135 }
        : { type: 'gradient', from: '#f4f1ec', to: '#c7d2fe', angle: 135 },
      padding: 56,
      maxWidth: 1600,
      quality: 86,
    },
    outputs: {
      raw: `showcase-out/raw/${scheme}/{id}.png`,
      readme: `assets/showcase/${scheme}/{id}.webp`,
    },
    hero: {
      layout: 'stack',
      tagline:
        'Open source React components, blocks and templates for finance and back-office apps',
      shots: ['saas-landing', 'saas-admin', 'finance-app'],
      output: `assets/showcase/hero-${scheme}.png`,
      theme: scheme,
    },
  };
}
