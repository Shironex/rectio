import { Suspense, lazy, useLayoutEffect } from 'react';

import { readView } from './themes';

// Each view loads on its own, so the expense report never downloads the whole matrix.
const ExpenseReport = lazy(() =>
  import('./expenses/expense-report').then((m) => ({ default: m.ExpenseReport })),
);
const Matrix = lazy(() => import('./gallery/matrix').then((m) => ({ default: m.Matrix })));
const MotionPage = lazy(() =>
  import('./motion/motion-page').then((m) => ({ default: m.MotionPage })),
);

export function App() {
  const { theme, mode, view, motion } = readView(window.location.search);
  // A single-theme view paints the page behind it too, so an overscroll or a page taller than the
  // scope never shows a white band under a dark theme. The matrix shows several themes: no fill.
  useLayoutEffect(() => {
    if (view === 'matrix') return;
    const root = document.documentElement;
    root.dataset.theme = theme;
    root.dataset.mode = mode;
  }, [theme, mode, view]);
  return (
    <Suspense>
      {view === 'app' ? (
        <ExpenseReport theme={theme} mode={mode} motion={motion} />
      ) : view === 'motion' ? (
        <MotionPage theme={theme} mode={mode} />
      ) : (
        <Matrix />
      )}
    </Suspense>
  );
}
