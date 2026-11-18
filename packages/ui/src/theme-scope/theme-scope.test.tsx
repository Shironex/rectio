import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { Dialog, DialogContent, DialogTitle, DialogTrigger } from '../dialog/dialog';
import { ThemeScope } from './theme-scope';

describe('ThemeScope', () => {
  it('sets the theme attributes', () => {
    render(
      <ThemeScope theme="ledger" mode="dark" density="compact" data-testid="scope">
        x
      </ThemeScope>,
    );
    const scope = screen.getByTestId('scope');
    expect(scope).toHaveAttribute('data-theme', 'ledger');
    expect(scope).toHaveAttribute('data-mode', 'dark');
    expect(scope).toHaveAttribute('data-density', 'compact');
  });

  it('renders popups inside the scope so they inherit its tokens', async () => {
    render(
      <ThemeScope theme="ledger" data-testid="scope">
        <Dialog>
          <DialogTrigger>Open</DialogTrigger>
          <DialogContent>
            <DialogTitle>Inside</DialogTitle>
          </DialogContent>
        </Dialog>
      </ThemeScope>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Open' }));
    const dialog = await screen.findByRole('dialog');
    expect(screen.getByTestId('scope')).toContainElement(dialog);
  });
});
