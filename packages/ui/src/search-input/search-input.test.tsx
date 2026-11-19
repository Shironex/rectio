import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { Field, FieldError, FieldLabel } from '../field/field';
import { SearchInput } from './search-input';

describe('SearchInput', () => {
  it('is a labelled search box', () => {
    render(
      <Field>
        <FieldLabel>Search invoices</FieldLabel>
        <SearchInput />
      </Field>,
    );
    expect(screen.getByRole('searchbox', { name: 'Search invoices' })).toHaveAttribute(
      'type',
      'search',
    );
  });

  it('shows a named clear button once there is text, which clears and keeps focus', async () => {
    const onValueChange = vi.fn();
    const onClear = vi.fn();
    render(<SearchInput aria-label="Search" onValueChange={onValueChange} onClear={onClear} />);
    const input = screen.getByRole('searchbox', { name: 'Search' });
    expect(screen.queryByRole('button', { name: 'Clear search' })).not.toBeInTheDocument();
    await userEvent.type(input, 'acme');
    await userEvent.click(screen.getByRole('button', { name: 'Clear search' }));
    expect(input).toHaveValue('');
    expect(input).toHaveFocus();
    expect(onValueChange).toHaveBeenLastCalledWith('', expect.anything());
    expect(onClear).toHaveBeenCalledOnce();
    expect(screen.queryByRole('button', { name: 'Clear search' })).not.toBeInTheDocument();
  });

  it('clears with Escape, and lets a second Escape through to what holds it', async () => {
    // Stands in for a dialog that closes on Escape.
    const outer = vi.fn((event: KeyboardEvent) => event.key === 'Escape');
    document.addEventListener('keydown', outer);
    render(<SearchInput aria-label="Search" defaultValue="acme" />);
    const input = screen.getByRole('searchbox', { name: 'Search' });
    await userEvent.click(input);
    await userEvent.keyboard('{Escape}');
    expect(input).toHaveValue('');
    expect(outer).not.toHaveReturnedWith(true);
    await userEvent.keyboard('{Escape}');
    expect(outer).toHaveReturnedWith(true);
    document.removeEventListener('keydown', outer);
  });

  it('clears a controlled value through onValueChange', async () => {
    function Controlled() {
      const [query, setQuery] = useState('north');
      return (
        <>
          <SearchInput aria-label="Search" value={query} onValueChange={setQuery} />
          <output>{query === '' ? 'empty' : query}</output>
        </>
      );
    }
    render(<Controlled />);
    await userEvent.click(screen.getByRole('button', { name: 'Clear search' }));
    expect(screen.getByRole('searchbox')).toHaveValue('');
    expect(screen.getByRole('status')).toHaveTextContent('empty');
  });

  it('shows the shortcut hint while empty, but only binds it when asked', () => {
    const { unmount } = render(<SearchInput aria-label="Search" shortcut="/" />);
    expect(screen.getByText('/')).toHaveAttribute('aria-hidden', 'true');
    fireEvent.keyDown(document.body, { key: '/' });
    expect(screen.getByRole('searchbox')).not.toHaveFocus();
    expect(screen.getByRole('searchbox')).not.toHaveAttribute('aria-keyshortcuts');
    unmount();

    render(<SearchInput aria-label="Search" shortcut="/" globalShortcut />);
    const input = screen.getByRole('searchbox');
    expect(input).toHaveAttribute('aria-keyshortcuts', '/');
    fireEvent.keyDown(document.body, { key: '/' });
    expect(input).toHaveFocus();
  });

  it('never takes the shortcut from another field', () => {
    render(
      <>
        <input aria-label="Note" />
        <SearchInput aria-label="Search" shortcut="/" globalShortcut />
      </>,
    );
    const note = screen.getByRole('textbox', { name: 'Note' });
    note.focus();
    fireEvent.keyDown(note, { key: '/' });
    expect(note).toHaveFocus();
  });

  it('matches mod+k with Control off Apple devices', () => {
    render(<SearchInput aria-label="Search" shortcut="mod+k" globalShortcut />);
    const input = screen.getByRole('searchbox');
    expect(screen.getByText('Ctrl K')).toBeInTheDocument();
    fireEvent.keyDown(document.body, { key: 'k' });
    expect(input).not.toHaveFocus();
    fireEvent.keyDown(document.body, { key: 'k', ctrlKey: true });
    expect(input).toHaveFocus();
  });

  it('shows the error when the app sets the Field invalid', () => {
    render(
      <Field invalid>
        <FieldLabel>Search</FieldLabel>
        <SearchInput defaultValue="%%" />
        <FieldError>Use letters or numbers.</FieldError>
      </Field>,
    );
    expect(screen.getByRole('searchbox', { name: 'Search' })).toHaveAccessibleDescription(
      'Use letters or numbers.',
    );
  });

  it('has no clear button when disabled', () => {
    render(
      <Field disabled>
        <FieldLabel>Search</FieldLabel>
        <SearchInput defaultValue="acme" />
      </Field>,
    );
    expect(screen.getByRole('searchbox')).toBeDisabled();
    expect(screen.queryByRole('button', { name: 'Clear search' })).not.toBeInTheDocument();
  });
});
