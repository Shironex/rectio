import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { Field, FieldDescription, FieldError, FieldLabel } from '../field/field';
import { Textarea } from './textarea';

/** jsdom has no layout: give lines a height and make the scroll height follow the text. */
const LINE = 20;
const PADDING = 8;
const metrics = {
  lineHeight: `${String(LINE)}px`,
  paddingTop: `${String(PADDING)}px`,
  paddingBottom: `${String(PADDING)}px`,
};

beforeEach(() => {
  Object.defineProperty(HTMLTextAreaElement.prototype, 'scrollHeight', {
    configurable: true,
    get(this: HTMLTextAreaElement) {
      return this.value.split('\n').length * LINE + PADDING * 2;
    },
  });
});

afterEach(() => {
  Reflect.deleteProperty(HTMLTextAreaElement.prototype, 'scrollHeight');
});

const rowsHeight = (rows: number) => `${String(rows * LINE + PADDING * 2)}px`;

describe('Textarea', () => {
  it('is a labelled multi-line field with its description linked', () => {
    render(
      <Field>
        <FieldLabel>Notes for the approver</FieldLabel>
        <Textarea />
        <FieldDescription>Visible to finance only.</FieldDescription>
      </Field>,
    );
    const textarea = screen.getByRole('textbox', { name: 'Notes for the approver' });
    expect(textarea.tagName).toBe('TEXTAREA');
    expect(textarea).toHaveAccessibleDescription('Visible to finance only.');
  });

  it('shows the error when the app marks the field invalid', () => {
    render(
      <Field invalid>
        <FieldLabel>Reason</FieldLabel>
        <Textarea defaultValue="x" />
        <FieldError>Say why the expense is over policy.</FieldError>
      </Field>,
    );
    const textarea = screen.getByRole('textbox', { name: 'Reason' });
    expect(textarea).toHaveAttribute('aria-invalid', 'true');
    expect(textarea).toHaveAccessibleDescription('Say why the expense is over policy.');
  });

  it('takes disabled from the field', () => {
    render(
      <Field disabled>
        <FieldLabel>Reason</FieldLabel>
        <Textarea />
      </Field>,
    );
    expect(screen.getByRole('textbox', { name: 'Reason' })).toBeDisabled();
  });

  it('grows with its text between minRows and maxRows, then scrolls (uncontrolled)', async () => {
    render(<Textarea aria-label="Notes" minRows={2} maxRows={4} style={metrics} />);
    const textarea = screen.getByRole<HTMLTextAreaElement>('textbox', { name: 'Notes' });
    expect(textarea.style.height).toBe(rowsHeight(2));
    await userEvent.type(textarea, 'one{Enter}two{Enter}three');
    expect(textarea.style.height).toBe(rowsHeight(3));
    expect(textarea.style.overflowY).toBe('hidden');
    await userEvent.type(textarea, '{Enter}four{Enter}five{Enter}six');
    expect(textarea.style.height).toBe(rowsHeight(4));
    expect(textarea.style.overflowY).toBe('auto');
    await userEvent.clear(textarea);
    expect(textarea.style.height).toBe(rowsHeight(2));
  });

  it('fits a value set from outside (controlled)', async () => {
    function Controlled() {
      const [value, setValue] = useState('');
      return (
        <>
          <Textarea
            aria-label="Notes"
            minRows={1}
            value={value}
            onValueChange={setValue}
            style={metrics}
          />
          <button
            type="button"
            onClick={() => {
              setValue('a\nb\nc');
            }}
          >
            Fill
          </button>
        </>
      );
    }
    render(<Controlled />);
    const textarea = screen.getByRole<HTMLTextAreaElement>('textbox', { name: 'Notes' });
    expect(textarea.style.height).toBe(rowsHeight(1));
    await userEvent.click(screen.getByRole('button', { name: 'Fill' }));
    expect(textarea).toHaveValue('a\nb\nc');
    expect(textarea.style.height).toBe(rowsHeight(3));
    await userEvent.type(textarea, '{Enter}d');
    expect(textarea.style.height).toBe(rowsHeight(4));
  });

  it('counts characters against the limit', async () => {
    render(<Textarea aria-label="Bio" maxLength={500} showCount defaultValue="Hello" />);
    expect(screen.getByText('5 / 500')).toBeInTheDocument();
    await userEvent.type(screen.getByRole('textbox', { name: 'Bio' }), ' there');
    expect(screen.getByText('11 / 500')).toBeInTheDocument();
  });

  it('warns near the limit in words, and announces only then', () => {
    vi.useFakeTimers();
    try {
      const { rerender } = render(
        <Textarea aria-label="Bio" maxLength={20} showCount value="01234567" readOnly />,
      );
      const live = document.querySelector('[aria-live="polite"]');
      act(() => {
        vi.advanceTimersByTime(600);
      });
      expect(live).toBeEmptyDOMElement();
      expect(document.querySelector('[data-slot="textarea-count"]')).toHaveAttribute(
        'data-tone',
        'rest',
      );

      rerender(
        <Textarea aria-label="Bio" maxLength={20} showCount value="0123456789abcd" readOnly />,
      );
      act(() => {
        vi.advanceTimersByTime(600);
      });
      const count = document.querySelector('[data-slot="textarea-count"] > [aria-hidden]');
      const tone = document.querySelector('[data-slot="textarea-count"]');
      expect(tone).toHaveAttribute('data-tone', 'near');
      expect(count).toHaveTextContent('6 left, 14 / 20');
      expect(live).toHaveTextContent('6 characters left');

      rerender(
        <Textarea
          aria-label="Bio"
          maxLength={20}
          showCount
          value="0123456789abcdefghij"
          readOnly
        />,
      );
      act(() => {
        vi.advanceTimersByTime(600);
      });
      expect(tone).toHaveAttribute('data-tone', 'limit');
      expect(count).toHaveTextContent('Limit reached, 20 / 20');
      expect(live).toHaveTextContent('Limit reached');
    } finally {
      vi.useRealTimers();
    }
  });

  it('stops typing at maxLength', async () => {
    render(<Textarea aria-label="Code" maxLength={3} showCount />);
    const textarea = screen.getByRole('textbox', { name: 'Code' });
    await userEvent.type(textarea, 'abcdef');
    expect(textarea).toHaveValue('abc');
  });
});
