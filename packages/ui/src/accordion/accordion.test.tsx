import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { Accordion, AccordionItem, AccordionPanel, AccordionTrigger } from './accordion';

function Faq(props: { multiple?: boolean }) {
  return (
    <Accordion multiple={props.multiple}>
      <AccordionItem value="vat">
        <AccordionTrigger>How is VAT worked out?</AccordionTrigger>
        <AccordionPanel>Per line, at the line's rate.</AccordionPanel>
      </AccordionItem>
      <AccordionItem value="fx">
        <AccordionTrigger hint="2 rates">Which exchange rate applies?</AccordionTrigger>
        <AccordionPanel>The rate on the invoice date.</AccordionPanel>
      </AccordionItem>
    </Accordion>
  );
}

describe('Accordion', () => {
  it('opens a section from its header button inside a heading', async () => {
    render(<Faq />);
    const trigger = screen.getByRole('button', { name: 'How is VAT worked out?' });
    expect(trigger.closest('h3')).not.toBeNull();
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await userEvent.click(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText("Per line, at the line's rate.")).toBeVisible();
  });

  it('keeps one open at a time', async () => {
    render(<Faq />);
    const first = screen.getByRole('button', { name: 'How is VAT worked out?' });
    const second = screen.getByRole('button', { name: /Which exchange rate/ });
    await userEvent.click(first);
    second.focus();
    await userEvent.keyboard('{Enter}');
    await waitFor(() => {
      expect(first).toHaveAttribute('aria-expanded', 'false');
    });
    expect(second).toHaveAttribute('aria-expanded', 'true');
  });
});
