import { ArAging, CashFlowChart, KpiRow } from '@rectio/blocks';
import * as plain from '@rectio/blocks/marketing';
import { saveConsent, type ConsentRecord } from '@rectio/blocks/marketing';
import * as moving from '@rectio/blocks/marketing/motion';
import { Button, ThemeScope } from '@rectio/ui';
import { useState, type ReactNode } from 'react';

import * as financeData from '../blocks/data';
import { usePageCanvas } from '../page-canvas';
import type { Mode, ThemeId } from '../themes';
import { Brand, CUSTOMER_LOGOS } from './brand';
import * as copy from './content';
import {
  AgingSummary,
  ApprovalCard,
  ApprovalQueue,
  CashCard,
  CloseCalendar,
  CloseChecklist,
  ExactAmount,
  InvoiceChase,
  PaidCard,
  SpendCard,
} from './visuals';

type Blocks = typeof plain;

export const MARKETING_BLOCKS = [
  'announcement-bar',
  'site-header',
  'hero',
  'logo-strip',
  'feature-grid',
  'stat-row',
  'testimonials',
  'faq',
  'cta-band',
  'newsletter',
  'team',
  'contact',
  'blog',
  'site-footer',
  'legal',
  'cookie-consent',
] as const;
export type MarketingBlockName = (typeof MARKETING_BLOCKS)[number];

const EN = financeData.LOCALES['en-GB'];
const subscribe = () => new Promise<void>((resolve) => setTimeout(resolve, 600));
const CONSENT_KEY = 'northlake-consent';
const CONSENT_VERSION = '2026-03';

const { Em } = plain;

function cashFlowVisual() {
  return (
    <CashFlowChart
      currency={EN.currency}
      locale={EN.locale}
      points={financeData.cashFlow(EN.rate)}
      className="border-0"
    />
  );
}

