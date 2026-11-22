import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { Banner } from '../banner/banner';
import { Button } from '../button/button';
import { ChatMessage } from '../chat-message/chat-message';
import { Checkbox } from '../checkbox/checkbox';
import { MessageActions } from '../message-actions/message-actions';
import { MultiSelect, MultiSelectContent, MultiSelectInput } from '../multi-select/multi-select';
import { Pagination } from '../pagination/pagination-bar';
import { Reasoning } from '../reasoning/reasoning';
import { Stepper } from '../stepper/stepper';
import { Tabs, TabsList, TabsTab } from '../tabs/tabs';
import { Tag, TagInput } from '../tag-input/tag-input';
import { Toggle, ToggleGroup } from '../toggle/toggle';
import { touchHitArea } from './cn';

/**
 * jsdom has no layout and no `pointer: coarse`, so these tests pin the parts a touch target is
 * made of: the shared hit area on every small control, a positioned box for it to sit in, the gap
 * that keeps neighbours apart, and a full touch height where a hit area cannot grow. The measured
 * sizes on a phone come from `pnpm --filter @rectio/playground audit:touch`.
 */
const HIT_AREA = touchHitArea.split(' ');

function expectHitArea(element: Element) {
  expect(element.className.split(' ')).toEqual(expect.arrayContaining(HIT_AREA));
  expect(element).toHaveClass(/^(relative|absolute)$/);
}

describe('touch targets', () => {
  it('gives a small icon button the hit area', () => {
    render(
      <Button size="sm" iconOnly aria-label="Next">
        <svg aria-hidden />
      </Button>,
    );
    expectHitArea(screen.getByRole('button', { name: 'Next' }));
  });

  it('gives a toggle of any size the hit area, so a short label still makes the width', () => {
    render(
      <>
        <Toggle>B</Toggle>
        <Toggle size="sm">I</Toggle>
      </>,
    );
    expectHitArea(screen.getByRole('button', { name: 'B' }));
    expectHitArea(screen.getByRole('button', { name: 'I' }));
  });

  it('grows a short segment to the touch height wide instead, with no room beside it', () => {
    render(
      <ToggleGroup aria-label="Range" defaultValue={['30']}>
        <Toggle value="30">30d</Toggle>
      </ToggleGroup>,
    );
    expect(screen.getByRole('button', { name: '30d' })).toHaveClass(
      'pointer-coarse:min-w-(--rx-control-height-touch)',
    );
  });

  it('gives a checkbox and the remove button of a tag the hit area', () => {
    render(
      <>
        <Checkbox aria-label="Select all" />
        <Tag onRemove={() => undefined}>saas</Tag>
      </>,
    );
    expectHitArea(screen.getByRole('checkbox', { name: 'Select all' }));
    expectHitArea(screen.getByRole('button', { name: 'Remove saas' }));
    // Tags are a small button tall on touch screens, so rows spaced by the touch gap hold.
    expect(document.querySelector('[data-slot="tag"]')).toHaveClass(
      'pointer-coarse:h-(--rx-control-height-sm)',
    );
  });

  it('stretches the end buttons of a multi select to the field and spaces its chips', () => {
    render(
      <MultiSelect items={['Isla']} defaultValue={['Isla']}>
        <MultiSelectInput aria-label="Approvers" />
        <MultiSelectContent />
      </MultiSelect>,
    );
    for (const name of ['Clear all', 'Show options']) {
      const button = screen.getByRole('button', { name });
      expect(button).toHaveClass('self-stretch');
      expectHitArea(button);
    }
    // Rows of chips sit a touch gap apart; beside each other a chip's body lets touches through.
    expect(document.querySelector('[data-slot="multi-select-chips"]')).toHaveClass(
      'pointer-coarse:gap-y-touch-gap',
    );
    expect(document.querySelector('[data-slot="multi-select-chip"]')).toHaveClass(
      'pointer-coarse:pointer-events-none',
    );
    expect(screen.getByRole('button', { name: 'Remove Isla' })).toHaveClass(
      'pointer-coarse:pointer-events-auto',
    );
  });

  it('keeps the presses of a tag of your own, and lets touches through only tags in a field', async () => {
    const onClick = vi.fn();
    render(
      <>
        <Tag onClick={onClick}>Draft</Tag>
        <TagInput aria-label="Labels" defaultValue={['saas']} />
      </>,
    );
    const [own, inField] = document.querySelectorAll('[data-slot="tag"]');
    expect(own).not.toHaveClass('pointer-coarse:pointer-events-none');
    await userEvent.click(screen.getByText('Draft'));
    expect(onClick).toHaveBeenCalledOnce();
    expect(inField).toHaveClass('pointer-coarse:pointer-events-none');
    expect(screen.getByRole('button', { name: 'Remove saas' })).toHaveClass(
      'pointer-coarse:pointer-events-auto',
    );
  });

  it('spaces small neighbours by the touch gap, which follows density and skin', () => {
    render(
      <>
        <Pagination page={2} pageCount={5} variant="full" />
        <MessageActions content="Paid" />
      </>,
    );
    expect(screen.getByRole('navigation').querySelector('ul')).toHaveClass(
      'pointer-coarse:gap-touch-gap',
    );
    expect(document.querySelector('[data-slot="message-actions"]')).toHaveClass(
      'pointer-coarse:gap-touch-gap',
    );
    expectHitArea(screen.getByRole('button', { name: 'Page 3' }));
  });

  it('keeps the tab indicator from taking a press meant for the tab', () => {
    render(
      <Tabs defaultValue="a">
        <TabsList>
          <TabsTab value="a">Open</TabsTab>
        </TabsList>
      </Tabs>,
    );
    expect(document.querySelector('[data-slot="tabs-indicator"]')).toHaveClass(
      'pointer-events-none',
    );
  });

  it('gives a step circle, a banner action and the rows of a reply a touch height', () => {
    render(
      <>
        <Stepper
          steps={[{ title: 'Company' }, { title: 'Bank' }]}
          current={1}
          onStepSelect={() => undefined}
        />
        <Banner action={<a href="#new">See what changed</a>}>New in this release</Banner>
        <ChatMessage from="assistant" actions={<span>actions</span>}>
          <Reasoning status="done">Checked the ledger.</Reasoning>
        </ChatMessage>
      </>,
    );
    expectHitArea(screen.getByRole('button', { name: /Company/ }));
    expect(document.querySelector('[data-slot="banner-action"]')).toHaveClass(
      'pointer-coarse:*:min-h-(--rx-control-height-touch)',
    );
    expect(screen.getByRole('button', { name: /Thought|Reasoning|Thinking/ })).toHaveClass(
      'pointer-coarse:min-h-(--rx-control-height-touch)',
    );
    expect(document.querySelector('[data-part="actions"]')).toHaveClass(
      'pointer-coarse:min-h-(--rx-control-height-touch)',
    );
  });
});
