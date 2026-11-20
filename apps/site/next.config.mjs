import { createMDX } from 'fumadocs-mdx/next';
import { PHASE_DEVELOPMENT_SERVER } from 'next/constants.js';

import { BASE_PATH } from './lib/base-path.ts';

const withMDX = createMDX();

/** @type {import('next').NextConfig} */
const config = {
  // Static files only: the site is served from a CDN, the docs search index is prebuilt.
  output: 'export',
  // Empty locally; `/rectio` for GitHub Pages (SITE_BASE_PATH, read in lib/base-path.ts).
  basePath: BASE_PATH,
  // Inlined into client code, so lib/base-path.ts reads the same value in the browser.
  env: { SITE_BASE_PATH: BASE_PATH },
  reactStrictMode: true,
  // No generated AGENTS.md from next dev: project facts live in the repo docs.
  agentRules: false,
  // The rectio packages export their TypeScript source.
  transpilePackages: ['@rectio/ui', '@rectio/motion', '@rectio/blocks'],
};

/**
 * The live template previews are static builds, not routes: the build copies them into out/preview,
 * and in development scripts/dev.ts serves them and passes its address here, so next dev proxies
 * /preview/* to it (under the site base path, which Next adds to each source). Paths keep their trailing slash, as a CDN keeps them for the templates that
 * export `pricing/index.html`. A plain `next dev` (or `next build`) has no address and no rewrite.
 */
function previewProxy(phase) {
  const origin = process.env.RECTIO_PREVIEW_ORIGIN;
  if (phase !== PHASE_DEVELOPMENT_SERVER || origin === undefined) return {};
  return {
    skipTrailingSlashRedirect: true,
    rewrites: async () => ({
      beforeFiles: [
        { source: '/preview/:path*/', destination: `${origin}${BASE_PATH}/preview/:path*/` },
        { source: '/preview/:path*', destination: `${origin}${BASE_PATH}/preview/:path*` },
      ],
    }),
  };
}

export default (phase) => withMDX({ ...config, ...previewProxy(phase) });
