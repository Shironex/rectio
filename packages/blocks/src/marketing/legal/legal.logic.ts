import { slugify } from '../lib/marketing';

/**
 * Starting structures for a privacy policy, terms of service and a cookie policy. They are
 * placeholders, not legal text: every bracketed value is yours to fill, and every section must be
 * rewritten for your business, your users and the law that applies to you, ideally with a lawyer.
 */
export const LEGAL_TEMPLATE_NOTICE =
  'Template: replace with your own legal text. This is not legal advice.';

export interface LegalTemplateSection {
  title: string;
  paragraphs: readonly string[];
  items?: readonly string[];
}

export interface LegalTemplate {
  title: string;
  intro: string;
  sections: readonly LegalTemplateSection[];
}

export const PRIVACY_POLICY_TEMPLATE: LegalTemplate = {
  title: 'Privacy policy',
  intro:
    'This policy explains what personal data [Company name] collects when you use [Product name], why we collect it, and the choices you have. Replace this paragraph with your own summary.',
  sections: [
    {
      title: 'Who we are',
      paragraphs: [
        '[Company name], [registered address], registration number [registration number], is the controller of the personal data described here. You can reach us at [privacy contact email].',
      ],
    },
    {
      title: 'Data we collect',
      paragraphs: ['Describe each kind of data you collect and where it comes from. For example:'],
      items: [
        'Account details you give us, such as [name, work email, company].',
        'Data you add to the product, such as [describe customer content].',
        'Usage data collected automatically, such as [pages viewed, device, approximate location].',
      ],
    },
    {
      title: 'Why we use it',
      paragraphs: [
        'For each purpose, name the legal basis you rely on, such as performance of a contract, legitimate interests or consent. Replace with your own purposes and bases.',
      ],
      items: [
        '[Purpose of processing], on the basis of [legal basis].',
        '[Purpose of processing], on the basis of [legal basis].',
      ],
    },
    {
      title: 'Who we share it with',
      paragraphs: [
        'List the categories of processors and recipients, such as [hosting provider, email provider, payment processor], and where they are located.',
      ],
    },
    {
      title: 'How long we keep it',
      paragraphs: [
        'State a retention period or the criteria for one, for each kind of data: [retention period].',
      ],
    },
    {
      title: 'Your rights',
      paragraphs: [
        'Describe the rights your users have under the law that applies to them, such as access, correction, deletion, restriction, portability and objection, how to use them, and their right to complain to [supervisory authority].',
      ],
    },
    {
      title: 'Changes to this policy',
      paragraphs: [
        'Say how you will tell users about changes, for example by email or a notice in the product, and update the date at the top of this page.',
      ],
    },
  ],
};

export const TERMS_TEMPLATE: LegalTemplate = {
  title: 'Terms of service',
  intro:
    'These terms govern your use of [Product name], provided by [Company name]. Replace this paragraph with your own summary of who the terms apply to.',
  sections: [
    {
      title: 'Accepting these terms',
      paragraphs: [
        'Explain how a customer accepts the terms, for example by creating an account, and who may accept them on behalf of an organisation.',
      ],
    },
    {
      title: 'Your account',
      paragraphs: [
        'Describe the customer’s responsibilities for their account, such as keeping credentials safe and the accuracy of the information they give.',
      ],
    },
    {
      title: 'Plans, fees and payment',
      paragraphs: [
        'Set out how plans are billed, when fees are due, taxes, renewals and what happens if a payment fails: [your billing terms].',
      ],
    },
    {
      title: 'Acceptable use',
      paragraphs: ['List what customers must not do with the service. For example:'],
      items: ['[Prohibited use].', '[Prohibited use].', '[Prohibited use].'],
    },
    {
      title: 'Customer data',
      paragraphs: [
        'State who owns the data customers add, the licence you need to provide the service, and where your data processing terms live: [link to your terms].',
      ],
    },
    {
      title: 'Liability',
      paragraphs: [
        'Your limitation of liability and any warranties or disclaimers. This section needs a lawyer: [your liability terms].',
      ],
    },
    {
      title: 'Ending the agreement',
      paragraphs: [
        'Explain how either party can end the agreement, notice periods, and what happens to customer data afterwards.',
      ],
    },
    {
      title: 'Governing law',
      paragraphs: [
        'These terms are governed by the laws of [your jurisdiction]. Courts of [your city] have jurisdiction.',
      ],
    },
  ],
};

export const COOKIE_POLICY_TEMPLATE: LegalTemplate = {
  title: 'Cookie policy',
  intro:
    'This policy explains how [Product name] uses cookies and similar technologies, and how you can choose which ones we use. Replace this paragraph with your own summary.',
  sections: [
    {
      title: 'What cookies are',
      paragraphs: [
        'Cookies are small files a site stores in your browser. Similar technologies, such as local storage, work the same way for the purposes of this policy.',
      ],
    },
    {
      title: 'Cookies we use',
      paragraphs: [
        'List every cookie or group of cookies, what it does, who sets it and how long it lasts:',
      ],
      items: [
        'Necessary: [cookie name], set by [who sets it], keeps you signed in. Lasts [how long].',
        'Analytics: [cookie name], set by [who sets it], counts visits. Lasts [how long].',
        'Marketing: [cookie name], set by [who sets it], measures campaigns. Lasts [how long].',
      ],
    },
    {
      title: 'Your choices',
      paragraphs: [
        'Necessary cookies are always on because the site does not work without them. Every other category is off until you allow it, and you can change your choice at any time from the Cookie settings link in the footer.',
      ],
    },
    {
      title: 'Changes to this policy',
      paragraphs: [
        'Say how you will tell users about changes and update the date at the top of this page.',
      ],
    },
  ],
};

export interface TocEntry {
  id: string;
  title: string;
}

/**
 * Ids for a page's section headings, from their titles, made unique: a second "Overview" becomes
 * "overview-2", so every link in the table of contents lands on its own section.
 */
export function tableOfContents(titles: readonly string[]): TocEntry[] {
  const seen = new Map<string, number>();
  return titles.map((title) => {
    const base = slugify(title) || 'section';
    const count = (seen.get(base) ?? 0) + 1;
    seen.set(base, count);
    return { id: count === 1 ? base : `${base}-${String(count)}`, title };
  });
}
