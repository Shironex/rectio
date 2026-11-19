import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { Toggle, ToggleGroup } from './toggle';

describe('Toggle', () => {
  it('reports its pressed state and flips on Space', async () => {
    const onPressedChange = vi.fn();
    render(<Toggle onPressedChange={onPressedChange}>Show archived</Toggle>);
    const toggle = screen.getByRole('button', { name: 'Show archived' });
    expect(toggle).toHaveAttribute('aria-pressed', 'false');
    toggle.focus();
    await userEvent.keyboard(' ');
    expect(toggle).toHaveAttribute('aria-pressed', 'true');
    expect(onPressedChange).toHaveBeenLastCalledWith(true, expect.anything());
  });

  it('takes its name from aria-label when it holds only an icon', () => {
    render(
      <Toggle iconOnly aria-label="Pin to sidebar" defaultPressed>
        <svg aria-hidden />
      </Toggle>,
    );
    expect(screen.getByRole('button', { name: 'Pin to sidebar' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });

  it('ignores presses when disabled', async () => {
    render(<Toggle disabled>Starred</Toggle>);
    const toggle = screen.getByRole('button', { name: 'Starred' });
    await userEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-pressed', 'false');
  });
});

function Period(props: {
  onValueChange?: (value: string[]) => void;
  allowEmpty?: boolean;
  legend?: string;
}) {
  return (
    <ToggleGroup
      {...(props.legend === undefined ? { 'aria-label': 'Period' } : { legend: props.legend })}
      defaultValue={['week']}
      onValueChange={props.onValueChange}
      allowEmpty={props.allowEmpty ?? false}
    >
      <Toggle value="day">Day</Toggle>
      <Toggle value="week">Week</Toggle>
      <Toggle value="month">Month</Toggle>
    </ToggleGroup>
  );
}

const pressed = (name: string) => screen.getByRole('button', { name });

describe('ToggleGroup', () => {
  it('is a named group with one pressed toggle', () => {
    render(<Period />);
    expect(screen.getByRole('group', { name: 'Period' })).toBeInTheDocument();
    expect(pressed('Week')).toHaveAttribute('aria-pressed', 'true');
    expect(pressed('Day')).toHaveAttribute('aria-pressed', 'false');
  });

  it('names the group with a visible legend', () => {
    render(<Period legend="Chart period" />);
    expect(screen.getByRole('group', { name: 'Chart period' })).toBeInTheDocument();
  });

  it('moves with the arrow keys and presses with Enter, one choice at a time', async () => {
    const onValueChange = vi.fn();
    render(<Period onValueChange={onValueChange} />);
    pressed('Week').focus();
    await userEvent.keyboard('{ArrowRight}');
    expect(pressed('Month')).toHaveFocus();
    await userEvent.keyboard('{Enter}');
    expect(onValueChange).toHaveBeenLastCalledWith(['month'], expect.anything());
    expect(pressed('Month')).toHaveAttribute('aria-pressed', 'true');
    expect(pressed('Week')).toHaveAttribute('aria-pressed', 'false');
  });

  it('keeps one choice when the pressed toggle is pressed again', async () => {
    const onValueChange = vi.fn();
    render(<Period onValueChange={onValueChange} />);
    await userEvent.click(pressed('Week'));
    expect(pressed('Week')).toHaveAttribute('aria-pressed', 'true');
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it('clears the choice when allowEmpty is set', async () => {
    const onValueChange = vi.fn();
    render(<Period onValueChange={onValueChange} allowEmpty />);
    await userEvent.click(pressed('Week'));
    expect(pressed('Week')).toHaveAttribute('aria-pressed', 'false');
    expect(onValueChange).toHaveBeenLastCalledWith([], expect.anything());
  });

  it('keeps one choice in a controlled group too', async () => {
    function Controlled() {
      const [value, setValue] = useState(['eur']);
      return (
        <>
          <ToggleGroup aria-label="Currency" value={value} onValueChange={setValue}>
            <Toggle value="eur">EUR</Toggle>
            <Toggle value="pln">PLN</Toggle>
          </ToggleGroup>
          <output>{value.join(',')}</output>
        </>
      );
    }
    render(<Controlled />);
    await userEvent.click(pressed('EUR'));
    expect(screen.getByText('eur')).toBeInTheDocument();
    await userEvent.click(pressed('PLN'));
    expect(screen.getByText('pln')).toBeInTheDocument();
  });

  it('presses several toggles when multiple', async () => {
    render(
      <ToggleGroup aria-label="Status" multiple defaultValue={['open']}>
        <Toggle value="open">Open</Toggle>
        <Toggle value="overdue">Overdue</Toggle>
        <Toggle value="paid">Paid</Toggle>
      </ToggleGroup>,
    );
    await userEvent.click(pressed('Overdue'));
    expect(pressed('Open')).toHaveAttribute('aria-pressed', 'true');
    expect(pressed('Overdue')).toHaveAttribute('aria-pressed', 'true');
    await userEvent.click(pressed('Open'));
    await userEvent.click(pressed('Overdue'));
    expect(pressed('Overdue')).toHaveAttribute('aria-pressed', 'false');
  });

  it('disables every toggle', async () => {
    render(
      <ToggleGroup aria-label="View" disabled defaultValue={['list']}>
        <Toggle value="list">List</Toggle>
        <Toggle value="board">Board</Toggle>
      </ToggleGroup>,
    );
    await userEvent.click(pressed('Board'));
    expect(pressed('Board')).toHaveAttribute('aria-pressed', 'false');
  });
});
