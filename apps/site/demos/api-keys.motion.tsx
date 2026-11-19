'use client';

import { ApiKeys } from '@rectio/blocks/motion';

import { KEYS, NOW, SCOPES, useDemoKeys } from './api-keys';

export default function ApiKeysMotionDemo() {
  const store = useDemoKeys(KEYS);
  return (
    <div className="w-full">
      <ApiKeys {...store} scopes={SCOPES} docsHref="/docs" now={NOW} locale="en-GB" />
    </div>
  );
}
