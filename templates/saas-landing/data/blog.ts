/**
 * The blog: summaries for the index and each article's body as plain data, so the posts can move
 * to a CMS or MDX later without touching the pages. Authors, companies and figures are invented.
 */

export type ArticleBlock =
  | { type: 'p'; text: string }
  | { type: 'h2'; id: string; text: string }
  | { type: 'ul' | 'ol'; items: readonly string[] }
  | { type: 'quote'; text: string; cite: string };

export interface Article {
  slug: string;
  title: string;
  excerpt: string;
  /** ISO date. */
  date: string;
  author: { name: string; role: string };
  tag: 'Customer story' | 'Guide' | 'Product';
  /** Which product card the cover shows. */
  cover: 'swap' | 'published' | 'coverage' | 'request';
  body: readonly ArticleBlock[];
}

export const ARTICLES: readonly Article[] = [
  {
    slug: 'harbour-street-rota-by-thursday',
    title: 'How Harbour Street gets the rota out by Thursday',
    excerpt:
      'Two cafés, nineteen people and one rule: the week is published before the weekend. Here is the routine that makes it stick.',
    date: '2026-11-04',
    author: { name: 'Mira Castellanos', role: 'Customer success' },
    tag: 'Customer story',
    cover: 'published',
    body: [
      {
        type: 'p',
        text: 'Harbour Street runs two cafés on the same street with nineteen people between them. A year ago the rota went out on Sunday night, after a weekend of messages about who could cover what.',
      },
      { type: 'h2', id: 'before', text: 'Before Rostra' },
      {
        type: 'p',
        text: 'Availability lived in a group chat, the rota in a spreadsheet and swaps in private messages. Hannah Okoye, the general manager, spent most of Sunday afternoon rebuilding the week by hand.',
      },
      {
        type: 'quote',
        text: 'By the time the rota was out, half of it had already changed.',
        cite: 'Hannah Okoye, general manager',
      },
      { type: 'h2', id: 'routine', text: 'The Thursday routine' },
      {
        type: 'p',
        text: 'The team now works to three dates every week, and the app reminds everyone of each one.',
      },
      {
        type: 'ol',
        items: [
          'Monday: availability for the week after next closes.',
          'Wednesday: Hannah copies last week, fixes the gaps the coverage line flags and posts the rest as open shifts.',
          'Thursday: the rota is published and everyone gets their shifts on their phone.',
        ],
      },
      {
        type: 'p',
        text: 'Wednesday is the only day the rota is edited by hand. Anything that changes after Thursday goes through a swap or an open shift, so the published week stays the week people plan their lives around.',
      },
      { type: 'h2', id: 'gaps', text: 'Filling the gaps' },
      {
        type: 'p',
        text: 'Saturdays were always the hard day. Instead of asking around, Hannah now posts the short shifts on the open shift board on Wednesday with the weekend rate attached. Most are claimed within the hour, usually by the same three people who like the extra hours.',
      },
      {
        type: 'p',
        text: 'To keep it fair, nobody can claim more than two open shifts a week, and the weekend balance on each profile shows who has carried more than their share lately.',
      },
      {
        type: 'quote',
        text: "The board did what the group chat never could: it made a gap somebody's job in under an hour.",
        cite: 'Kofi Mensah, shift lead',
      },
      {
        type: 'p',
        text: 'None of this needed new staff or a new budget. It needed one fixed day for planning, a board everyone trusted, and a manager who stopped being the switchboard for every change. Hannah says the hardest part was the first month, when people still messaged her out of habit and she had to point them to the app instead of fixing it herself.',
      },
      {
        type: 'p',
        text: 'By the second month the messages had stopped. The kitchen started posting its own gaps, and the front desk began trading shifts among themselves, with Hannah approving from the bus on her way in.',
      },
      { type: 'h2', id: 'results', text: 'What changed' },
      {
        type: 'p',
        text: 'The rota has gone out on Thursday for thirty weeks in a row. Swaps happen in the app with Hannah approving them in a tap, and late cancellations have fallen by more than half.',
      },
      {
        type: 'ul',
        items: [
          'Rota published four days earlier, every week',
          'Late cancellations down from nine a month to four',
          'Sunday afternoons back for the manager',
        ],
      },
    ],
  },
  {
    slug: 'fair-weekends',
    title: 'Fair weekends: one simple rule that keeps people',
    excerpt:
      'Uneven weekends are the quiet reason good people leave shift work. A rule you can apply this week, and how to show it is working.',
    date: '2026-10-21',
    author: { name: 'Jonas Adeyemi', role: 'Head of product' },
    tag: 'Guide',
    cover: 'coverage',
    body: [
      {
        type: 'p',
        text: 'Ask people who left a shift job why they went, and weekends come up more than pay. Not working weekends at all is rarely possible; working them fairly almost always is.',
      },
      {
        type: 'p',
        text: 'The trouble is that unfairness builds slowly. One extra Saturday here, a swap there, and after two months the same four people have carried most of the weekends while everyone else barely noticed. The people carrying them noticed, and they are the ones who start looking at other jobs.',
      },
      {
        type: 'p',
        text: 'Most managers we spoke to did not set out to be unfair. They filled weekends with whoever said yes first, and the people who said yes first kept being asked.',
      },
      { type: 'h2', id: 'rule', text: 'The rule' },
      {
        type: 'p',
        text: 'Nobody works more than two weekends in a row unless they asked to. Write it down, share it with the team and plan to it every week.',
      },
      {
        type: 'p',
        text: 'A written rule does two things. It gives you a reason to say no to the easy option on a busy Wednesday, and it gives the team something to hold you to. Both matter more than the exact number of weekends you choose.',
      },
      {
        type: 'p',
        text: 'Leave room for people who want weekends. Students, parents with weekday care and anyone saving up often ask for them, and a rule that stops them is as unpopular as one that ignores everyone else. Record who opted in, and plan them first.',
      },
      { type: 'h2', id: 'exceptions', text: 'When you have to break it' },
      {
        type: 'p',
        text: 'Some weeks you will. A festival, a stocktake or two people off sick can leave no fair option. Break the rule openly: tell the person why, and give them the next free weekend before anyone else gets one.',
      },
      { type: 'h2', id: 'showing', text: 'Showing it is working' },
      {
        type: 'p',
        text: 'Fairness people can see is worth more than fairness they are told about. Rostra shows each person their weekend balance over the last eight weeks, and shows managers anyone drifting above the line.',
      },
      {
        type: 'p',
        text: 'Review the balance once a month with the team, not just on your own. A two minute look at a chart in the staff meeting does more for trust than any policy document, and it surfaces the quiet weekend workers before they burn out.',
      },
      {
        type: 'p',
        text: 'After three months, most of the teams we work with see weekend balances settle within one weekend of each other, and the number of swap requests for Saturdays drops with it.',
      },
    ],
  },
  {
    slug: 'open-shifts',
    title: 'Open shifts: fill gaps without the group chat',
    excerpt:
      'Post a gap once, and the first qualified person to claim it gets it. How open shifts work and when to use them.',
    date: '2026-10-07',
    author: { name: 'Mira Castellanos', role: 'Customer success' },
    tag: 'Product',
    cover: 'swap',
    body: [
      {
        type: 'p',
        text: 'Every rota has gaps: a sick day, a busy Saturday, a new opening hour. Until now the fix was a message to the whole team and a race to answer it.',
      },
      {
        type: 'p',
        text: 'Group chats are fast, but they are noisy and unfair. The same people answer every time, nobody can see whether the person who answered is qualified, and the manager still has to update the rota by hand once the dust settles.',
      },
      {
        type: 'p',
        text: 'Open shifts move that whole exchange into the rota itself.',
      },
      { type: 'h2', id: 'how', text: 'How it works' },
      {
        type: 'ol',
        items: [
          'Post the shift with its role, hours and pay rate.',
          'Everyone qualified and available gets one notification.',
          'The first to claim it gets it, and the rota updates for everyone.',
        ],
      },
      {
        type: 'p',
        text: 'Only people who hold the role, are free at that time and would stay inside their rest and hour limits see the shift. Nobody is offered a shift they cannot take, and nobody has to check a spreadsheet before saying yes.',
      },
      {
        type: 'p',
        text: 'You choose whether a claim needs your approval. Most teams approve automatically for short shifts and keep approval for anything over eight hours or at a premium rate.',
      },
      { type: 'h2', id: 'when', text: 'When to use it' },
      {
        type: 'p',
        text: 'Open shifts work best for extra cover and short notice gaps. For regular hours, plan them into the rota so people can count on them.',
      },
      {
        type: 'p',
        text: 'Pay rates travel with the shift. If a gap pays a weekend or short notice premium, the person claiming it sees the rate before they say yes, and the timesheet picks it up without anyone typing it in again.',
      },
      { type: 'h2', id: 'fair', text: 'Keeping it fair' },
      {
        type: 'p',
        text: 'Speed rewards whoever looks at their phone first. To spread the work, set a weekly cap on open shifts per person, or hold a new shift for an hour so part time staff who want more hours see it before everyone else.',
      },
      {
        type: 'p',
        text: 'The open shift report shows who claimed what over the last month. If the same two names fill every gap, it is a sign the base rota is short, not that the system is working.',
      },
    ],
  },
  {
    slug: 'rest-rules-checklist',
    title: 'Rest rules in plain words: a checklist for managers',
    excerpt:
      'Breaks, daily rest and weekly rest, written as checks you can run on a rota before it goes out.',
    date: '2026-09-23',
    author: { name: 'Aiko Brennan', role: 'People operations' },
    tag: 'Guide',
    cover: 'request',
    body: [
      {
        type: 'p',
        text: 'Rest rules differ by country and by contract, so check the ones that apply to you. The checks below are the shape most of them share. This article is general guidance, not legal advice.',
      },
      {
        type: 'p',
        text: 'The checks are worth running every week, not just when a complaint arrives. A shift that breaks a rest rule is far cheaper to fix on the planning screen than after someone has worked it tired.',
      },
      { type: 'h2', id: 'checks', text: 'The checks' },
      {
        type: 'ul',
        items: [
          'A break in every shift over six hours.',
          'Enough hours between the end of one shift and the start of the next.',
          'At least one full day off in every week.',
        ],
      },
      { type: 'h2', id: 'breaks', text: 'Breaks' },
      {
        type: 'p',
        text: 'Plan breaks into the shift rather than leaving them to the floor. A break that only exists on paper tends to vanish on a busy day, and the person who skipped it is the one who makes mistakes at the end of the shift.',
      },
      { type: 'h2', id: 'rest', text: 'Rest between shifts' },
      {
        type: 'p',
        text: 'The classic trap is the close followed by an open: a shift ending at 23:00 and the next one starting at 07:00. It looks fine on a grid of days and is often below the minimum rest. Check the gap, not just the dates.',
      },
      { type: 'h2', id: 'weekly', text: 'Weekly rest' },
      {
        type: 'p',
        text: 'Count rest across the week a person actually works, including swaps and open shifts they picked up. Extra shifts claimed after the rota went out are where weekly rest usually breaks.',
      },
      { type: 'h2', id: 'minors', text: 'Younger workers' },
      {
        type: 'p',
        text: 'If you employ anyone under eighteen, their limits are usually stricter: shorter days, longer breaks and no late shifts. Mark them in their profile once so every check uses the right rules, rather than relying on whoever plans the week to remember.',
      },
      { type: 'h2', id: 'automate', text: 'Let the rota check itself' },
      {
        type: 'p',
        text: 'Rostra runs your rules as you plan and marks a shift that breaks one before you publish, so the fix happens on Wednesday instead of in an audit.',
      },
    ],
  },
];

export function articleBySlug(slug: string): Article | undefined {
  return ARTICLES.find((article) => article.slug === slug);
}

/** Words in an article, for its reading time. */
export function articleText(article: Article): string {
  return article.body
    .map((block) => {
      switch (block.type) {
        case 'ul':
        case 'ol':
          return block.items.join(' ');
        default:
          return block.text;
      }
    })
    .join(' ');
}
