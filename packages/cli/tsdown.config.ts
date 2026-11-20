import { defineConfig } from 'tsdown';

// One file, dist/bin.js. @rectio/registry is a private workspace package, linked from source, so
// its code is inlined. Everything the published package lists in `dependencies` stays an import.
// onlyBundle (nothing from node_modules) and onlyImport fail the build if anything else slips in,
// such as typescript from the registry's build code.
export default defineConfig({
  entry: ['src/bin.ts'],
  format: 'esm',
  platform: 'node',
  target: 'node22.12',
  fixedExtension: false,
  dts: false,
  clean: true,
  deps: {
    onlyBundle: [],
    onlyImport: ['@modelcontextprotocol/sdk', 'diff', 'zod'],
  },
});
