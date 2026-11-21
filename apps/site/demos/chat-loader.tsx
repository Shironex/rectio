'use client';

import { ChatLoader } from '@rectio/ui';

/** Typing dots before the first words; the skeleton of a reply while history loads. */
export default function ChatLoaderDemo() {
  return (
    <div className="flex w-full max-w-xl flex-col gap-6">
      <ChatLoader />
      <ChatLoader variant="skeleton" />
    </div>
  );
}
