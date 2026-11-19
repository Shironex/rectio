import * as motion from '@rectio/motion';
import type { TableCellProps } from '@rectio/motion';
import * as ui from '@rectio/ui';
import { createContext, use, type ComponentProps, type ReactNode } from 'react';

/**
 * The playground shows one composition twice, plain and motioned, so it swaps components through
 * this context. An app does not need it: it picks per component by import path
 * (`@rectio/ui` or `@rectio/motion`), which the type below proves interchangeable.
 */
export interface Kit {
  Button: typeof ui.Button;
  AmountInput: typeof ui.AmountInput;
  Money: typeof ui.Money;
  Dialog: typeof ui.Dialog;
  DialogTrigger: typeof ui.DialogTrigger;
  DialogContent: typeof ui.DialogContent;
  SelectContent: typeof ui.SelectContent;
  SelectItem: typeof ui.SelectItem;
  TableRows: (props: { children?: ReactNode }) => ReactNode;
  TableRow: (props: ComponentProps<'tr'>) => ReactNode;
  TableCell: (props: TableCellProps) => ReactNode;
}

/** Plain table parts with the motion parts' markup, so both kits render the same table. */
function PlainTableCell({ contentClassName, children, ...props }: TableCellProps) {
  return (
    <td {...props}>
      <div className={contentClassName}>{children}</div>
    </td>
  );
}

export const PLAIN_KIT: Kit = {
  Button: ui.Button,
  AmountInput: ui.AmountInput,
  Money: ui.Money,
  Dialog: ui.Dialog,
  DialogTrigger: ui.DialogTrigger,
  DialogContent: ui.DialogContent,
  SelectContent: ui.SelectContent,
  SelectItem: ui.SelectItem,
  TableRows: ({ children }) => children,
  TableRow: (props) => <tr {...props} />,
  TableCell: PlainTableCell,
};

export const MOTION_KIT: Kit = {
  Button: motion.Button,
  AmountInput: motion.AmountInput,
  Money: motion.Money,
  Dialog: motion.Dialog,
  DialogTrigger: motion.DialogTrigger,
  DialogContent: motion.DialogContent,
  SelectContent: motion.SelectContent,
  SelectItem: motion.SelectItem,
  TableRows: motion.TableRows,
  TableRow: motion.TableRow,
  TableCell: motion.TableCell,
};

const KitContext = createContext<Kit>(PLAIN_KIT);

export function KitProvider({ motion: on, children }: { motion: boolean; children: ReactNode }) {
  return <KitContext value={on ? MOTION_KIT : PLAIN_KIT}>{children}</KitContext>;
}

export function useKit(): Kit {
  return use(KitContext);
}
