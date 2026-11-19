import { Accordion, Accordions } from 'fumadocs-ui/components/accordion';
import { ServerCodeBlock } from 'fumadocs-ui/components/codeblock.rsc';

import { readFreeSource } from './source';

/** The full source of a free component, folded away at the end of its page. */
export async function ComponentSource({ path }: { path: string }) {
  const code = await readFreeSource(path);
  const file = path.split('/').at(-1) ?? path;
  return (
    <Accordions>
      <Accordion title={`Source: ${file}`}>
        <ServerCodeBlock code={code.trimEnd()} lang="tsx" codeblock={{ title: file }} />
      </Accordion>
    </Accordions>
  );
}
