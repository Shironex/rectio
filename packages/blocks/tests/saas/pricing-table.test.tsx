import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import {
  PricingTable,
  groupPricingFeatures,
  pricingBestSaving,
  pricingMonthlyPrice,
  pricingPriceText,
  pricingYearlySaving,
  type PricingPlan,
} from '../../src/index';

const PLANS: PricingPlan[] = [
  { id: 'free', name: 'Starter', monthly: 0 },
  { id: 'growth', name: 'Growth', monthly: 24, yearly: 240, recommended: true },
  { id: 'scale', name: 'Scale', monthly: 50, yearly: 500 },
  { id: 'ent', name: 'Enterprise', monthly: null },
];
const [, GROWTH, SCALE, ENT] = PLANS as [PricingPlan, PricingPlan, PricingPlan, PricingPlan];

describe('pricing logic', () => {
  it('spreads yearly prices over the month and works out the saving', () => {
    expect(pricingMonthlyPrice(GROWTH, 'monthly', 'EUR')).toBe(24);
    expect(pricingMonthlyPrice(GROWTH, 'yearly', 'EUR')).toBe(20);
    expect(pricingMonthlyPrice(SCALE, 'yearly', 'EUR')).toBe(41.67);
    expect(pricingMonthlyPrice(ENT, 'yearly', 'EUR')).toBeNull();
    expect(pricingYearlySaving(GROWTH)).toBeCloseTo(1 / 6);
    expect(pricingYearlySaving(ENT)).toBe(0);
    expect(pricingBestSaving(PLANS)).toBeCloseTo(1 / 6);
  });

  it('drops the cents on whole prices only', () => {
    expect(pricingPriceText(20, 'EUR', 'en-GB')).toBe('€20');
    expect(pricingPriceText(39.17, 'EUR', 'en-GB')).toBe('€39.17');
  });

  it('groups features in order', () => {
    expect(
      groupPricingFeatures([
        { id: 'a', label: 'A', group: 'X', values: {} },
        { id: 'b', label: 'B', values: {} },
        { id: 'c', label: 'C', group: 'X', values: {} },
      ]).map((g) => [g.name, g.features.length]),
    ).toEqual([
      ['X', 2],
      [null, 1],
    ]);
  });
});

describe('PricingTable', () => {
  it('switches cycles and picks a plan with the cycle shown', async () => {
    const onSelectPlan = vi.fn();
    render(
      <PricingTable
        plans={PLANS}
        currency="EUR"
        locale="en-GB"
        currentPlanId="free"
        onSelectPlan={onSelectPlan}
      />,
    );
    expect(screen.getByRole('button', { name: /Yearly/ })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText('Save up to 17%')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Monthly' }));
    await userEvent.click(screen.getByRole('button', { name: 'Choose Growth, Growth plan' }));
    expect(onSelectPlan).toHaveBeenCalledWith(GROWTH, 'monthly');
  });

  it('marks the current plan and the recommended one', () => {
    render(
      <PricingTable
        plans={PLANS}
        currency="EUR"
        locale="en-GB"
        currentPlanId="free"
        onSelectPlan={vi.fn()}
      />,
    );
    expect(screen.getByText('Your current plan')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Starter plan/ })).not.toBeInTheDocument();
    expect(screen.getByText('Recommended')).toBeInTheDocument();
    expect(screen.getByText('Free')).toBeInTheDocument();
    expect(screen.getByText('Custom')).toBeInTheDocument();
  });

  it('offers to add a plan when there are none', async () => {
    const onAddPlan = vi.fn();
    render(<PricingTable plans={[]} currency="EUR" onSelectPlan={vi.fn()} onAddPlan={onAddPlan} />);
    await userEvent.click(screen.getByRole('button', { name: 'Add a plan' }));
    expect(onAddPlan).toHaveBeenCalled();
  });

  it('names included and missing features in words', () => {
    render(
      <PricingTable
        plans={PLANS.slice(0, 2)}
        features={[{ id: 'api', label: 'API access', values: { free: false, growth: true } }]}
        currency="EUR"
        onSelectPlan={vi.fn()}
      />,
    );
    const row = screen.getByRole('row', { name: /API access/ });
    expect(row).toHaveTextContent('Not included');
    expect(row).toHaveTextContent('Included');
  });
});
