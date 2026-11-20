import { act, render, renderHook, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  AnnouncementBar,
  ContactSection,
  CookieConsent,
  Faq,
  HeroCentered,
  HeroFloating,
  HeroSplit,
  HeroWordCycle,
  LegalPage,
  Newsletter,
  PRIVACY_POLICY_TEMPLATE,
  SiteHeader,
  StatRow,
  templateSections,
  useWordCycle,
  type ConsentRecord,
  type CookieCategory,
} from '../src/marketing';
import * as moving from '../src/marketing/motion';

const LINKS = [
  { label: 'Product', href: '#product' },
  { label: 'Pricing', href: '#pricing' },
];
const CATEGORIES: CookieCategory[] = [
  { id: 'necessary', title: 'Necessary', description: 'Needed.', required: true },
  { id: 'analytics', title: 'Analytics', description: 'Counts.' },
];

afterEach(() => {
  vi.useRealTimers();
});

describe('SiteHeader', () => {
  it('marks the current page and opens a menu that closes on a link press', async () => {
    const user = userEvent.setup();
    render(
      <SiteHeader
        brand="Northlake"
        brandLabel="Northlake home"
        links={LINKS}
        currentHref="#pricing"
        primary={{ label: 'Start free', href: '#start' }}
      />,
    );
    const [desktop] = screen.getAllByRole('navigation', { name: 'Main' });
    if (desktop === undefined) throw new Error('no main navigation');
    expect(within(desktop).getByRole('link', { name: 'Pricing' })).toHaveAttribute(
      'aria-current',
      'page',
    );

    await user.click(screen.getByRole('button', { name: 'Menu' }));
    const dialog = await screen.findByRole('dialog');
    await user.click(within(dialog).getByRole('link', { name: 'Product' }));
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });
});

describe('useWordCycle', () => {
  it('steps through the words, then settles on the first after its loops', () => {
    vi.useFakeTimers();
    const { result } = renderHook(() =>
      useWordCycle(3, { interval: 1000, loops: 1, paused: false }),
    );
    expect(result.current).toBe(0);
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(result.current).toBe(1);
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(result.current).toBe(2);
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(result.current).toBe(0);
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(result.current).toBe(0);
  });

  it('holds while paused', () => {
    vi.useFakeTimers();
    const { result } = renderHook(() =>
      useWordCycle(3, { interval: 1000, loops: 2, paused: true }),
    );
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(result.current).toBe(0);
  });
});

describe('HeroWordCycle', () => {
  it('gives assistive technology one stable heading', () => {
    render(<HeroWordCycle before="Close the books on" words={['invoices', 'payouts']} />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      /Close the books on invoices and payouts/,
    );
  });
});

describe('Faq', () => {
  it('opens an answer from its question', async () => {
    const user = userEvent.setup();
    render(
      <Faq
        title="Questions"
        items={[{ id: 'a', question: 'How long does setup take?', answer: 'An afternoon.' }]}
      />,
    );
    const question = screen.getByRole('button', { name: 'How long does setup take?' });
    expect(question).toHaveAttribute('aria-expanded', 'false');
    await user.click(question);
    expect(question).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('An afternoon.')).toBeVisible();
  });

  it('lists numbered answers open', () => {
    render(
      <Faq
        variant="numbered"
        title="Before you start"
        items={[{ id: 'a', question: 'Is there a trial?', answer: 'Yes, 30 days.' }]}
      />,
    );
    expect(screen.getByText('Yes, 30 days.')).toBeVisible();
    expect(screen.getByText('01')).toBeInTheDocument();
  });
});