/** The landing template: every marketing block composed into one product page. */
function Landing({ blocks }: { blocks: Blocks }) {
  const [consent, setConsent] = useState<ConsentRecord | null>(null);
  const [announcement, setAnnouncement] = useState(true);
  return (
    <>
      {announcement && (
        <blocks.AnnouncementBar
          tag="New"
          message="Close checklists: every month-end task in one view"
          action={{ label: 'Read the changelog', href: '#changelog' }}
          onDismiss={() => {
            setAnnouncement(false);
          }}
        />
      )}
      <blocks.SiteHeader
        brand={<Brand />}
        brandLabel="Northlake home"
        links={copy.NAV}
        currentHref="#product"
        primary={copy.START}
        secondary={copy.SIGN_IN}
      />
      <main>
        <blocks.HeroFloating
          title={
            <>
              Month end, <Em>closed in days</Em> instead of weeks
            </>
          }
          description="Invoices, approvals and the ledger in one calm workspace, so your team closes on time."
          primary={copy.START}
          secondary={copy.DEMO}
          visual={cashFlowVisual()}
          cards={[
            { id: 'approved', position: 'top-start', content: <ApprovalCard /> },
            { id: 'cash', position: 'top-end', content: <CashCard /> },
            { id: 'paid', position: 'bottom-end', content: <PaidCard /> },
          ]}
        />
        <blocks.LogoStrip
          title="Finance teams at these companies close on Northlake"
          logos={CUSTOMER_LOGOS}
          variant="marquee"
        />
        <blocks.FeatureBento
          eyebrow="Product"
          title={
            <>
              Everything month end needs, <Em>working together</Em>
            </>
          }
          description="Each tile below is the real product: approve an expense, tick off a task, type an amount."
          items={[
            {
              id: 'approvals',
              title: 'Approvals that keep moving',
              description: 'Spend goes to the right person with their limit attached.',
              size: 'wide',
              tone: 'tinted',
              visual: <ApprovalQueue />,
            },
            {
              id: 'exact',
              title: 'Every figure, exact',
              description: 'Amounts format as you type, VAT per rate.',
              visual: <ExactAmount />,
            },
            {
              id: 'calendar',
              title: 'Plan the close',
              description: 'Deadlines for every entity on one calendar.',
              size: 'tall',
              tone: 'sunken',
              visual: <CloseCalendar />,
            },
            {
              id: 'checklist',
              title: 'Checklists that finish',
              visual: <CloseChecklist />,
            },
            {
              id: 'aging',
              title: 'Receivables at a glance',
              visual: <AgingSummary />,
            },
            {
              id: 'kpis',
              title: 'Figures your board reads first',
              description: 'Live from the ledger, with the change in words.',
              size: 'wide',
              tone: 'tinted',
              visual: (
                <KpiRow
                  currency={EN.currency}
                  locale={EN.locale}
                  kpis={financeData.kpis(EN.rate).slice(0, 2)}
                  comparison="vs February"
                />
              ),
            },
          ]}
        />
        <blocks.StatRow
          lead={
            <>
              Teams close <Em>faster</Em> on Northlake, and they stay closed.
            </>
          }
          stats={copy.STATS}
          locale="en-GB"
          tone="panel"
        />
        <blocks.FeatureRows
          rows={[
            {
              id: 'invoices',
              title: 'Invoices that chase themselves',
              description:
                'Overdue invoices get a polite reminder on the schedule you set, and payments match as they land.',
              points: [
                'Reminders per customer',
                'Bank matching as payments land',
                'Credit notes in two clicks',
              ],
              action: { label: 'See invoicing', href: '#invoices' },
              visual: <InvoiceChase />,
            },
            {
              id: 'aging',
              title: 'Know who owes what, and for how long',
              description:
                'Receivables by age and customer, so the right call happens before the quarter ends.',
              points: ['Aging by customer', 'One click to the open invoices'],
              action: { label: 'See reporting', href: '#reporting' },
              visual: (
                <ArAging
                  currency={EN.currency}
                  locale={EN.locale}
                  receivables={financeData.receivables(EN.rate)}
                  today={financeData.TODAY}
                  customerLimit={3}
                />
              ),
            },
          ]}
        />
        <blocks.TestimonialGrid
          eyebrow="Customers"
          title={
            <>
              Finance teams that <Em>stopped working weekends</Em>
            </>
          }
          testimonials={copy.TESTIMONIALS.slice(0, 5)}
        />
        <blocks.Faq
          title="Questions, answered"
          description="Anything else? Our team replies within a working day."
          items={copy.FAQ}
          defaultOpen={['f1']}
          aside={
            <plain.ActionLink
              action={{ label: 'Talk to us', href: '#contact' }}
              variant="secondary"
              size="md"
              arrow
            />
          }
        />
        <blocks.CtaBand
          layout="split"
          title="Close your next month in days"
          description="Start free with your own data. No card, and your export is always one click away."
          primary={copy.START}
          secondary={copy.DEMO}
        />
      </main>
      <blocks.SiteFooter
        brand={<Brand />}
        brandLabel="Northlake home"
        tagline="Finance operations for teams that close on time."
        columns={copy.FOOTER_COLUMNS}
        legal={copy.LEGAL_LINKS}
        social={copy.SOCIAL}
        copyright="© 2026 Northlake AS"
        extra={
          <blocks.Newsletter
            layout="compact"
            title="The month-end letter"
            description="One email a month with a checklist that works."
            onSubscribe={subscribe}
          />
        }
      />
      <blocks.CookieConsent
        categories={copy.COOKIE_CATEGORIES}
        version={CONSENT_VERSION}
        consent={consent}
        policyHref="#cookies"
        onSave={(record) => {
          setConsent(record);
          try {
            saveConsent(window.localStorage, CONSENT_KEY, record);
          } catch {
            // Storage blocked: the choice still holds for this visit.
          }
        }}
      />
    </>
  );
}

