'use client';

import { FileManager } from '@rectio/blocks/motion';

import { useFileManagerDemo } from './file-manager';

export default function FileManagerMotionDemo() {
  const props = useFileManagerDemo();
  return (
    <div className="w-full">
      <FileManager {...props} />
    </div>
  );
}
