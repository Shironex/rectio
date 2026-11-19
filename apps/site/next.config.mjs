import { createMDX } from 'fumadocs-mdx/next';

const withMDX = createMDX();

/** @type {import('next').NextConfig} */
const config = {
  // Static files only: the site is served from a CDN, the docs search index is prebuilt.
  output: 'export',
  reactStrictMode: true,
  // The rectio packages export their TypeScript source.
  transpilePackages: ['@rectio/ui', '@rectio/motion'],
};

export default withMDX(config);
