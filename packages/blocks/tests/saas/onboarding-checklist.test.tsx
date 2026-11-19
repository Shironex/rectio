import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
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
    await userEvent.click(screen.getByRole('button', { name: 'Mark Invite your team as done' }));
    expect(onToggleStep).toHaveBeenCalledWith('c', true);
    await userEvent.click(
      screen.getByRole('button', { name: 'Mark Name your workspace as not done' }),
    );
    expect(onToggleStep).toHaveBeenCalledWith('a', false);
  });

  it('moves focus to the finished note when the last step is done by hand', async () => {
    function Harness() {
      const [steps, setSteps] = useState(STEPS.map((step) => ({ ...step, done: step.id !== 'c' })));
      return (
        <OnboardingChecklist
          steps={steps}
          onToggleStep={(id, done) => {
            setSteps(steps.map((step) => (step.id === id ? { ...step, done } : step)));
          }}
        />
      );
    }
    render(<Harness />);
    await userEvent.click(screen.getByRole('button', { name: 'Mark Invite your team as done' }));
    expect(screen.getByRole('heading', { name: 'You are all set up' })).toHaveFocus();
  });

  it('gives a reason to start before anything is done, and keeps the next step primary', () => {
    const fresh = STEPS.map((step) => ({ ...step, done: false }));
    render(<OnboardingChecklist steps={fresh} estimate="About 10 minutes" />);
    expect(screen.getByText('0 of 3 done, about 10 minutes in all')).toBeInTheDocument();
    expect(screen.getByText('Name your workspace').closest('li')).toHaveAttribute(
      'aria-current',
      'step',
    );
  });

  it('marks finished steps as done in words', () => {
    render(<OnboardingChecklist steps={STEPS} />);
    expect(screen.getByText('Name your workspace').closest('li')).toHaveTextContent('Done');
  });

  it('always gives the next step a primary button, even with no action of its own', () => {
    const fresh = STEPS.map((step) => ({ ...step, done: false }));
    const onToggleStep = vi.fn();
    render(<OnboardingChecklist steps={fresh} onToggleStep={onToggleStep} />);
    const next = screen.getByText('Name your workspace').closest('li');
    expect(next).toHaveAttribute('aria-current', 'step');
    const cta = screen.getByRole('button', { name: 'Mark Name your workspace as done' });
    expect(cta).toHaveAttribute('data-variant', 'primary');
    // A later step with its own action keeps it, and Mark done stays secondary beside it.
    expect(screen.getByRole('button', { name: 'Mark Connect your bank as done' })).toHaveAttribute(
      'data-variant',
      'secondary',
    );
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
