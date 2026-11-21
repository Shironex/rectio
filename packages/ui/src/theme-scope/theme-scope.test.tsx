import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { Dialog, DialogContent, DialogTitle, DialogTrigger } from '../dialog/dialog';
import { ThemeScope } from './theme-scope';

describe('ThemeScope', () => {
  it('sets the theme attributes', () => {
    render(
      <ThemeScope theme="acme" mode="dark" density="compact" data-testid="scope">
        x
      </ThemeScope>,
    );
    const scope = screen.getByTestId('scope');
    expect(scope).toHaveAttribute('data-theme', 'acme');
    expect(scope).toHaveAttribute('data-mode', 'dark');
    expect(scope).toHaveAttribute('data-density', 'compact');
    expect(scope).not.toHaveAttribute('data-skin');
  });

  it('turns the skin around it off with none', () => {
    render(
      <ThemeScope skin="none" data-testid="scope">
        x
      </ThemeScope>,
    );
    const scope = screen.getByTestId('scope');
    expect(scope).toHaveAttribute('data-skin', 'none');
    expect(scope).toHaveAttribute('data-theme', 'default');
  });

  it('sets a skin beside the theme', () => {
    render(
      <ThemeScope skin="editorial" mode="light" data-testid="scope">
        x
      </ThemeScope>,
    );
    const scope = screen.getByTestId('scope');
    expect(scope).toHaveAttribute('data-skin', 'editorial');
    expect(scope).toHaveAttribute('data-theme', 'default');
  });

  it('renders popups inside the scope so they inherit its tokens', async () => {
    render(
      <ThemeScope mode="dark" data-testid="scope">
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