function Labelled({ name, children }: { name: string; children: ReactNode }) {
  return (
    <div className="border-b border-dashed border-line-strong">
      <p className="mx-auto max-w-7xl px-4 pt-6 font-mono text-xs text-fg-subtle sm:px-8">{name}</p>
      {children}
    </div>
  );
}

function CookieGallery({ blocks }: { blocks: Blocks }) {
  const [open, setOpen] = useState(false);
  const [consent, setConsent] = useState<ConsentRecord | null>(null);
  return (
    <plain.Section label="Cookie consent">
      <div className="flex flex-col items-start gap-4">
        <p className="text-base text-fg-muted">
          {consent === null ? 'No decision yet.' : `Saved: ${JSON.stringify(consent.choices)}`}
        </p>
        <Button
          variant="secondary"
          onClick={() => {
            setOpen(true);
          }}
        >
          Cookie settings
        </Button>
      </div>
      <blocks.CookiePreferences
        open={open}
        onOpenChange={setOpen}
        categories={copy.COOKIE_CATEGORIES}
        version={CONSENT_VERSION}
        consent={consent}
        policyHref="#cookies"
        onSave={setConsent}
      />
      <blocks.CookieConsent
        categories={copy.COOKIE_CATEGORIES}
        version={CONSENT_VERSION}
        consent={consent}
        policyHref="#cookies"
        onSave={setConsent}
      />
    </plain.Section>
  );
}

