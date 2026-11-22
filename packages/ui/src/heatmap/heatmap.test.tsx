import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { Heatmap } from './heatmap';
import { heatStep, heatValue } from './heatmap.logic';

const rows = [
  { id: 'jan', label: 'Jan cohort' },
  { id: 'feb', label: 'Feb cohort' },
];
const columns = [
  { id: 'm0', label: 'Month 0' },
  { id: 'm1', label: 'Month 1' },
  { id: 'm2', label: 'Month 2' },
];
const data = [
  { row: 'jan', column: 'm0', value: 1 },
  { row: 'jan', column: 'm1', value: 0.42 },
  { row: 'jan', column: 'm2', value: 0 },
  { row: 'feb', column: 'm0', value: 1 },
  { row: 'feb', column: 'm1', value: null },
];

describe('heatStep', () => {
  it('puts zero apart and the top figure on the last step', () => {
    expect(heatStep(0, 10, 5)).toBe(0);
    expect(heatStep(0.1, 10, 5)).toBe(1);
    expect(heatStep(10, 10, 5)).toBe(5);
    expect(heatStep(20, 10, 5)).toBe(5);
  });

  it('reads a figure below zero or not a number as missing, not zero', () => {
    expect(heatStep(-3, 10, 5)).toBeNull();
    expect(heatStep(Number.NaN, 10, 5)).toBeNull();
    expect(heatValue(-0.5)).toBeNull();
    expect(heatValue(undefined)).toBeNull();
    expect(heatValue(0)).toBe(0);
  });

  it('puts every figure above zero on the last step when the max is not above zero', () => {
    expect(heatStep(3, Number.NaN, 4)).toBe(4);
    expect(heatStep(3, 0, 4)).toBe(4);
  });
});

describe('Heatmap', () => {
  it('reads every cell by name and figure, with missing and zero apart', () => {
    render(
      <Heatmap
        rows={rows}
        columns={columns}
        data={data}
        format="percent"
        locale="en-GB"
        label="Retention"
      />,
    );
    const grid = screen.getByRole('grid', { name: 'Retention' });
    const cells = within(grid).getAllByRole('gridcell');
    // Two rows of three columns; Feb has no Month 2 cell at all.
    expect(cells).toHaveLength(6);
    expect(cells[2]).toHaveTextContent('Jan cohort, Month 2: 0%');
    expect(cells[4]).toHaveTextContent('Feb cohort, Month 1: No data');
    expect(cells[5]).toBeEmptyDOMElement();
  });

  it('moves through the grid with the arrow keys, skipping empty cells', () => {
    render(<Heatmap rows={rows} columns={columns} data={data} locale="en-GB" />);
    const grid = screen.getByRole('grid');
    const cells = within(grid).getAllByRole('gridcell');
    expect(cells[0]).toHaveAttribute('tabindex', '0');
    cells[0]?.focus();
    fireEvent.keyDown(grid, { key: 'ArrowRight' });
    expect(document.activeElement).toBe(cells[1]);
    fireEvent.keyDown(grid, { key: 'ArrowDown' });
    expect(document.activeElement).toBe(cells[4]);
    fireEvent.keyDown(grid, { key: 'End' });
    expect(document.activeElement).toBe(cells[4]);
  });

  it('lays a calendar out in weeks and counts days with no entry as missing', () => {
    const days = [
      { date: new Date(2026, 2, 2), value: 4 },
      { date: new Date(2026, 2, 4), value: 0 },
      { date: new Date(2026, 2, 10), value: 9 },
    ];
    render(<Heatmap variant="calendar" data={days} locale="en-GB" label="Commits" />);
    const grid = screen.getByRole('grid', { name: 'Commits' });
    expect(within(grid).getByText(/Tue, 3 Mar 2026: No data/)).toBeInTheDocument();
    expect(within(grid).getByText(/Wed, 4 Mar 2026: 0/)).toBeInTheDocument();
    const table = screen.getByRole('table', { name: 'Every cell of the heatmap' });
    expect(
      within(table)
        .getAllByRole('rowheader')
        .map((h) => h.textContent),
    ).toEqual(['Week of 2 Mar', 'Week of 9 Mar']);
    expect(screen.getByText(/Highest: Tue, 10 Mar 2026 at 9\./)).toBeInTheDocument();
  });

  it('draws a negative figure as missing, apart from zero', () => {
    render(
      <Heatmap
        rows={rows}
        columns={columns}
        data={[{ row: 'jan', column: 'm0', value: -4 }]}
        locale="en-GB"
      />,
    );
    expect(
      within(screen.getByRole('grid')).getByText(/Jan cohort, Month 0: No data/),
    ).toBeInTheDocument();
  });

  it('falls back to the largest figure when max is not a number', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    render(<Heatmap rows={rows} columns={columns} data={data} max={Number.NaN} locale="en-GB" />);
    expect(screen.getAllByText(/even steps from zero up to 1\./).length).toBeGreaterThan(0);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('max'));
    warn.mockRestore();
  });

  it('keeps a calendar to its latest weeks when a stray date lies years back', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    render(
      <Heatmap
        variant="calendar"
        data={[
          { date: new Date(2001, 0, 1), value: 1 },
          { date: new Date(2026, 2, 2), value: 4 },
          { date: new Date(2026, 2, 10), value: 9 },
        ]}
        locale="en-GB"
      />,
    );
    const grid = screen.getByRole('grid');
    expect(grid).toHaveAttribute('aria-colcount', '3');
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('earlier days are left out'));
    warn.mockRestore();
  });
});