describe('Newsletter', () => {
  it('explains a malformed address without calling back', async () => {
    const user = userEvent.setup();
    const onSubscribe = vi.fn();
    render(<Newsletter title="The letter" onSubscribe={onSubscribe} />);
    await user.type(screen.getByLabelText('Email address'), 'ingrid@');
    await user.click(screen.getByRole('button', { name: 'Subscribe' }));
    expect(await screen.findByText(/such as name@company.com/)).toBeInTheDocument();
    expect(onSubscribe).not.toHaveBeenCalled();
  });

  it('shows the thrown message, then success on a retry', async () => {
    const user = userEvent.setup();
    const onSubscribe = vi
      .fn()
      .mockRejectedValueOnce(new Error('Our list is down. Try again in a minute.'))
      .mockResolvedValueOnce(undefined);
    render(<Newsletter title="The letter" onSubscribe={onSubscribe} />);
    await user.type(screen.getByLabelText('Email address'), 'ingrid@halden.example');
    await user.click(screen.getByRole('button', { name: 'Subscribe' }));
    expect(await screen.findByText('Our list is down. Try again in a minute.')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Subscribe' }));
    expect(await screen.findByText(/Check your inbox/)).toBeInTheDocument();
    expect(onSubscribe).toHaveBeenLastCalledWith('ingrid@halden.example');
  });
});

describe('ContactSection', () => {
  it('focuses the first invalid field, then sends a valid message', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<ContactSection title="Talk to us" onSubmit={onSubmit} />);
    await user.click(screen.getByRole('button', { name: 'Send message' }));
    expect(screen.getByLabelText('Name')).toHaveFocus();
    expect(screen.getByText('Enter your name.')).toBeInTheDocument();

    await user.type(screen.getByLabelText('Name'), 'Ingrid Solberg');
    await user.type(screen.getByLabelText('Work email'), 'ingrid@halden.example');
    await user.type(screen.getByLabelText('Message'), 'A demo for three entities, please.');
    await user.click(screen.getByRole('button', { name: 'Send message' }));
    expect(await screen.findByText('Message sent')).toBeInTheDocument();
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Ingrid Solberg', email: 'ingrid@halden.example' }),
    );
  });
});

function ConsentHarness({ onSave }: { onSave: (record: ConsentRecord) => void }) {
  const [consent, setConsent] = useState<ConsentRecord | null>(null);
  return (
    <CookieConsent
      categories={CATEGORIES}
      version="v1"
      consent={consent}
      onSave={(record) => {
        setConsent(record);
        onSave(record);
      }}
    />
  );
}

describe('CookieConsent', () => {
  it('rejects in one press and then stays away', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    render(<ConsentHarness onSave={onSave} />);
    const reject = screen.getByRole('button', { name: 'Reject all' });
    const accept = screen.getByRole('button', { name: 'Accept all' });
    // Equal weight: the same variant for both choices.
    expect(reject.className).toBe(accept.className);
    await user.click(reject);
    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({ version: 'v1', choices: { necessary: true, analytics: false } }),
    );
    expect(screen.queryByRole('button', { name: 'Reject all' })).not.toBeInTheDocument();
  });

  it('saves per-category choices from the preferences', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    render(<ConsentHarness onSave={onSave} />);
    await user.click(screen.getByRole('button', { name: 'Manage cookies' }));
    const dialog = await screen.findByRole('dialog');
    const necessary = within(dialog).getByRole('switch', { name: /Necessary/ });
    expect(necessary).toBeChecked();
    expect(necessary).toHaveAttribute('aria-disabled', 'true');
    await user.click(within(dialog).getByRole('switch', { name: /Analytics/ }));
    await user.click(within(dialog).getByRole('button', { name: 'Save choices' }));
    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({ choices: { necessary: true, analytics: true } }),
    );
  });
});

describe('LegalPage', () => {
  it('shows the template notice, the date and a contents list linked to each section', () => {
    render(
      <LegalPage
        template
        title={PRIVACY_POLICY_TEMPLATE.title}
        lastUpdated="2026-03-04"
        sections={templateSections(PRIVACY_POLICY_TEMPLATE)}
        locale="en-GB"
      />,
    );
    expect(screen.getByText(/This is not legal advice/)).toBeInTheDocument();
    expect(screen.getByText(/4 March 2026/)).toBeInTheDocument();
    const firstTitle = PRIVACY_POLICY_TEMPLATE.sections[0]?.title ?? '';
    const [link] = screen.getAllByRole('link', { name: new RegExp(firstTitle) });
    const target = link?.getAttribute('href')?.slice(1) ?? '';
    expect(document.getElementById(target)).toHaveTextContent(firstTitle);
  });
});

