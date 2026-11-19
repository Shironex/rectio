import type { NextConfig } from 'next';

const config: NextConfig = {
  // Static files only: every page is prerendered, so the app runs from any static host.
  output: 'export',
  reactStrictMode: true,
  agentRules: false,
  transpilePackages: ['@rectio/ui', '@rectio/motion', '@rectio/blocks'], // rectio:workspace
};

export default config;
