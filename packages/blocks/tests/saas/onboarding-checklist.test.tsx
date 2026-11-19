import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import {
  OnboardingChecklist,
  onboardingProgress,
  onboardingSummary,
  type OnboardingStep,
} from '../../src/index';

const STEPS: OnboardingStep[] = [
  { id: 'a', title: 'Name your workspace', done: true },
  {
    id: 'b',
    title: 'Connect your bank',
    description: 'Transactions arrive every morning.',
    done: false,
    action: { label: 'Connect', onSelect: () => undefined },
  },
  { id: 'c', title: 'Invite your team', done: false, optional: true },
];

describe('onboarding progress', () => {
  it('counts what is done and points at the first step left', () => {
    const progress = onboardingProgress(STEPS);
    expect(progress).toMatchObject({ done: 1, total: 3, percent: 33, complete: false });
    expect(progress.next?.id).toBe('b');
    expect(onboardingSummary(progress)).toBe('1 of 3 done');
  });

  it('says when everything is done, and when there is nothing', () => {
    const all = onboardingProgress(STEPS.map((step) => ({ ...step, done: true })));
    expect(all).toMatchObject({ complete: true, next: null, percent: 100 });
    expect(onboardingSummary(all)).toBe('All 3 done');
    expect(onboardingProgress([])).toMatchObject({ complete: false, percent: 0 });
    expect(onboardingSummary(onboardingProgress([]))).toBe('Nothing to set up');
  });
});

describe('OnboardingChecklist', () => {
  it('marks the next step as current and runs its action', async () => {
    const onSelect = vi.fn();
    const steps = STEPS.map((step) =>
      step.id === 'b' ? { ...step, action: { label: 'Connect', onSelect } } : step,
    );
    render(<OnboardingChecklist steps={steps} />);
    const current = screen.getByText('Connect your bank').closest('li');
    expect(current).toHaveAttribute('aria-current', 'step');
    await userEvent.click(screen.getByRole('button', { name: 'Connect' }));
    expect(onSelect).toHaveBeenCalled();
    expect(screen.getByRole('meter', { name: 'Setup progress' })).toHaveAttribute(
      'aria-valuetext',
      '1 of 3 done',
    );
    expect(current).toHaveTextContent('Next');
  });

  it('marks a step done by hand', async () => {
    const onToggleStep = vi.fn();
    render(<OnboardingChecklist steps={STEPS} onToggleStep={onToggleStep} />);
    await userEvent.click(screen.getByRole('button', { name: 'More for Invite your team' }));
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Mark as done' }));
    expect(onToggleStep).toHaveBeenCalledWith('c', true);
    await userEvent.click(screen.getByRole('button', { name: 'More for Name your workspace' }));
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Mark as not done' }));
    expect(onToggleStep).toHaveBeenCalledWith('a', false);
  });

  it('folds the steps away and back', async () => {
    render(<OnboardingChecklist steps={STEPS} />);
    const toggle = screen.getByRole('button', { name: 'Hide steps' });
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    await userEvent.click(toggle);
    expect(screen.getByRole('button', { name: 'Show steps' })).toHaveAttribute(
      'aria-expanded',
      'false',
    );
    expect(screen.queryByText('Connect your bank')).not.toBeVisible();
  });

  it('says it is finished and offers to hide', async () => {
    const onDismiss = vi.fn();
    render(
      <OnboardingChecklist
        steps={STEPS.map((step) => ({ ...step, done: true }))}
        onDismiss={onDismiss}
      />,
    );
    expect(screen.getByRole('status')).toHaveTextContent('You are all set up');
    await userEvent.click(screen.getByRole('button', { name: 'Hide checklist' }));
    expect(onDismiss).toHaveBeenCalled();
  });
});