describe('AnnouncementBar', () => {
  it('dismisses through a labelled button', async () => {
    const user = userEvent.setup();
    const onDismiss = vi.fn();
    render(<AnnouncementBar message="Close checklists are live" onDismiss={onDismiss} />);
    expect(screen.getByRole('complementary', { name: 'Announcement' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Dismiss announcement' }));
    expect(onDismiss).toHaveBeenCalledOnce();
  });
});

describe('motion twins', () => {
  it('render the same content as the plain blocks', () => {
    const stats = [
      { id: 'a', value: 1240, format: 'number' as const, label: 'teams', suffix: '+' },
    ];
    const { unmount } = render(<StatRow stats={stats} locale="en-GB" />);
    expect(screen.getByText('1,240+')).toBeInTheDocument();
    unmount();
    render(<moving.StatRow stats={stats} locale="en-GB" />);
    expect(screen.getAllByText('1,240+').length).toBeGreaterThan(0);
    expect(screen.getByText('teams')).toBeInTheDocument();
  });
});

describe('hero wash', () => {
  const hero = (container: HTMLElement) => container.querySelector('[data-slot="hero"]');

  it('keeps the accent wash by default and turns it off or neutral on request', () => {
    const { container, rerender } = render(<HeroCentered title="Ship it" />);
    expect(hero(container)?.className).toContain('from-accent-subtle');
    rerender(<HeroCentered title="Ship it" wash="none" />);
    expect(hero(container)?.className).not.toMatch(/from-|bg-linear/);
    rerender(<HeroCentered title="Ship it" wash="neutral" />);
    expect(hero(container)?.className).toContain('from-surface-sunken');
  });

  it('draws your backdrop behind the content, hidden from assistive technology', () => {
    const { container } = render(
      <HeroFloating
        title="Ship it"
        visual={<div />}
        cards={[]}
        wash="none"
        backdrop={<div data-testid="pattern" />}
      />,
    );
    const layer = screen.getByTestId('pattern').parentElement;
    expect(layer).toHaveAttribute('aria-hidden', 'true');
    expect(layer?.className).toContain('-z-10');
    expect(hero(container)?.className).not.toContain('from-accent-subtle');
  });

  it('gives the split hero and the cycling headline the same props', () => {
    const { container } = render(<HeroSplit title="Ship it" visual={<div />} wash="accent" />);
    expect(hero(container)?.className).toContain('from-accent-subtle');
    const cycle = render(<HeroWordCycle before="Close" words={['a', 'b']} wash="none" />);
    expect(hero(cycle.container)?.className).not.toContain('from-accent-subtle');
  });
});

describe('CookieConsent on a phone', () => {
  it('carries a short line for phones beside the full words, and Manage opens every choice', async () => {
    const user = userEvent.setup();
    render(
      <CookieConsent
        categories={CATEGORIES}
        version="v1"
        consent={null}
        onSave={vi.fn()}
        shortDescription="Only with your yes."
      />,
    );
    const region = screen.getByRole('region', { name: 'We use cookies' });
    expect(within(region).getByText('Only with your yes.')).toHaveClass('sm:hidden');
    expect(within(region).getByText(/Necessary cookies keep the site working/)).toHaveClass(
      'max-sm:hidden',
    );
    const manage = within(region).getByRole('button', { name: 'Manage cookies' });
    // Manage leads on a phone; reject and accept keep the same weight beside it.
    expect(manage.parentElement?.firstElementChild).toHaveTextContent('Reject all');
    await user.click(manage);
    expect(await screen.findByRole('dialog', { name: 'Cookie settings' })).toBeInTheDocument();
  });
});
