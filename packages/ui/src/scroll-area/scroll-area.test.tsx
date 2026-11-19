import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ScrollArea } from './scroll-area';

describe('ScrollArea', () => {
  it('names its viewport as a region when labelled', () => {
    render(
      <ScrollArea label="Recent activity" className="h-40">
        <p>Row</p>
      </ScrollArea>,
    );
    expect(screen.getByRole('region', { name: 'Recent activity' })).toHaveTextContent('Row');
  });

  it('is a plain scroller without a label', () => {
    render(
      <ScrollArea orientation="horizontal">
        <p>Wide</p>
      </ScrollArea>,
    );
    expect(screen.queryByRole('region')).not.toBeInTheDocument();
    expect(screen.getByText('Wide')).toBeInTheDocument();
  });
});
