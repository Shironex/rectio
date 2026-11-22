/** Every word the org chart says, for apps that translate or reword them. Server safe. */
export interface OrgChartMessages {
  title: string;
  /** Under the title: `214 people`. */
  summary: (people: number) => string;
  /** Names the tree. */
  tree: string;
  search: string;
  /** Said as a search settles: `3 people found`. */
  results: (count: number) => string;
  noResults: (query: string) => string;
  /** One search result: the name and what they do. */
  resultDetail: (title: string | undefined, department: string | undefined) => string;
  /** Read after a row with reports: `12 in their team`. */
  team: (count: number) => string;
  reportsTo: string;
  /** The person at the top has no manager. */
  topOfOrg: string;
  directReports: (count: number) => string;
  teamSize: (count: number) => string;
  /** The button under the list of direct reports when it is cut short. */
  moreReports: (count: number) => string;
  viewProfile: string;
  email: string;
  /** Phone: the button back to the manager. */
  upTo: (name: string) => string;
  /** Phone: the button back to the top. */
  upToTop: string;
  /** Phone: the list heading at the top of the org. */
  topLevel: string;
  /** Phone: names the button that opens a person's team. */
  openTeam: (name: string, count: number) => string;
  /** Said when the phone list moves to a person. */
  showingTeam: (name: string) => string;
  /** Before anyone is picked. */
  pickHint: string;
  emptyTitle: string;
  emptyNote: string;
}

const people = (count: number) => (count === 1 ? '1 person' : `${String(count)} people`);

export const ORG_CHART_MESSAGES: OrgChartMessages = {
  title: 'Organisation',
  summary: people,
  tree: 'Organisation chart',
  search: 'Find a person',
  results: (count) => (count === 1 ? '1 person found' : `${String(count)} people found`),
  noResults: (query) => `Nobody matches “${query}”.`,
  resultDetail: (title, department) => [title, department].filter(Boolean).join(', '),
  team: (count) => `${String(count)} in their team`,
  reportsTo: 'Reports to',
  topOfOrg: 'Top of the organisation',
  directReports: (count) => (count === 1 ? '1 direct report' : `${String(count)} direct reports`),
  teamSize: (count) => `${people(count)} in their team`,
  moreReports: (count) => `Show ${String(count)} more`,
  viewProfile: 'View profile',
  email: 'Email',
  upTo: (name) => `Up to ${name}`,
  upToTop: 'Up to the top',
  topLevel: 'Leadership',
  openTeam: (name, count) => `Open ${name}'s team, ${people(count)}`,
  showingTeam: (name) => `Showing ${name} and their team`,
  pickHint: 'Pick a person to see who they report to and who reports to them.',
  emptyTitle: 'No people yet',
  emptyNote: 'Add people with their managers to draw the chart.',
};
