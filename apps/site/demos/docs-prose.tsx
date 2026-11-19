'use client';

import { Callout, DocsHeading, DocsProse, FileTree, Step, Steps } from '@rectio/blocks/docs';

export default function DocsProseDemo() {
  return (
    <DocsProse className="w-full">
      <DocsHeading level={2}>Define a job</DocsHeading>
      <p>
        A job is a typed function. Register it once and enqueue it from anywhere with a payload the
        compiler checks.
      </p>
      <Callout type="tip" title="Keep payloads small">
        Store ids, not records. The worker loads the rest when the job runs.
      </Callout>
      <Steps>
        <Step title="Install the package">
          <p>
            Add <code>@halyard/core</code> to your project.
          </p>
        </Step>
        <Step title="Create the queue">
          <p>
            Run <code>halyard init</code> to write the config.
          </p>
        </Step>
      </Steps>
      <FileTree
        entries={[
          {
            name: 'jobs',
            children: [
              { name: 'send-email.ts', highlight: true, note: 'new' },
              { name: 'index.ts' },
            ],
          },
          { name: 'halyard.config.ts' },
        ]}
      />
    </DocsProse>
  );
}
