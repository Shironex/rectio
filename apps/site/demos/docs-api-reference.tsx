'use client';

import { Endpoint, PropsTable, SignatureCard } from '@rectio/blocks/docs';

export default function DocsApiReferenceDemo() {
  return (
    <div className="flex w-full flex-col gap-8">
      <PropsTable
        label="createQueue options"
        rows={[
          { name: 'name', type: 'string', required: true, description: 'The queue name.' },
          { name: 'concurrency', type: 'number', default: '4', description: 'Jobs at once.' },
          { name: 'retries', type: 'number', default: '3', description: 'Attempts per job.' },
        ]}
      />
      <SignatureCard
        name="queue.add"
        kind="method"
        signature="queue.add(name, payload, options?)"
        description="Adds a job to the queue."
        since="1.0"
        params={[
          { name: 'name', type: 'string', description: 'A registered job name.' },
          { name: 'payload', type: 'Payload', description: 'Checked against the job.' },
        ]}
        returns={{ type: 'Promise<Job>', description: 'The stored job.' }}
      />
      <Endpoint
        method="POST"
        path="/v1/queues/:queue/jobs"
        title="Enqueue a job"
        auth="API key with the jobs:write scope"
        pathParams={[{ name: 'queue', type: 'string', required: true }]}
        responses={[{ status: 201, description: 'Created', example: '{ "id": "job_1" }' }]}
      />
    </div>
  );
}
