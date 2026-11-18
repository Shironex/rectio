import { ExpenseReport } from './expenses/expense-report';
import { Matrix } from './gallery/matrix';
import { readView } from './themes';

export function App() {
  const { theme, mode, view } = readView(window.location.search);
  return view === 'app' ? <ExpenseReport theme={theme} mode={mode} /> : <Matrix />;
}
