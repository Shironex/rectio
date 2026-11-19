import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { Pagination, paginationRange } from './pagination-bar';

describe('paginationRange', () => {
  it('lists every page when they fit', () => {
    expect(paginationRange(2, 5)).toEqual([1, 2, 3, 4, 5]);
  });

  it('keeps the same length as the page moves', () => {
    expect(paginationRange(1, 20)).toEqual([1, 2, 3, 4, 5, 'gap-end', 20]);
    expect(paginationRange(10, 20)).toEqual([1, 'gap-start', 9, 10, 11, 'gap-end', 20]);
    expect(paginationRange(20, 20)).toEqual([1, 'gap-start', 16, 17, 18, 19, 20]);
    for (let page = 1; page <= 20; page += 1) expect(paginationRange(page, 20)).toHaveLength(7);
  });

  it('never hides a single page behind a gap', () => {
    expect(paginationRange(4, 20)).toEqual([1, 2, 3, 4, 5, 'gap-end', 20]);
  });

  it('clamps an out of range page', () => {
    expect(paginationRange(99, 3)).toEqual([1, 2, 3]);
  });
});

describe('Pagination', () => {
  it('marks the current page and moves with previous, next and page buttons', async () => {
    const onPageChange = vi.fn();
    render(<Pagination page={3} pageCount={12} onPageChange={onPageChange} variant="full" />);
    const nav = screen.getByRole('navigation', { name: 'Pagination' });
    expect(within(nav).getByRole('button', { name: 'Page 3' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(within(nav).getByRole('status')).toHaveTextContent(/3\D+12/);
    await userEvent.click(within(nav).getByRole('button', { name: 'Next' }));
    expect(onPageChange).toHaveBeenLastCalledWith(4);
    await userEvent.click(within(nav).getByRole('button', { name: 'Page 12' }));
    expect(onPageChange).toHaveBeenLastCalledWith(12);
  });

  it('keeps previous in place but unavailable on the first page', async () => {
    const onPageChange = vi.fn();
    render(<Pagination page={1} pageCount={4} onPageChange={onPageChange} variant="full" />);
    const previous = screen.getByRole('button', { name: 'Previous' });
    expect(previous).toHaveAttribute('aria-disabled', 'true');
    await userEvent.click(previous);
    expect(onPageChange).not.toHaveBeenCalled();
  });

  it('renders links when given hrefs', () => {
    render(
      <Pagination page={2} pageCount={4} getHref={(p) => `?page=${String(p)}`} variant="full" />,
    );
    expect(screen.getByRole('link', { name: 'Page 4' })).toHaveAttribute('href', '?page=4');
  });

  it('shows the page in words in the compact variant', () => {
    render(<Pagination page={3} pageCount={12} variant="compact" />);
    expect(screen.getByText('Page 3 of 12')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Page 4' })).not.toBeInTheDocument();
  });
});
