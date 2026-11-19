'use client';

import { ExpenseApproval, approvalReducer } from '@rectio/blocks';
import { useReducer } from 'react';

import { EXPENSES } from './finance-data';

/** The block keeps no decisions itself: the app owns them, here with the exported reducer. */
export default function ExpenseApprovalDemo() {
  const [state, dispatch] = useReducer(approvalReducer, EXPENSES);
  const actor = 'Niamh Walsh';
  return (
    <div className="w-full">
      <ExpenseApproval
        requests={state.requests}
        events={state.events}
        currency="EUR"
        locale="en-GB"
        onApprove={(ids) => {
          dispatch({ type: 'approve', ids, actor, at: new Date() });
        }}
        onReject={(ids, reason) => {
          dispatch({ type: 'reject', ids, actor, at: new Date(), reason });
        }}
        onReopen={(id) => {
          dispatch({ type: 'reopen', id, actor, at: new Date() });
        }}
      />
    </div>
  );
}
