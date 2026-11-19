import { Suspense, lazy } from 'react';

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
