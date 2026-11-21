'use client';

import { Sessions } from '@rectio/blocks/motion';

import { useSessionsDemo } from './sessions';

export default function SessionsMotionDemo() {
  const props = useSessionsDemo();
  return (
    <div className="w-full">
      <Sessions {...props} />
    </div>
  );
}