/** Every variant of one block, for its docs and for the design rounds. */
function Gallery({
  name,
  blocks,
  doc,
}: {
  name: MarketingBlockName;
  blocks: Blocks;
  doc: string | null;
}) {
  switch (name) {
    case 'announcement-bar':
      return (
        <>
          <Labelled name="subtle">
            <blocks.AnnouncementBar
              tag="New"
              message="Close checklists: every month-end task in one view"
              action={{ label: 'Read the changelog', href: '#changelog' }}
              onDismiss={() => undefined}
            />
          </Labelled>
          <Labelled name="accent">
            <blocks.AnnouncementBar
              tone="accent"
              tag="v4.2"
              message="Multi-entity consolidation is live for every plan"
              action={{ label: 'What changed', href: '#changelog' }}
            />
          </Labelled>
        </>
      );
    case 'site-header':
      return (
        <blocks.SiteHeader
          brand={<Brand />}
          brandLabel="Northlake home"
          links={copy.NAV}
          currentHref="#product"
          primary={copy.START}
          secondary={copy.SIGN_IN}
          sticky={false}
        />
      );
    case 'hero':
      return (
        <>
          <Labelled name="HeroWordCycle">
            <blocks.HeroWordCycle
              before="Close the books on"
              words={['invoices', 'payouts', 'approvals', 'accruals']}
              description="One workspace for the whole month end, from the first invoice to the last journal."
              primary={copy.START}
              secondary={copy.DEMO}
              visual={
                <KpiRow
                  currency={EN.currency}
                  locale={EN.locale}
                  kpis={financeData.kpis(EN.rate)}
                  comparison="vs February"
                />
              }
            />
          </Labelled>
          <Labelled name="HeroSplit">
            <blocks.HeroSplit
              eyebrow="Accounts receivable"
              title={
                <>
                  Get paid <Em>on time</Em>, every time
                </>
              }
              description="Reminders, matching and aging in one place, so cash arrives when you planned it."
              primary={copy.START}
              secondary={copy.DEMO}
              visual={
                <ArAging
                  currency={EN.currency}
                  locale={EN.locale}
                  receivables={financeData.receivables(EN.rate)}
                  today={financeData.TODAY}
                />
              }
            />
          </Labelled>
          <Labelled name="HeroCentered">
            <blocks.HeroCentered
              title={
                <>
                  The finance workspace that <Em>closes on time</Em>
                </>
              }
              description="Invoices, approvals and the ledger, in one calm place."
              primary={copy.START}
              secondary={copy.DEMO}
              visual={cashFlowVisual()}
            />
          </Labelled>
          <Labelled name="HeroFloating">
            <blocks.HeroFloating
              title={
                <>
                  Month end, <Em>closed in days</Em> instead of weeks
                </>
              }
              description="Invoices, approvals and the ledger in one calm workspace."
              primary={copy.START}
              visual={cashFlowVisual()}
              cards={[
                { id: 'approved', position: 'top-start', content: <ApprovalCard /> },
                { id: 'spend', position: 'bottom-start', content: <SpendCard /> },
                { id: 'paid', position: 'bottom-end', content: <PaidCard /> },
              ]}
            />
          </Labelled>
        </>
      );
    case 'logo-strip':
      return (
        <>
          <Labelled name="static">
            <blocks.LogoStrip
              title="Trusted by finance teams at"
              logos={CUSTOMER_LOGOS.slice(0, 6)}
            />
          </Labelled>
          <Labelled name="marquee">
            <blocks.LogoStrip logos={CUSTOMER_LOGOS} variant="marquee" />
          </Labelled>
        </>
      );
    case 'feature-grid':
      return (
        <>
          <Labelled name="FeatureIconGrid">
            <blocks.FeatureIconGrid
              title="Built for the whole finance team"
              description="From the first invoice to the board pack."
              features={copy.ICON_FEATURES}
            />
          </Labelled>
          <Labelled name="FeatureRows">
            <blocks.FeatureRows
              title="Month end, step by step"
              rows={[
                {
                  id: 'approvals',
                  title: 'Approvals in one queue',
                  description: 'Every request with its receipt, its limit and its history.',
                  points: ['Limits per team', 'Bulk approve', 'Reasons on rejection'],
                  visual: <ApprovalQueue />,
                },
                {
                  id: 'checklist',
                  title: 'A checklist for every close',
                  description: 'The same tasks every month, assigned and tracked.',
                  visual: <CloseChecklist />,
                },
              ]}
            />
          </Labelled>
          <Labelled name="FeatureBento">
            <blocks.FeatureBento
              title="Everything in one place"
              items={[
                {
                  id: 'a',
                  title: 'Approvals',
                  size: 'wide',
                  tone: 'tinted',
                  visual: <ApprovalQueue />,
                },
                { id: 'b', title: 'Exact amounts', visual: <ExactAmount /> },
                { id: 'c', title: 'Receivables', visual: <AgingSummary /> },
                { id: 'd', title: 'Checklists', visual: <CloseChecklist /> },
                { id: 'e', title: 'Spend', tone: 'sunken', visual: <SpendCard /> },
              ]}
            />
          </Labelled>
        </>
      );
    case 'stat-row':
      return (
        <>
          <Labelled name="with lead">
            <blocks.StatRow
              lead={
                <>
                  Teams close <Em>faster</Em> on Northlake
                </>
              }
              stats={copy.STATS}
              locale="en-GB"
            />
          </Labelled>
          <Labelled name="plain">
            <blocks.StatRow
              stats={[
                ...copy.STATS,
                {
                  id: 'uptime',
                  value: 0.9995,
                  format: 'percent',
                  fractionDigits: 2,
                  label: 'uptime over the last year',
                },
              ]}
              locale="en-GB"
              tone="tinted"
            />
          </Labelled>
        </>
      );
    case 'testimonials':
      return (
        <>
          <Labelled name="TestimonialQuote">
            <blocks.TestimonialQuote
              testimonial={copy.FEATURED_QUOTE}
              metric={{ value: '−34%', label: 'receivables over 60 days, in one quarter' }}
            />
          </Labelled>
          <Labelled name="TestimonialGrid">
            <blocks.TestimonialGrid
              title="Finance teams on Northlake"
              testimonials={copy.TESTIMONIALS}
            />
          </Labelled>
          <Labelled name="TestimonialMarquee">
            <blocks.TestimonialMarquee
              title="Loved at month end"
              testimonials={copy.TESTIMONIALS}
            />
          </Labelled>
        </>
      );
    case 'faq':
      return (
        <>
          <Labelled name="accordion">
            <blocks.Faq title="Questions, answered" items={copy.FAQ} defaultOpen={['f1']} />
          </Labelled>
          <Labelled name="numbered">
            <blocks.Faq
              variant="numbered"
              title="Before you start"
              description="The five things teams ask in their first call."
              items={copy.FAQ}
              tone="tinted"
            />
          </Labelled>
        </>
      );
    case 'cta-band':
      return (
        <>
          <Labelled name="accent, centered">
            <blocks.CtaBand
              title="Close your next month in days"
              description="Start free with your own data."
              primary={copy.START}
              secondary={copy.DEMO}
            />
          </Labelled>
          <Labelled name="tinted, split">
            <blocks.CtaBand
              tone="tinted"
              layout="split"
              title="See it with your own numbers"
              description="A 30 minute call with someone who has run a month end."
              primary={copy.DEMO}
            />
          </Labelled>
        </>
      );
    case 'newsletter':
      return (
        <>
          <Labelled name="band">
            <blocks.Newsletter
              title="The month-end letter"
              description="One email a month with a checklist that works. No tracking pixels."
              note="Unsubscribe with one click, any time."
              onSubscribe={subscribe}
            />
          </Labelled>
          <Labelled name="compact">
            <div className="mx-auto max-w-sm px-4 py-10">
              <blocks.Newsletter layout="compact" title="Get the letter" onSubscribe={subscribe} />
            </div>
          </Labelled>
        </>
      );
    case 'team':
      return (
        <blocks.Team
          eyebrow="About"
          title={
            <>
              People who have <Em>done a month end</Em>
            </>
          }
          description="We started Northlake after one close too many on spreadsheets."
          values={copy.VALUES}
          members={copy.TEAM}
        />
      );
    case 'contact':
      return (
        <blocks.ContactSection
          title="Talk to us"
          description="Questions about plans, migration or security? We reply within one working day."
          channels={copy.CHANNELS}
          topics={[
            { value: 'sales', label: 'Plans and pricing' },
            { value: 'migration', label: 'Moving from another tool' },
            { value: 'security', label: 'Security review' },
          ]}
          consentLabel="I agree that Northlake may contact me about this request."
          onSubmit={subscribe}
        />
      );
    case 'blog':
      return doc === 'article' ? (
        <blocks.ArticleLayout
          title="How Halden closed March in four days"
          description="A finance team of five, three entities and one rule: nothing waits for the last day."
          tag="Customer story"
          date="2026-03-12"
          readingMinutes={7}
          author={{ name: 'Leila Haddad', role: 'Customer success' }}
          back={{ label: 'All articles', href: '#blog' }}
          headings={[
            { id: 'before', title: 'Before Northlake' },
            { id: 'checklist', title: 'The checklist' },
            { id: 'results', title: 'What changed' },
          ]}
          locale="en-GB"
        >
          <p>
            Halden & Co runs three entities from one finance team of five. A year ago their close
            took eleven working days and two weekends.
          </p>
          <h2 id="before">Before Northlake</h2>
          <p>
            Approvals lived in email, invoices in a separate tool and the checklist in a shared
            spreadsheet that nobody trusted after the fifteenth.
          </p>
          <blockquote>
            <p>
              “We spent the first week of every month finding out what had happened in the last
              one.”
            </p>
          </blockquote>
          <h2 id="checklist">The checklist</h2>
          <ol>
            <li>Bank reconciliation daily, not monthly.</li>
            <li>Accruals posted on the 25th and reversed on the 1st.</li>
            <li>Intercompany matched before anyone asks.</li>
          </ol>
          <h2 id="results">What changed</h2>
          <p>
            March closed in <strong>four days</strong>. The team now spends the second week on
            analysis instead of reconciliation.
          </p>
        </blocks.ArticleLayout>
      ) : (
        <>
          <Labelled name="grid">
            <blocks.ArticleList
              title="From the blog"
              articles={copy.ARTICLES.map((article, index) => ({
                ...article,
                cover: <ArticleCover index={index} />,
              }))}
              viewAll={{ label: 'All articles', href: '#blog' }}
              locale="en-GB"
            />
          </Labelled>
          <Labelled name="list">
            <blocks.ArticleList
              layout="list"
              title="Latest writing"
              articles={copy.ARTICLES}
              locale="en-GB"
            />
          </Labelled>
        </>
      );
    case 'site-footer':
      return (
        <>
          <Labelled name="columns">
            <blocks.SiteFooter
              brand={<Brand />}
              brandLabel="Northlake home"
              tagline="Finance operations for teams that close on time."
              columns={copy.FOOTER_COLUMNS}
              legal={copy.LEGAL_LINKS}
              social={copy.SOCIAL}
              copyright="© 2026 Northlake AS"
            />
          </Labelled>
          <Labelled name="minimal">
            <blocks.SiteFooter
              layout="minimal"
              brand={<Brand />}
              brandLabel="Northlake home"
              legal={copy.LEGAL_LINKS}
              social={copy.SOCIAL}
              copyright="© 2026 Northlake AS"
            />
          </Labelled>
        </>
      );
    case 'legal': {
      const template =
        doc === 'terms'
          ? plain.TERMS_TEMPLATE
          : doc === 'cookies'
            ? plain.COOKIE_POLICY_TEMPLATE
            : plain.PRIVACY_POLICY_TEMPLATE;
      return (
        <blocks.LegalPage
          template
          title={template.title}
          intro={template.intro}
          lastUpdated="2026-03-04"
          sections={plain.templateSections(template)}
          contact={
            <p>
              Questions about this page? Write to{' '}
              <a href="mailto:privacy@northlake.example">privacy@northlake.example</a>.
            </p>
          }
          locale="en-GB"
        />
      );
    }
    case 'cookie-consent':
      return <CookieGallery blocks={blocks} />;
  }
}

