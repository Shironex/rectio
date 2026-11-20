import type { NextConfig } from 'next';

/**
 * Serve the app under a sub-path, such as `/preview/saas-admin`, by building with `BASE_PATH` set.
 * Every link goes through next/link or the router, so nothing else changes.
 */
const basePath = process.env.BASE_PATH ?? '';

const config: NextConfig = {
  // Static files only: every page is prerendered, so the app runs from any static host.
  output: 'export',
  reactStrictMode: true,
  agentRules: false,
  ...(basePath === '' ? {} : { basePath }),
  transpilePackages: ['@rectio/ui', '@rectio/motion', '@rectio/blocks'], // rectio:workspace
};

export default config;
