import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';

import type { RegistryConfig, SourceItemConfig } from '../src/build/config.ts';

/** Writes files into a fresh temp dir and returns its path plus a cleanup. */
export function tempTree(files: Record<string, string>): { dir: string; cleanup: () => void } {
  const dir = mkdtempSync(join(tmpdir(), 'rectio-registry-'));
  for (const [path, content] of Object.entries(files)) {
    const file = join(dir, path);
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, content);
  }
  return {
    dir,
    cleanup: () => {
      rmSync(dir, { recursive: true, force: true });
    },
  };
}

export const FIXTURE_SOURCES: Record<string, string> = {
  'package.json': JSON.stringify({
    dependencies: { clsx: '^2.1.1', '@base-ui/react': '^1.9.0', motion: '^14.0.0' },
    peerDependencies: { react: '^19.0.0' },
  }),
  'src/lib/cn.ts': "import { clsx } from 'clsx';\nexport const cn = clsx;\n",
  'src/badge/badge.tsx':
    "import type { ReactNode } from 'react';\r\n\r\nimport { cn } from '../lib/cn';\r\n\r\nexport function Badge({ children }: { children: ReactNode }) {\r\n  return <span className={cn('rounded-badge')}>{children}</span>;\r\n}\r\n",
  'src/toggle/toggle.tsx':
    "import { Toggle as Base } from '@base-ui/react/toggle';\nimport { cn } from '../lib/cn';\nexport const Toggle = () => <Base className={cn('x')} />;\n",
  'src/ledger-card/ledger-card.tsx':
    "import { useState } from 'react';\nimport { m } from 'motion/react';\nimport { Badge } from '../badge/badge';\nexport function LedgerCard() {\n  const [open] = useState(false);\n  return <m.div>{open ? <Badge>open</Badge> : null}</m.div>;\n}\n",
};

const item = (overrides: Partial<SourceItemConfig> & Pick<SourceItemConfig, 'name' | 'files'>) =>
  ({
    type: 'component',
    version: '1.0.0',
    title: overrides.name,
    description: `The ${overrides.name}.`,
    ...overrides,
  }) satisfies SourceItemConfig;

export function fixtureConfig(dir: string, items?: SourceItemConfig[]): RegistryConfig {
  return {
    name: 'fixture',
    sourceDir: join(dir, 'src'),
    packageJsons: [join(dir, 'package.json')],
    requireEveryFolder: true,
    items: items ?? [
      item({ name: 'cn', type: 'lib', files: ['lib/cn.ts'] }),
      item({ name: 'badge', files: ['badge/badge.tsx'] }),
      item({ name: 'toggle', files: ['toggle/toggle.tsx'] }),
      item({
        name: 'ledger-card',
        type: 'block',
        version: '2.1.0',
        files: ['ledger-card/ledger-card.tsx'],
      }),
    ],
  };
}

export { item as fixtureItem };
