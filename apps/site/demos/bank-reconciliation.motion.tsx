'use client';

import { reconciliationReducer } from '@rectio/blocks';
import { BankReconciliation } from '@rectio/blocks/motion';
import { useReducer } from 'react';

import { BOOK, BOOK_BALANCE, MATCHES, STATEMENT, STATEMENT_BALANCE } from './operations-data';

export default function BankReconciliationMotionDemo() {
  const [matches, dispatch] = useReducer(reconciliationReducer, MATCHES);
  return (
    <div className="w-full">
      <BankReconciliation
        statement={STATEMENT}
        book={BOOK}
        matches={matches}
        statementBalance={STATEMENT_BALANCE}
        bookBalance={BOOK_BALANCE}
        account="Business current •• 4821"
        period="March 2026"
        currency="EUR"
        locale="en-GB"
        onMatch={(bankId, bookId) => {
          dispatch({ type: 'match', bankId, bookId });
        }}
        onUnmatch={(bankId) => {
          dispatch({ type: 'unmatch', bankId });
        }}
        onReconcile={() => undefined}
        onCreateEntry={() => undefined}
      />
    </div>
  );
}
