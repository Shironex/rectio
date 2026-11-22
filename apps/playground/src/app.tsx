import { Suspense, lazy } from 'react';

import { readSkin, readView } from './themes';

// Each view loads on its own, so the expense report never downloads the whole matrix.
const ExpenseReport = lazy(() =>
  import('./expenses/expense-report').then((m) => ({ default: m.ExpenseReport })),
);
const Matrix = lazy(() => import('./gallery/matrix').then((m) => ({ default: m.Matrix })));
const BlocksPage = lazy(() =>
  import('./blocks/blocks-page').then((m) => ({ default: m.BlocksPage })),
);
const DisplayPage = lazy(() =>
  import('./display/display-page').then((m) => ({ default: m.DisplayPage })),
);
const MarketingPage = lazy(() =>
  import('./marketing/marketing-page').then((m) => ({ default: m.MarketingPage })),
);
const DocsPage = lazy(() => import('./docs/docs-page').then((m) => ({ default: m.DocsPage })));
const FormsPage = lazy(() => import('./forms/forms-page').then((m) => ({ default: m.FormsPage })));
const ShellPage = lazy(() => import('./shell/shell-page').then((m) => ({ default: m.ShellPage })));
const NavPage = lazy(() => import('./shell/nav-page').then((m) => ({ default: m.NavPage })));
const PrimitivesPage = lazy(() =>
  import('./primitives/primitives-page').then((m) => ({ default: m.PrimitivesPage })),
);
const GapsPage = lazy(() => import('./gaps/gaps-page').then((m) => ({ default: m.GapsPage })));
const ChartsPage = lazy(() =>
  import('./charts/charts-page').then((m) => ({ default: m.ChartsPage })),
);
const SchedulingPage = lazy(() =>
  import('./scheduling/scheduling-page').then((m) => ({ default: m.SchedulingPage })),
);
const ChatPage = lazy(() => import('./chat/chat-page').then((m) => ({ default: m.ChatPage })));
const AiBlocksPage = lazy(() =>
  import('./ai-blocks/ai-blocks-page').then((m) => ({ default: m.AiBlocksPage })),
);
const VizPage = lazy(() => import('./viz/viz-page').then((m) => ({ default: m.VizPage })));
const MotionPage = lazy(() =>
  import('./motion/motion-page').then((m) => ({ default: m.MotionPage })),
);

// Views without a ThemeScope skin prop take the skin from <html>, as an app would set it.
const skin = readSkin(window.location.search);
if (skin !== undefined) document.documentElement.dataset.skin = skin;

export function App() {
  const { theme, mode, view, motion } = readView(window.location.search);
  return (
    <Suspense>
      {view === 'app' ? (
        <ExpenseReport theme={theme} mode={mode} motion={motion} />
      ) : view === 'blocks' ? (
        <BlocksPage theme={theme} mode={mode} motion={motion} />
      ) : view === 'display' ? (
        <DisplayPage theme={theme} mode={mode} motion={motion} />
      ) : view === 'marketing' ? (
        <MarketingPage theme={theme} mode={mode} motion={motion} />
      ) : view === 'docs' ? (
        <DocsPage theme={theme} mode={mode} motion={motion} />
      ) : view === 'forms' ? (
        <FormsPage theme={theme} mode={mode} motion={motion} />
      ) : view === 'shell' ? (
        <ShellPage theme={theme} mode={mode} motion={motion} />
      ) : view === 'nav' ? (
        <NavPage theme={theme} mode={mode} motion={motion} />
      ) : view === 'gaps' ? (
        <GapsPage theme={theme} mode={mode} motion={motion} />
      ) : view === 'primitives' ? (
        <PrimitivesPage theme={theme} mode={mode} motion={motion} />
      ) : view === 'charts' ? (
        <ChartsPage theme={theme} mode={mode} motion={motion} />
      ) : view === 'scheduling' ? (
        <SchedulingPage theme={theme} mode={mode} motion={motion} />
      ) : view === 'chat' ? (
        <ChatPage theme={theme} mode={mode} motion={motion} />
      ) : view === 'ai-blocks' ? (
        <AiBlocksPage theme={theme} mode={mode} motion={motion} />
      ) : view === 'viz' ? (
        <VizPage theme={theme} mode={mode} motion={motion} />
      ) : view === 'motion' ? (
        <MotionPage theme={theme} mode={mode} />
      ) : (
        <Matrix />
      )}
    </Suspense>
  );
}
