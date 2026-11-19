'use client';

import {
  approvalReducer,
  type ApprovalCommand,
  type ApprovalState,
  type ExpenseRequest,
} from '@rectio/blocks';
import {
  createContext,
  use,
  useCallback,
  useMemo,
  useReducer,
  useState,
  type ReactNode,
} from 'react';

import { CURRENT_USER } from '@/data/company';
import { EXPENSES } from '@/data/expenses';
import { NewInvoiceDialog } from '../invoices/new-invoice-dialog';
import { SubmitExpenseSheet, type ExpenseDraft } from '../expenses/submit-expense-sheet';

type Action = ApprovalCommand | { type: 'submit'; request: ExpenseRequest; at: Date };

function reducer(state: ApprovalState, action: Action): ApprovalState {
  if (action.type !== 'submit') return approvalReducer(state, action);
  return {
    requests: [action.request, ...state.requests],
    events: [
      ...state.events,
      {
        id: `ev-s-${action.request.id}`,
        requestId: action.request.id,
        action: 'submitted',
        actor: action.request.employee,
        at: action.at,
      },
    ],
  };
}

interface AppData {
  expenses: ApprovalState;
  approve: (ids: string[]) => void;
  reject: (ids: string[], reason: string) => void;
  reopen: (id: string) => void;
  openNewInvoice: () => void;
  openSubmitExpense: () => void;
}

const AppDataContext = createContext<AppData | null>(null);

/** The app's shared state and the dialogs any page or the command menu can open. */
export function useAppData(): AppData {
  const value = use(AppDataContext);
  if (value === null) throw new Error('useAppData must be used inside AppDataProvider');
  return value;
}

/**
 * Holds what changes while the app is open: the expense queue, and whether the new invoice dialog
 * or the submit expense sheet is open. Swap the reducer for your API calls; the pages only see the
 * callbacks.
 */
export function AppDataProvider({ children }: { children: ReactNode }) {
  const [expenses, dispatch] = useReducer(reducer, EXPENSES);
  const [invoiceOpen, setInvoiceOpen] = useState(false);
  const [expenseOpen, setExpenseOpen] = useState(false);

  const submitExpense = useCallback((draft: ExpenseDraft) => {
    const now = new Date();
    dispatch({
      type: 'submit',
      at: now,
      request: {
        id: `x-${String(now.getTime())}`,
        employee: CURRENT_USER.name,
        merchant: draft.merchant,
        category: draft.category,
        date: draft.date,
        amount: draft.amount,
        status: 'pending',
        ...(draft.hasReceipt ? {} : { flags: ['No receipt'] }),
      },
    });
  }, []);

  const value = useMemo<AppData>(
    () => ({
      expenses,
      approve: (ids) => {
        dispatch({ type: 'approve', ids, actor: CURRENT_USER.name, at: new Date() });
      },
      reject: (ids, reason) => {
        dispatch({ type: 'reject', ids, reason, actor: CURRENT_USER.name, at: new Date() });
      },
      reopen: (id) => {
        dispatch({ type: 'reopen', id, actor: CURRENT_USER.name, at: new Date() });
      },
      openNewInvoice: () => {
        setInvoiceOpen(true);
      },
      openSubmitExpense: () => {
        setExpenseOpen(true);
      },
    }),
    [expenses],
  );

  return (
    <AppDataContext value={value}>
      {children}
      <NewInvoiceDialog open={invoiceOpen} onOpenChange={setInvoiceOpen} />
      <SubmitExpenseSheet
        open={expenseOpen}
        onOpenChange={setExpenseOpen}
        onSubmit={submitExpense}
      />
    </AppDataContext>
  );
}
