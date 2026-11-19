import { ServerCodeBlock } from 'fumadocs-ui/components/codeblock.rsc';
import type { ReactNode } from 'react';

import { PreviewShell } from './preview-shell';
import { readDemo } from './source';

/**
 * A live preview for a docs page: `<Preview name="button" plain={<ButtonDemo />} />`. The Code tab
 * shows `demos/<name>.tsx`, the file the preview renders. With `motion`, a Plain and Motion switch
 * shows the motion add-on's variant live; its code stays locked because the add-on is Pro.
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
  return (
    <PreviewShell
      plain={plain}
      motion={motion}
      importLine={importLine}
      align={align}
      code={
        <ServerCodeBlock
          code={code.trimEnd()}
          lang="tsx"
          codeblock={{ className: 'my-0 rounded-none border-0' }}
        />
      }
    />
  );
}
