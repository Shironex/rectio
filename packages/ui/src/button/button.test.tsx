import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { Button } from './button';

describe('Button', () => {
  it('is a native button named by its label, and presses with Enter and Space', async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Save</Button>);
    const button = screen.getByRole('button', { name: 'Save' });
    expect(button).toHaveAttribute('type', 'button');
    button.focus();
    await userEvent.keyboard('{Enter}');
    await userEvent.keyboard(' ');
    expect(onClick).toHaveBeenCalledTimes(2);
  });

  it('keeps focus and its name while loading, but ignores presses', async () => {
    const onClick = vi.fn();
    render(
      <Button loading onClick={onClick}>
        Save
      </Button>,
    );
    const button = screen.getByRole('button', { name: 'Save' });
    expect(button).toHaveAttribute('aria-busy', 'true');
    expect(button).toHaveAttribute('aria-disabled', 'true');
    await userEvent.tab();
    expect(button).toHaveFocus();
    await userEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });

  it('keeps the label visible beside the spinner while loading', () => {
    render(<Button loading>Save</Button>);
    const button = screen.getByRole('button', { name: 'Save' });
    const label = screen.getByText('Save');
    expect(label.className).not.toMatch(/text-transparent|invisible|sr-only/);
    expect(button.querySelector('[data-part="spinner"]')).not.toBeNull();
  });

  it('gives a leading icon slot to the spinner, keeping the icon box so the width holds', () => {
    render(
      <Button loading>
        <svg data-testid="icon" aria-hidden className="size-4" />
        Send
      </Button>,
    );
    const button = screen.getByRole('button', { name: 'Send' });
    const slot = button.querySelector('[data-part="icon-slot"]');
    expect(slot).not.toBeNull();
    expect(slot?.contains(screen.getByTestId('icon'))).toBe(true);
    expect(screen.getByTestId('icon').parentElement?.className).toContain('invisible');
    expect(slot?.querySelector('[data-part="spinner"]')).not.toBeNull();
    expect(button.querySelectorAll('[data-part="spinner"]')).toHaveLength(1);
    expect(screen.getByText('Send').className).not.toContain('invisible');
  });

  it('treats a lone component child as the label, never as an icon to hide', () => {
    function Label() {
      return <span>Save draft</span>;
    }
    render(
      <Button loading>
        <Label />
      </Button>,
    );
    expect(screen.getByRole('button', { name: 'Save draft' })).toBeInTheDocument();
    expect(screen.getByText('Save draft').closest('[data-part="icon-slot"]')).toBeNull();
  });

  it('swaps the icon of an icon-only button for the spinner', () => {
    render(
      <Button loading iconOnly aria-label="Refresh">
        <svg data-testid="icon" aria-hidden />
      </Button>,
    );
    const button = screen.getByRole('button', { name: 'Refresh' });
    expect(screen.getByTestId('icon').parentElement?.className).toContain('invisible');
    expect(button.querySelector('[data-part="spinner"]')).not.toBeNull();
  });

  it('breathes instead of turning under reduced motion', () => {
    render(<Button loading>Save</Button>);
    const spinner = screen.getByRole('button').querySelector('[data-part="spinner"]');
    expect(spinner?.getAttribute('class')).toContain('motion-reduce:animate-breathe');
  });

  it('leaves the tab order when disabled', async () => {
    render(
      <>
        <Button disabled>Delete</Button>
        <Button>Next</Button>
      </>,
    );
    await userEvent.tab();
    expect(screen.getByRole('button', { name: 'Next' })).toHaveFocus();
  });

  it('lets renderContent draw the label while keeping the busy semantics', () => {
    render(
      <Button
        loading
        renderContent={({ children, loading }) => <b>{loading ? 'busy' : children}</b>}
      >
        Save
      </Button>,
    );
    const button = screen.getByRole('button', { name: 'busy' });
    expect(button).toHaveAttribute('aria-busy', 'true');
    expect(button).toHaveAttribute('data-loading');
  });

  it('exposes variant and size for styling hooks', () => {
    render(
      <Button variant="danger" size="sm">
        Remove
      </Button>,
    );
    const button = screen.getByRole('button', { name: 'Remove' });
    expect(button).toHaveAttribute('data-variant', 'danger');
    expect(button).toHaveAttribute('data-size', 'sm');
  });

  it('renders as a link without a button role or a type when given a link', () => {
    render(<Button render={<a href="/billing" />}>Billing</Button>);
    const link = screen.getByRole('link', { name: 'Billing' });
    expect(link).not.toHaveAttribute('type');
    expect(link).not.toHaveAttribute('role');
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('stays a native button with its type when rendered as a button', () => {
    render(<Button render={<button />}>Send</Button>);
    expect(screen.getByRole('button', { name: 'Send' })).toHaveAttribute('type', 'button');
  });
});
