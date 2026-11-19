'use client';

import { Pagination } from '@rectio/ui';
import { useState } from 'react';

const PAGE_SIZE = 10;
const TOTAL = 238;

export default function PaginationDemo() {
  const [page, setPage] = useState(4);
  const first = (page - 1) * PAGE_SIZE + 1;
  const last = Math.min(page * PAGE_SIZE, TOTAL);

  return (
    <div className="flex flex-col items-center gap-3">
      <Pagination
        page={page}
        pageCount={Math.ceil(TOTAL / PAGE_SIZE)}
        onPageChange={setPage}
        label="Invoices"
      />
      <p className="text-sm text-fg-muted numeric" aria-live="polite">
        Invoices {first} to {last} of {TOTAL}
      </p>
    </div>
  );
}