const COVER_TONES = [
  'from-accent-subtle to-surface-sunken',
  'from-positive-subtle to-surface-sunken',
  'from-info-subtle to-surface-sunken',
  'from-warning-subtle to-surface-sunken',
];

/** A cover made of the product itself: a tinted panel holding one live card. */
function ArticleCover({ index }: { index: number }) {
  const card = [
    <CashCard key="c" />,
    <ApprovalCard key="a" />,
    <SpendCard key="s" />,
    <PaidCard key="p" />,
  ][index % 4];
  return (
    <div
      className={`flex size-full items-center justify-center bg-linear-to-br p-6 ${COVER_TONES[index % 4] ?? ''}`}
    >
      <div className="w-full max-w-64 rounded-panel border border-line bg-surface-raised p-4 shadow-overlay">
        {card}
      </div>
    </div>
  );
}

function readParams(search: string) {
  const params = new URLSearchParams(search);
  const block = MARKETING_BLOCKS.find((name) => name === params.get('block'));
  return { block, doc: params.get('doc') };
}

export function MarketingPage({
  theme,
  mode,
  motion,
}: {
  theme: ThemeId;
  mode: Mode;
  motion: boolean;
}) {
  const { block, doc } = readParams(window.location.search);
  const blocks: Blocks = motion ? moving : plain;
  const canvas = usePageCanvas(theme, mode);
  return (
    <ThemeScope
      ref={canvas}
      theme={theme}
      mode={mode}
      className="min-h-dvh bg-surface-canvas text-fg"
    >
      {block === undefined ? (
        <Landing blocks={blocks} />
      ) : (
        <Gallery name={block} blocks={blocks} doc={doc} />
      )}
    </ThemeScope>
  );
}
