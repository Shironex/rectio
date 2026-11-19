/** @type {import('next').NextConfig} */
const config = {
  // Static files only: the site deploys to any CDN or static host.
  output: 'export',
  // Folders per page (`/pricing/index.html`), so any static host serves clean URLs.
  trailingSlash: true,
  reactStrictMode: true,
  // No generated AGENTS.md from next dev.
  agentRules: false,
  // The rectio packages ship their TypeScript source.
  transpilePackages: ['@rectio/ui', '@rectio/motion', '@rectio/blocks'], // rectio:workspace
};

export default config;
