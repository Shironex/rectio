import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { ChatSourceChip, ChatSources, sourceSite } from './chat-source';

const POLICY = {
  id: 's1',
  title: 'Accounts payable policy',
  url: 'https://www.example.com/ap-policy',
  excerpt: 'Invoices over 5,000 need two approvers.',
};
const SOURCES = [POLICY, { id: 's2', title: 'Vendor master', url: 'javascript:alert(1)' }];

describe('ChatSource', () => {
  it('reads the site from an address', () => {
    expect(sourceSite('https://www.example.com/a')).toBe('example.com');
    expect(sourceSite('not a url')).toBeNull();
  });

  it('draws a citation chip that says what it cites and opens in a new tab', () => {
    render(<ChatSourceChip index={1} source={POLICY} />);
    const chip = screen.getByRole('link', { name: 'Source 1: Accounts payable policy' });
    expect(chip).toHaveAttribute('href', 'https://www.example.com/ap-policy');
    expect(chip).toHaveAttribute('target', '_blank');
    expect(chip).toHaveTextContent('1');
  });

  it('folds the list under a count and drops unsafe links', async () => {
    render(<ChatSources sources={SOURCES} />);
    const trigger = screen.getByRole('button', { name: '2 sources' });
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await userEvent.click(trigger);
    expect(screen.getByRole('link', { name: 'Accounts payable policy' })).toBeInTheDocument();
    expect(screen.getByText('Invoices over 5,000 need two approvers.')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Vendor master' })).not.toBeInTheDocument();
    expect(screen.getByText('Vendor master')).toBeInTheDocument();
  });

  it('renders nothing without sources', () => {
    const { container } = render(<ChatSources sources={[]} />);
    expect(container).toBeEmptyDOMElement();
  });
});
