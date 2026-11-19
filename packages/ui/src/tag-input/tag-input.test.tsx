import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { Field, FieldDescription, FieldError, FieldLabel } from '../field/field';
import { Tag, TagInput, type TagInputProps } from './tag-input';

function renderTags(props: Partial<TagInputProps> = {}) {
  const onValueChange = vi.fn();
  render(
    <Field>
      <FieldLabel>Labels</FieldLabel>
      <TagInput onValueChange={onValueChange} {...props} />
      <FieldDescription>Press Enter after each label.</FieldDescription>
    </Field>,
  );
  return { input: screen.getByRole('textbox', { name: 'Labels' }), onValueChange };
}

const tagNames = () =>
  Array.from(document.querySelectorAll('[data-slot="tag"]')).map((tag) => tag.textContent);

describe('TagInput', () => {
  it('is named by the field label and linked to its description', () => {
    const { input } = renderTags();
    expect(input).toHaveAccessibleDescription('Press Enter after each label.');
  });

  it('adds a tag on Enter and on the comma', async () => {
    const { input, onValueChange } = renderTags();
    await userEvent.type(input, 'design{Enter}billing,');
    expect(tagNames()).toEqual(['design', 'billing']);
    expect(onValueChange).toHaveBeenLastCalledWith(['design', 'billing']);
    expect(input).toHaveValue('');
  });

  it('takes custom delimiters', async () => {
    const { input } = renderTags({ delimiters: [';', ' '] });
    await userEvent.type(input, 'q1;q2 q3');
    expect(tagNames()).toEqual(['q1', 'q2']);
    expect(input).toHaveValue('q3');
  });

  it('splits a pasted list on lines and delimiters', async () => {
    const { input } = renderTags();
    await userEvent.click(input);
    await userEvent.paste('travel\nmeals, software');
    expect(tagNames()).toEqual(['travel', 'meals', 'software']);
  });

  it('rejects a duplicate whatever its case and shows why through the field error', async () => {
    const { input } = renderTags({ defaultValue: ['Design'] });
    await userEvent.type(input, 'design{Enter}');
    expect(tagNames()).toEqual(['Design']);
    expect(input).toHaveValue('design');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAccessibleDescription(expect.stringContaining('is already added.'));
    expect(screen.getByRole('alert')).toHaveTextContent('"design" is already added.');
    await userEvent.type(input, 'x');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('keeps case-different tags apart when case sensitive', async () => {
    const { input } = renderTags({ defaultValue: ['Design'], caseSensitive: true });
    await userEvent.type(input, 'design{Enter}');
    expect(tagNames()).toEqual(['Design', 'design']);
  });

  it('runs validate and shows its message', async () => {
    const { input } = renderTags({
      validate: (tag) => (/^[a-z-]+$/.test(tag) ? null : 'Use lowercase letters and dashes.'),
    });
    await userEvent.type(input, 'Q3 plan{Enter}');
    expect(tagNames()).toEqual([]);
    expect(screen.getByRole('alert')).toHaveTextContent('Use lowercase letters and dashes.');
  });

  it('stops at max', async () => {
    const { input } = renderTags({ defaultValue: ['a', 'b'], max: 2 });
    await userEvent.type(input, 'c{Enter}');
    expect(tagNames()).toEqual(['a', 'b']);
    expect(screen.getByRole('alert')).toHaveTextContent('Up to 2 tags.');
  });

  it('selects the last tag on Backspace in the empty input, then removes it', async () => {
    const { input, onValueChange } = renderTags({ defaultValue: ['design', 'billing'] });
    await userEvent.click(input);
    await userEvent.keyboard('{Backspace}');
    expect(screen.getByText('billing').closest('[data-slot="tag"]')).toHaveFocus();
    expect(tagNames()).toEqual(['design', 'billing']);
    await userEvent.keyboard('{Backspace}');
    expect(onValueChange).toHaveBeenLastCalledWith(['design']);
    await waitFor(() => {
      expect(screen.getByText('design').closest('[data-slot="tag"]')).toHaveFocus();
    });
  });

  it('moves between tags with the arrows and removes the focused one with Delete', async () => {
    const { input } = renderTags({ defaultValue: ['one', 'two', 'three'] });
    await userEvent.click(input);
    await userEvent.keyboard('{ArrowLeft}{ArrowLeft}');
    expect(screen.getByText('two').closest('[data-slot="tag"]')).toHaveFocus();
    await userEvent.keyboard('{Delete}');
    expect(tagNames()).toEqual(['one', 'three']);
    await waitFor(() => {
      expect(screen.getByText('three').closest('[data-slot="tag"]')).toHaveFocus();
    });
    await userEvent.keyboard('{ArrowRight}');
    expect(input).toHaveFocus();
  });

  it('removes a tag with its named remove button', async () => {
    const { onValueChange } = renderTags({ defaultValue: ['design', 'billing'] });
    await userEvent.click(screen.getByRole('button', { name: 'Remove design' }));
    expect(onValueChange).toHaveBeenLastCalledWith(['billing']);
  });

  it('follows a controlled value', async () => {
    function Controlled() {
      const [tags, setTags] = useState(['design']);
      return (
        <>
          <TagInput aria-label="Labels" value={tags} onValueChange={setTags} />
          <output>{tags.join('|')}</output>
        </>
      );
    }
    render(<Controlled />);
    await userEvent.type(screen.getByRole('textbox', { name: 'Labels' }), 'ops{Enter}');
    expect(screen.getByRole('status')).toHaveTextContent('design|ops');
  });

  it('shows an error the app sets on the field', () => {
    render(
      <Field invalid>
        <FieldLabel>Labels</FieldLabel>
        <TagInput defaultValue={['legacy']} />
        <FieldError>Label legacy was retired.</FieldError>
      </Field>,
    );
    const input = screen.getByRole('textbox', { name: 'Labels' });
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByText('Label legacy was retired.')).toBeVisible();
  });

  it('cannot change while the field is disabled', async () => {
    const onValueChange = vi.fn();
    render(
      <Field disabled>
        <FieldLabel>Labels</FieldLabel>
        <TagInput defaultValue={['design']} onValueChange={onValueChange} />
      </Field>,
    );
    expect(screen.getByRole('textbox', { name: 'Labels' })).toBeDisabled();
    await userEvent.click(screen.getByRole('button', { name: 'Remove design' }));
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it('submits one value per tag', () => {
    const { container } = render(
      <form>
        <TagInput aria-label="Labels" name="labels" defaultValue={['a', 'b']} />
      </form>,
    );
    const form = container.querySelector('form');
    if (form === null) throw new Error('no form');
    expect(new FormData(form).getAll('labels')).toEqual(['a', 'b']);
  });
});

describe('Tag', () => {
  it('is a plain label without onRemove', () => {
    render(<Tag>Approved</Tag>);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('names its remove button after the tag', async () => {
    const onRemove = vi.fn();
    render(<Tag onRemove={onRemove}>finance</Tag>);
    await userEvent.click(screen.getByRole('button', { name: 'Remove finance' }));
    expect(onRemove).toHaveBeenCalledOnce();
  });
});
