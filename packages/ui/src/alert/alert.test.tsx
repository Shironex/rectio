import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { Alert } from './alert';

describe('Alert', () => {
  it('shows a title, text and actions, and is silent unless asked to announce', () => {
    render(
      <Alert
        tone="warning"
        title="Bank feed paused"
        actions={<button type="button">Reconnect</button>}
      >
        Transactions after 12 March are not imported.
      </Alert>,
    );
    expect(screen.getByText('Bank feed paused')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reconnect' })).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('announces assertively or politely when live', () => {
    render(<Alert live="assertive" tone="danger" title="Payment failed" />);
    expect(screen.getByRole('alert')).toHaveTextContent('Payment failed');
    render(<Alert live="polite" tone="success" title="Import done" />);
    expect(screen.getByRole('status')).toHaveTextContent('Import done');
  });

  it('goes away from its dismiss button and reports it', async () => {
    const onDismiss = vi.fn();
    render(<Alert dismissible onDismiss={onDismiss} title="New export format" />);
    await userEvent.click(screen.getByRole('button', { name: 'Dismiss' }));
    expect(onDismiss).toHaveBeenCalledOnce();
    expect(screen.queryByText('New export format')).not.toBeInTheDocument();
  });

  it('stays while controlled open', async () => {
    render(<Alert dismissible open title="Kept" />);
    await userEvent.click(screen.getByRole('button', { name: 'Dismiss' }));
    expect(screen.getByText('Kept')).toBeInTheDocument();
  });
});
