import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Avatar, identityTint, initials } from './avatar';

describe('initials', () => {
  it('takes the first and last word, whole characters, upper case', () => {
    expect(initials('Ana María Ruiz')).toBe('AR');
    expect(initials('  treasury  ')).toBe('T');
    expect(initials('Émile Zola')).toBe('ÉZ');
    expect(initials('Ana Ruiz', 1)).toBe('A');
  });
});

describe('identityTint', () => {
  it('gives a name the same tint every time, whatever the case and spacing', () => {
    expect(identityTint('Ana Ruiz')).toBe(identityTint(' ana ruiz '));
    expect(identityTint('Ana Ruiz')).toBeGreaterThanOrEqual(0);
    expect(identityTint('Ana Ruiz')).toBeLessThan(6);
  });
});

describe('Avatar', () => {
  it('is one image named by the person, with initials when there is no photo', () => {
    render(<Avatar name="Ewan Burke" />);
    const avatar = screen.getByRole('img', { name: 'Ewan Burke' });
    expect(avatar).toHaveTextContent('EB');
  });

  it('says the status in the name, not only with the dot', () => {
    render(<Avatar name="Lena Fischer" status="busy" />);
    const avatar = screen.getByRole('img', { name: 'Lena Fischer, busy' });
    expect(avatar).toHaveAttribute('data-status', 'busy');
    render(<Avatar name="Ivo Petrov" status="away" statusLabel="back at 14:00" />);
    expect(screen.getByRole('img', { name: 'Ivo Petrov, back at 14:00' })).toBeInTheDocument();
  });

  it('draws square corners for teams', () => {
    render(<Avatar name="Treasury" square size="lg" />);
    expect(screen.getByRole('img', { name: 'Treasury' })).toHaveClass('rounded-panel');
  });
});
