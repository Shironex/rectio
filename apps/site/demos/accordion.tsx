'use client';

import { Accordion, AccordionItem, AccordionPanel, AccordionTrigger } from '@rectio/ui';

export default function AccordionDemo() {
  return (
    <Accordion defaultValue={['vat']} className="max-w-lg">
      <AccordionItem value="vat">
        <AccordionTrigger>How is VAT worked out on an invoice?</AccordionTrigger>
        <AccordionPanel>
          Per line, at the rate set on the line, then summed by rate. Rounding happens once per
          rate.
        </AccordionPanel>
      </AccordionItem>
      <AccordionItem value="fx">
        <AccordionTrigger>Which exchange rate applies?</AccordionTrigger>
        <AccordionPanel>
          The central bank rate published on the day before the invoice date.
        </AccordionPanel>
      </AccordionItem>
      <AccordionItem value="lock">
        <AccordionTrigger>Can a closed period be reopened?</AccordionTrigger>
        <AccordionPanel>
          Only by an owner, and every change is kept in the audit trail.
        </AccordionPanel>
      </AccordionItem>
    </Accordion>
  );
}
