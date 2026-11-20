import { ServerCodeBlock } from 'fumadocs-ui/components/codeblock.rsc';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import type { ReactNode } from 'react';

import { PreviewShell } from './preview-shell';
import { readDemo } from './source';

const block = (code: string) => (
  <ServerCodeBlock
    code={code.trimEnd()}
    lang="tsx"
    codeblock={{ className: 'my-0 rounded-none border-0' }}
  />
);

/**
 * A live preview for a docs page: `<Preview name="button" plain={<ButtonDemo />} />`. The Code tab
 * shows `demos/<name>.tsx`, the file the preview renders. With `motion`, a Plain and Motion switch
 * shows the motion add-on's variant live, and the Code tab follows it to `demos/<name>.motion.tsx`.
 */
export async function Preview({
  name,
  plain,
  motion,
  importLine,
  align,
}: {
  name: string;
  plain: ReactNode;
  motion?: ReactNode;
  importLine?: string;
  align?: 'center' | 'start';
}) {
  const code = await readDemo(name);
  const motionDemo = `${name}.motion`;
  const hasMotionCode =
    motion !== undefined && existsSync(join(process.cwd(), 'demos', `${motionDemo}.tsx`));
  return (
    <PreviewShell
      plain={plain}
      motion={motion}
      importLine={importLine}
      align={align}
      code={block(code)}
      motionCode={hasMotionCode ? block(await readDemo(motionDemo)) : undefined}
    />
  );
}
