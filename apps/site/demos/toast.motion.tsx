'use client';

import { ToastProvider } from '@rectio/motion';

import { ReportActions, UNDO_MS } from './toast';

export default function ToastMotionDemo() {
  return (
    <ToastProvider timeout={UNDO_MS}>
      <ReportActions />
    </ToastProvider>
  );
}
