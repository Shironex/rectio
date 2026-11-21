import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { ToolCall, formatToolValue } from './tool-call';

describe('ToolCall', () => {
  it('says its status in words and folds its arguments and result', async () => {
    render(
      <ToolCall
        name="search_invoices"
        title="Searched unpaid invoices"
        status="done"
        duration="1.2 s"
        args={{ status: 'unpaid' }}
        result={{ count: 3 }}
      />,
    );
    const trigger = screen.getByRole('button', { name: /Searched unpaid invoices/ });
    expect(trigger).toHaveTextContent('Done, 1.2 s');
    await userEvent.click(trigger);
    expect(screen.getByRole('heading', { name: 'Input' })).toBeInTheDocument();
    expect(screen.getByText(/"status": "unpaid"/)).toBeInTheDocument();
    expect(screen.getByText(/"count": 3/)).toBeInTheDocument();
  });

  it('shows no output while running and the error when failed', async () => {
    const { rerender } = render(
      <ToolCall
        name="fx_rate"
        status="running"
        args={{ pair: 'EURUSD' }}
        result={{ rate: 1 }}
        defaultOpen
      />,
    );
    expect(screen.getByRole('button', { name: /fx_rate/ })).toHaveTextContent('Running');
    expect(screen.queryByRole('heading', { name: 'Output' })).not.toBeInTheDocument();
    rerender(
      <ToolCall name="fx_rate" status="failed" error="The rate service timed out." defaultOpen />,
    );
    await userEvent.click(screen.getByRole('button', { name: /fx_rate/ }));
    expect(screen.getAllByText(/Failed|timed out/).length).toBeGreaterThan(0);
  });

  it('renders a React element result as it is', () => {
    render(
      <ToolCall name="table" status="done" result={<table aria-label="Invoices" />} defaultOpen />,
    );
    expect(screen.getByRole('table', { name: 'Invoices' })).toBeInTheDocument();
  });

  it('formats values as JSON, strings as they are', () => {
    expect(formatToolValue('plain')).toBe('plain');
    expect(formatToolValue({ a: 1 })).toBe('{\n  "a": 1\n}');
    const circular: Record<string, unknown> = {};
    circular.self = circular;
    expect(formatToolValue(circular)).toBe('[object Object]');
  });
});
